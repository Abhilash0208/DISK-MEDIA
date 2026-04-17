import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUIStore = create(
  persist(
    (set, get) => ({
      theme:              'dark',
      sidebarOpen:        false,
      searchOpen:         false,
      notifCount:         0,
      notifs:             [],

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        set({ theme: next })
      },
      setTheme: (t) => {
        document.documentElement.setAttribute('data-theme', t)
        set({ theme: t })
      },
      toggleSidebar:   () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      closeSidebar:    () => set({ sidebarOpen: false }),
      toggleSearch:    () => set(s => ({ searchOpen: !s.searchOpen })),
      closeSearch:     () => set({ searchOpen: false }),
      setNotifCount:   (n) => set({ notifCount: n }),
      addNotif:        (n) => set(s => ({ notifs: [n, ...s.notifs], notifCount: s.notifCount + 1 })),
      clearNotifCount: () => set({ notifCount: 0 })
    }),
    { name: 'disk-ui', partialize: s => ({ theme: s.theme }) }
  )
)

export default useUIStore
