# GitHub Vulnerability Checker

Herramienta web para escanear vulnerabilidades Dependabot en todos tus repositorios de GitHub y corregirlas automáticamente mediante GitHub Actions — sin clonar nada, todo desde el navegador.

## Características

- **Escaneo de seguridad** — detecta alertas Dependabot en todos tus repos con desglose por severidad (crítica / alta / media / baja)
- **Fix automático** — lanza un workflow de GitHub Actions que ejecuta `npm audit fix` y abre un Pull Request con los cambios
- **Fix masivo** — selecciona varios repos y lanza todos los fixes en paralelo
- **Migración npm → pnpm** — genera un workflow que reemplaza `package-lock.json` por `pnpm-lock.yaml` y abre un PR
- **Migración masiva** — migra múltiples repos a pnpm de una sola vez
- **Estadísticas** — gráficos de vulnerabilidades por severidad y top de paquetes más problemáticos
- **Historial** — registro de fixes y migraciones lanzadas, guardado en el navegador

## Stack

| | |
|---|---|
| Framework | React 19 + Vite 6 |
| Estilos | TailwindCSS v4 |
| Estado | Zustand 5 |
| Routing | React Router 7 |
| Gráficos | Recharts |
| API | GitHub REST API (llamadas directas desde el navegador) |

## Cómo funciona

La app no tiene backend. Todas las llamadas a la API de GitHub se hacen directamente desde el navegador usando el token del usuario. El token se guarda únicamente en `localStorage` y nunca se envía a servidores externos.

```
Usuario → Pega su GitHub PAT → App llama a api.github.com → Resultados en pantalla
```

Cuando se lanza un fix o una migración:
1. La app sube un archivo `.yml` al repo vía `PUT /repos/{owner}/{repo}/contents/.github/workflows/...`
2. Dispara el workflow con `POST /repos/{owner}/{repo}/actions/workflows/.../dispatches`
3. GitHub Actions ejecuta el job y abre un Pull Request automáticamente

## Inicio rápido

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) y pega tu Personal Access Token de GitHub.

## Token de GitHub requerido

### Fine-grained (recomendado)
- Repository access: **All repositories**
- Permisos: Contents (R/W), Pull requests (R/W), Actions (R/W), Dependabot alerts (R)

### Classic
- Scopes: `repo` + `workflow` + `read:org`

## Workflows generados

### Fix de seguridad — `.github/workflows/security-fix.yml`
```yaml
- npm install
- npm audit fix --force
- Abre PR en rama: security-fix-auto
```

### Migración a pnpm — `.github/workflows/migrate-to-pnpm.yml`
```yaml
- Elimina package-lock.json
- Genera pnpm-lock.yaml con pnpm install
- Actualiza referencias npm → pnpm en package.json
- Abre PR en rama: migrate-to-pnpm
```

Ambos workflows incluyen `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` para compatibilidad con los runners de GitHub Actions.

## Build

```bash
npm run build   # genera /dist
```

El resultado es estático — se puede desplegar en Netlify, Vercel, GitHub Pages o cualquier CDN.
