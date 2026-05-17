const BASE = 'https://api.github.com'

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function request(token, path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers(token), ...(options.headers || {}) },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err.message || `GitHub API error ${res.status}`
    if (res.status === 403 && msg.includes('Resource not accessible')) {
      throw new Error(
        'Sin permisos para escribir en este repo. ' +
        'Tokens clásicos: necesitas el scope "workflow". ' +
        'Tokens fine-grained: selecciona "All repositories" y activa Contents + Actions (R/W).'
      )
    }
    if (res.status === 403) throw new Error(`Acceso denegado: ${msg}`)
    if (res.status === 404) {
      const e = new Error(msg)
      e.status = 404
      throw e
    }
    throw new Error(msg)
  }
  return res.json()
}

export async function getUser(token) {
  return request(token, '/user')
}

export async function getRepos(token) {
  const all = []
  let page = 1
  while (true) {
    const batch = await request(token, `/user/repos?per_page=100&page=${page}&sort=updated`)
    all.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return all
}

export async function getDependabotAlerts(token, owner, repo) {
  try {
    const alerts = await request(token, `/repos/${owner}/${repo}/dependabot/alerts?state=open&per_page=100`)
    return alerts
  } catch {
    return []
  }
}

export async function scanAllRepos(token, user, repos, onProgress) {
  const results = []
  for (let i = 0; i < repos.length; i++) {
    onProgress(i + 1, repos.length)
    const alerts = await getDependabotAlerts(token, user, repos[i].name)
    if (alerts.length > 0) {
      results.push({
        name: repos[i].name,
        full_name: repos[i].full_name,
        private: repos[i].private,
        language: repos[i].language,
        html_url: repos[i].html_url,
        count: alerts.length,
        alerts: processAlerts(alerts),
      })
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 80))
  }
  return results.sort((a, b) => b.count - a.count)
}

function processAlerts(alerts) {
  const byPackage = {}
  for (const alert of alerts) {
    const pkg = alert.dependency?.package?.name || 'unknown'
    const severity = alert.security_advisory?.severity || 'unknown'
    const summary = alert.security_advisory?.summary || ''
    const fixedIn = alert.security_vulnerability?.first_patched_version?.identifier || null
    const currentRange = alert.security_vulnerability?.vulnerable_version_range || ''
    const cve = alert.security_advisory?.cve_id || ''
    const ghsa = alert.security_advisory?.ghsa_id || ''
    const ecosystem = alert.dependency?.package?.ecosystem || ''

    if (!byPackage[pkg]) {
      byPackage[pkg] = {
        package: pkg,
        ecosystem,
        alerts: 0,
        severities: [],
        fixes: [],
        summaries: [],
        cves: [],
        ghsas: [],
        vulnerable_range: currentRange,
      }
    }
    byPackage[pkg].alerts++
    if (!byPackage[pkg].severities.includes(severity)) byPackage[pkg].severities.push(severity)
    if (fixedIn && !byPackage[pkg].fixes.includes(fixedIn)) byPackage[pkg].fixes.push(fixedIn)
    if (summary && !byPackage[pkg].summaries.includes(summary)) byPackage[pkg].summaries.push(summary)
    if (cve && !byPackage[pkg].cves.includes(cve)) byPackage[pkg].cves.push(cve)
    if (ghsa && !byPackage[pkg].ghsas.includes(ghsa)) byPackage[pkg].ghsas.push(ghsa)
  }

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, unknown: 4 }
  return Object.values(byPackage).sort((a, b) => {
    const aMax = Math.min(...a.severities.map(s => severityOrder[s] ?? 4))
    const bMax = Math.min(...b.severities.map(s => severityOrder[s] ?? 4))
    return aMax - bMax
  }).map(pkg => ({
    ...pkg,
    maxSeverity: pkg.severities.includes('critical') ? 'critical'
      : pkg.severities.includes('high') ? 'high'
      : pkg.severities.includes('medium') ? 'medium'
      : pkg.severities.includes('low') ? 'low' : 'unknown',
    hasfix: pkg.fixes.length > 0,
  }))
}

// ── Shared helpers ──────────────────────────────────────────────────────────

async function enableWorkflowPRPermissions(token, owner, repo) {
  try {
    await request(token, `/repos/${owner}/${repo}/actions/permissions/workflow`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        default_workflow_permissions: 'write',
        can_approve_pull_request_reviews: true,
      }),
    })
  } catch { /* non-critical — continue */ }
}

// ── Fix via GitHub Actions ──────────────────────────────────────────────────

const WORKFLOW_PATH = '.github/workflows/security-fix.yml'

const WORKFLOW_CONTENT = `name: Security Fix
on:
  workflow_dispatch:
env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
jobs:
  fix:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install --legacy-peer-deps || true
      - name: Fix vulnerabilities
        run: npm audit fix --force || true
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: 'chore: fix security vulnerabilities'
          title: 'chore: actualizar dependencias (fix de seguridad)'
          body: |
            ## Actualización de Seguridad

            Este PR fue generado automáticamente por **GitHub Vulnerability Checker**.

            Ejecuta \`npm audit\` tras el merge para verificar que las vulnerabilidades fueron resueltas.
          branch: security-fix-auto
          delete-branch: true
`

