import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUnreadCount } from '@/hooks/useNotifications'
import NotificationsList from './NotificationsList'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [shake, setShake] = useState(false)
  const dropdownRef = useRef(null)
  const prevCountRef = useRef(0)

  const { data: unreadData, isLoading } = useUnreadCount()
  const unreadCount = unreadData?.data?.unreadCount || 0

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Shake animation when new notification arrives
  useEffect(() => {
    if (unreadCount > prevCountRef.current && prevCountRef.current > 0) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
    prevCountRef.current = unreadCount
  }, [unreadCount])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          animate={shake ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Bell className="h-5 w-5" />
        </motion.div>

        {/* Unread Count Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-0 right-0 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-bold border-2 border-background shadow-sm"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute top-0 right-0">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}
      </Button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-lg shadow-lg z-50 max-h-[70vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0">
              <h3 className="font-semibold text-lg">Notifications</h3>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              <NotificationsList onClose={() => setIsOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
