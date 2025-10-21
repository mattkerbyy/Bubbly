import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Helper to get system theme
const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Helper to get initial theme (prioritize stored, fallback to system)
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'
  
  try {
    const stored = localStorage.getItem('bubbly-ui')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.state?.theme) {
        return parsed.state.theme
      }
    }
  } catch (error) {
    // Failed to read stored theme - fall back to system theme
  }
  
  return getSystemTheme()
}

export const useUiStore = create(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      showModal: false,
      setTheme: (theme) => {
        set({ theme })
        // Apply theme immediately to DOM
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },
      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      },
      toggleModal: () => set((state) => ({ showModal: !state.showModal })),
    }),
    {
      name: 'bubbly-ui',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