export async function pushWorkflowAndFix(token, owner, repo) {
  await enableWorkflowPRPermissions(token, owner, repo)

  // Check if workflow already exists
  let sha = null
  try {
    const existing = await request(token, `/repos/${owner}/${repo}/contents/${WORKFLOW_PATH}`)
    sha = existing.sha
  } catch {
    // File doesn't exist yet, that's fine
  }

  const content = btoa(unescape(encodeURIComponent(WORKFLOW_CONTENT)))

  const body = {
    message: 'chore: add security fix workflow',
    content,
    ...(sha ? { sha } : {}),
  }

  // Create/update the workflow file
  try {
    await request(token, `/repos/${owner}/${repo}/contents/${WORKFLOW_PATH}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    if (err.status === 404) {
      throw new Error(
        `No se puede acceder a "${repo}". ` +
        'Con tokens fine-grained asegúrate de seleccionar "All repositories" (no solo repos públicos). ' +
        'Con tokens clásicos verifica que el repo exista y el token tenga scope "repo" completo.'
      )
    }
    throw err
  }

  // Get default branch
  let defaultBranch = 'main'
  try {
    const repoInfo = await request(token, `/repos/${owner}/${repo}`)
    defaultBranch = repoInfo.default_branch || 'main'
  } catch {
    // fallback to main
  }

  // Trigger the workflow
  try {
    await request(token, `/repos/${owner}/${repo}/actions/workflows/security-fix.yml/dispatches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: defaultBranch }),
    })
  } catch {
    // Try main/master as fallbacks
    for (const ref of ['main', 'master']) {
      if (ref === defaultBranch) continue
      try {
        await request(token, `/repos/${owner}/${repo}/actions/workflows/security-fix.yml/dispatches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref }),
        })
        break
      } catch { /* continue */ }
    }
  }

  return {
    workflowUrl: `https://github.com/${owner}/${repo}/actions`,
    repoUrl: `https://github.com/${owner}/${repo}`,
  }
}

// ── Migrate npm → pnpm via GitHub Actions ──────────────────────────────────

const MIGRATE_WORKFLOW_PATH = '.github/workflows/migrate-to-pnpm.yml'

const MIGRATE_WORKFLOW_CONTENT = `name: Migrate to pnpm
on:
  workflow_dispatch:
env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
jobs:
  migrate:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Migrate lockfile
        run: |
          rm -f package-lock.json yarn.lock
          pnpm install --no-frozen-lockfile || true
      - name: Update package.json scripts
        run: |
          node -e "
          const fs = require('fs');
          try {
            let content = fs.readFileSync('package.json', 'utf8');
            content = content
              .replace(/\\"npm run /g, '\\"pnpm run ')
              .replace(/\\"npm install/g, '\\"pnpm install')
              .replace(/\\"npm ci/g, '\\"pnpm install --frozen-lockfile');
            fs.writeFileSync('package.json', content);
            console.log('package.json updated');
          } catch(e) { console.log('Skipped:', e.message); }
          " || true
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: 'chore: migrate from npm to pnpm'
          title: 'chore: migrar de npm a pnpm'
          body: |
            ## Migración npm → pnpm

            Este PR fue generado automáticamente por **GitHub Vulnerability Checker**.

            ### Cambios realizados
            - Eliminado \`package-lock.json\`
            - Generado \`pnpm-lock.yaml\` con las mismas dependencias
            - Referencias \`npm run\` → \`pnpm run\` actualizadas en scripts

            ### Pasos después del merge
            1. Instala pnpm si no lo tienes: \`npm install -g pnpm\`
            2. Usa \`pnpm install\` en vez de \`npm install\`
            3. Usa \`pnpm run <script>\` en vez de \`npm run <script>\`
          branch: migrate-to-pnpm
          delete-branch: true
`

export async function pushMigrateWorkflow(token, owner, repo) {
  await enableWorkflowPRPermissions(token, owner, repo)

  let sha = null
  try {
    const existing = await request(token, `/repos/${owner}/${repo}/contents/${MIGRATE_WORKFLOW_PATH}`)
    sha = existing.sha
  } catch { }

  const content = btoa(unescape(encodeURIComponent(MIGRATE_WORKFLOW_CONTENT)))

  try {
    await request(token, `/repos/${owner}/${repo}/contents/${MIGRATE_WORKFLOW_PATH}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'chore: add pnpm migration workflow',
        content,
        ...(sha ? { sha } : {}),
      }),
    })
  } catch (err) {
    if (err.status === 404) {
      throw new Error(
        `No se puede acceder a "${repo}". ` +
        'Con tokens fine-grained asegúrate de seleccionar "All repositories" y activar Contents + Actions (R/W).'
      )
    }
    throw err
  }

  let defaultBranch = 'main'
  try {
    const repoInfo = await request(token, `/repos/${owner}/${repo}`)
    defaultBranch = repoInfo.default_branch || 'main'
  } catch { }

  try {
    await request(token, `/repos/${owner}/${repo}/actions/workflows/migrate-to-pnpm.yml/dispatches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: defaultBranch }),
    })
  } catch {
    for (const ref of ['main', 'master']) {
      if (ref === defaultBranch) continue
      try {
        await request(token, `/repos/${owner}/${repo}/actions/workflows/migrate-to-pnpm.yml/dispatches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref }),
        })
        break
      } catch { }
    }
  }

  return {
    workflowUrl: `https://github.com/${owner}/${repo}/actions`,
    repoUrl: `https://github.com/${owner}/${repo}`,
  }
}
