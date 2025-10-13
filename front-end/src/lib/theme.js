/**
 * Theme initialization utilities
 * This ensures theme is applied immediately on page load before React hydrates
 */

// Apply theme from localStorage or system preference
export const initializeTheme = () => {
  if (typeof window === 'undefined') return

  try {
    // Check localStorage first
    const stored = localStorage.getItem('bubbly-ui')
    let theme = 'light'

    if (stored) {
      const parsed = JSON.parse(stored)
      theme = parsed.state?.theme || 'light'
    } else {
      // Fallback to system preference
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    // Apply theme class immediately
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  } catch (error) {
    // Fallback to light mode on error
    document.documentElement.classList.add('light')
  }
}

// Watch for system theme changes
export const watchSystemTheme = (callback) => {
  if (typeof window === 'undefined') return

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handler = (e) => {
    const stored = localStorage.getItem('bubbly-ui')
    // Only auto-switch if user hasn't set a preference
    if (!stored) {
      const theme = e.matches ? 'dark' : 'light'
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(theme)
      if (callback) callback(theme)
    }
  }

  mediaQuery.addEventListener('change', handler)
  
  return () => mediaQuery.removeEventListener('change', handler)
}
