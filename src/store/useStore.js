import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      // Auth
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({
        token: null, user: null, repos: [], scanResults: null,
        allRepos: [], allReposLoaded: false,
      }),

      // Scan
      repos: [],
      scanResults: null,
      scanning: false,
      scanProgress: { current: 0, total: 0 },
      setRepos: (repos) => set({ repos }),
      setScanResults: (results) => set({ scanResults: results }),
      setScanning: (scanning) => set({ scanning }),
      setScanProgress: (progress) => set({ scanProgress: progress }),

      // All repos — persists across tab switches, cleared on logout or manual reload
      allRepos: [],
      allReposLoaded: false,
      setAllRepos: (repos) => set({ allRepos: repos, allReposLoaded: true }),
      clearAllRepos: () => set({ allRepos: [], allReposLoaded: false }),

      // Filters
      filterSeverity: 'all',
      filterLanguage: 'all',
      filterFixable: false,
      setFilterSeverity: (v) => set({ filterSeverity: v }),
      setFilterLanguage: (v) => set({ filterLanguage: v }),
      setFilterFixable: (v) => set({ filterFixable: v }),

      // Fix history
      fixHistory: [],
      addFixHistory: (entry) => set((state) => ({
        fixHistory: [entry, ...state.fixHistory].slice(0, 50),
      })),

      // Migrate history
      migrateHistory: [],
      addMigrateHistory: (entry) => set((state) => ({
        migrateHistory: [entry, ...state.migrateHistory].slice(0, 50),
      })),

      // Selected repo for detail
      selectedRepo: null,
      setSelectedRepo: (repo) => set({ selectedRepo: repo }),

      // Active dashboard tab — shared so StatsPage can mirror it
      activeTab: 'security',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'ghvc-store',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        fixHistory: state.fixHistory,
        migrateHistory: state.migrateHistory,
        scanResults: state.scanResults,
      }),
    }
  )
)

export default useStore
