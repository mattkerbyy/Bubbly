import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnreadCount } from "@/hooks/NotifFeature/useNotifications";
import NotificationsList from "@/components/NotifFeature/NotificationsList";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [shake, setShake] = useState(false);
  const dropdownRef = useRef(null);
  const prevCountRef = useRef(0);

  const { data: unreadData, isLoading } = useUnreadCount();
  const unreadCount = unreadData?.data?.unreadCount || 0;
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        document.body.style.overflow = "hidden";
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  useEffect(() => {
    if (unreadCount > prevCountRef.current && prevCountRef.current > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

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
              {unreadCount > 99 ? "99+" : unreadCount}
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
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="
                fixed md:absolute 
                inset-x-4 top-16 md:inset-x-auto md:top-auto
                md:right-0 md:mt-2 
                w-auto md:w-96 
                max-w-md
                bg-card border border-border 
                rounded-lg shadow-xl 
                z-50 
                max-h-[calc(100vh-5rem)] md:max-h-[70vh] 
                overflow-hidden flex flex-col
              "
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Notifications</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="md:hidden h-8 w-8 p-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                <NotificationsList onClose={() => setIsOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
