import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useUiStore } from "@/stores/useUiStore";

export default function BackgroundAnimation() {
  const [mounted, setMounted] = useState(false);
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Adjust colors based on theme
  const isDark = theme === "dark";

  // Generate bubbles with random pop behavior
  const bubbles = Array.from({ length: 20 }, (_, i) => {
    const size = Math.random() * 60 + 20; // 20-80px
    const shouldPop = Math.random() > 0.6; // 40% chance to pop randomly
    const popHeight = shouldPop ? Math.random() * 60 + 20 : 100; // Pop at 20-80% height
    
    return {
      id: i,
      size,
      left: Math.random() * 95 + 2.5,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 8,
      shouldPop,
      popHeight,
    };
  });

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{
        zIndex: 1,
      }}
    >
      {/* Realistic bubble animations */}
      {bubbles.map((bubble) => {
        const maxY = bubble.shouldPop 
          ? -(window.innerHeight * (bubble.popHeight / 100))
          : -window.innerHeight - 100;

        return (
          <motion.div
            key={bubble.id}
            className="absolute rounded-full"
            style={{
              width: bubble.size,
              height: bubble.size,
              left: `${bubble.left}%`,
              bottom: -bubble.size,
              // Realistic bubble gradient: light center, transparent edges
              background: isDark
                ? `radial-gradient(circle at 30% 30%, 
                    rgba(255, 255, 255, 0.3) 0%, 
                    rgba(173, 216, 230, 0.25) 30%, 
                    rgba(111, 183, 232, 0.15) 60%, 
                    transparent 100%)`
                : `radial-gradient(circle at 30% 30%, 
                    rgba(255, 255, 255, 0.8) 0%, 
                    rgba(173, 216, 230, 0.6) 30%, 
                    rgba(111, 183, 232, 0.4) 60%, 
                    transparent 100%)`,
              // Bubble shine effect
              boxShadow: isDark
                ? `inset -${bubble.size * 0.15}px -${bubble.size * 0.15}px ${bubble.size * 0.3}px rgba(255, 255, 255, 0.15),
                   inset ${bubble.size * 0.1}px ${bubble.size * 0.1}px ${bubble.size * 0.2}px rgba(255, 255, 255, 0.1)`
                : `inset -${bubble.size * 0.15}px -${bubble.size * 0.15}px ${bubble.size * 0.3}px rgba(255, 255, 255, 0.6),
                   inset ${bubble.size * 0.1}px ${bubble.size * 0.1}px ${bubble.size * 0.2}px rgba(255, 255, 255, 0.4)`,
              border: isDark 
                ? '1px solid rgba(173, 216, 230, 0.2)'
                : '1px solid rgba(173, 216, 230, 0.4)',
              filter: 'blur(5px)',
            }}
            animate={{
              y: [-bubble.size, maxY],
              x: [
                0,
                Math.sin(bubble.id) * 30, // Wobble left/right
                Math.cos(bubble.id) * 30,
                0
              ],
              opacity: bubble.shouldPop 
                ? [0, 0.8, 0.8, 0] // Pop: fade out at the end
                : [0, 0.8, 0.8, 0], // Normal: fade out at top
              scale: bubble.shouldPop
                ? [0.8, 1, 1.1, 0] // Pop: suddenly disappear
                : [0.8, 1, 1.05, 1], // Normal: slight size change
            }}
            transition={{
              duration: bubble.duration,
              delay: bubble.delay,
              repeat: Infinity,
              ease: "easeInOut",
              times: bubble.shouldPop 
                ? [0, 0.3, 0.7, 1] // Pop timing
                : [0, 0.2, 0.8, 1], // Normal timing
            }}
          />
        );
      })}
      
      {/* Ambient gradient orbs for depth */}
      <motion.div
        className="absolute rounded-full"
        style={{
          top: '15%',
          left: '10%',
          width: 500,
          height: 500,
          background: isDark
            ? 'radial-gradient(circle, rgba(111, 183, 232, 0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(111, 183, 232, 0.25) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.6, 0.4],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          bottom: '15%',
          right: '10%',
          width: 500,
          height: 500,
          background: isDark
            ? 'radial-gradient(circle, rgba(214, 184, 255, 0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(214, 184, 255, 0.25) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          scale: [1.15, 1, 1.15],
          opacity: [0.6, 0.4, 0.6],
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
