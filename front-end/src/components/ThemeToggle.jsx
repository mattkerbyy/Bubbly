import { Moon, Sun } from 'lucide-react'
import { useUiStore } from '@/stores/useUiStore'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function ThemeToggle() {
  const theme = useUiStore((state) => state.theme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)

  // Apply theme on mount and changes
  useEffect(() => {
    const root = document.documentElement
    // Remove both classes first to ensure clean state
    root.classList.remove('light', 'dark')
    
    // Add the current theme class
    root.classList.add(theme)
  }, [theme])

  const handleToggle = () => {
    toggleTheme()
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="w-10 h-10 relative"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Current: ${theme}. Click to toggle.`}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Sun className="h-5 w-5 transition-transform duration-200 hover:rotate-90" />
      )}
    </Button>
  )
}
