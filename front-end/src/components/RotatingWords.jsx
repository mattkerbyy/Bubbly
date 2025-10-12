import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function RotatingWords({ words, className = '' }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length)
    }, 3000) // Change word every 3 seconds

    return () => clearInterval(interval)
  }, [words.length])

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={currentIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        {words[currentIndex]}
      </motion.span>
    </AnimatePresence>
  )
}
