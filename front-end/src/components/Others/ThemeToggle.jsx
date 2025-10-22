import { Moon, Sun } from "lucide-react";
import { useUiStore } from "@/stores/useUiStore";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle() {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const [isAnimating, setIsAnimating] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    requestAnimationFrame(() => {
      root.classList.remove("light", "dark");
      void root.offsetHeight;
      root.classList.add(theme);
    });
  }, [theme]);

  const handleToggle = () => {
    if (isAnimating) return; // Prevent double-clicks during animation

    setIsAnimating(true);
    requestAnimationFrame(() => {
      toggleTheme();
    });
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="w-10 h-10 relative overflow-hidden hover:bg-accent transition-colors"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Current: ${theme}. Click to toggle.`}
      disabled={isAnimating}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "light" ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0, opacity: 0 }}
            transition={{
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0, opacity: 0 }}
            transition={{
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="h-5 w-5" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple effect on click */}
      {isAnimating && (
        <motion.div
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 rounded-full bg-primary/30"
          style={{ willChange: "transform, opacity" }}
        />
      )}
    </Button>
  );
}
