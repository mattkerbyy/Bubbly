import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { REACTION_TYPES, REACTION_EMOJIS } from "@/services/ReactionFeature/reactionService";
import { cn } from "@/lib/utils";

const ReactionPicker = ({
  postId,
  onReactionChange,
  currentReaction,
  disabled,
  className,
  wrapperClassName,
  isShare = false, // eslint-disable-line no-unused-vars
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
  const containerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const handleMouseEnter = () => {
    clearTimeout(hoverTimeoutRef.current);
    clearTimeout(leaveTimeoutRef.current);

    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 200); // 200ms delay before showing
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeoutRef.current);
    clearTimeout(leaveTimeoutRef.current);

    leaveTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300); // 300ms delay before hiding
  };
  useEffect(() => {
    return () => {
      clearTimeout(hoverTimeoutRef.current);
      clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  const handleReactionClick = (reactionType) => {
    onReactionChange(reactionType);
    setIsOpen(false);
  };

  const getCurrentEmoji = () => {
    if (currentReaction) {
      return REACTION_EMOJIS[currentReaction];
    }
    return "👍"; // Default Like emoji
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative flex-1", wrapperClassName)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Reaction Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && handleReactionClick("Like")}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
          "text-muted-foreground hover:text-primary hover:bg-accent/70",
          currentReaction && "text-primary",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        aria-label="React to post"
      >
        <span className="text-xl">{getCurrentEmoji()}</span>
        <span className="text-sm font-medium">
          {currentReaction ? currentReaction : "React"}
        </span>
      </button>

      {/* Reaction Picker Popup */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{
              duration: 0.2,
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover border border-border rounded-full shadow-xl px-3 py-2 flex gap-2 z-[100]"
          >
            {Object.entries(REACTION_TYPES).map(([key, reactionType]) => (
              <motion.button
                key={reactionType}
                type="button"
                onClick={() => handleReactionClick(reactionType)}
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200",
                  "hover:bg-accent/50",
                  currentReaction === reactionType &&
                    "bg-accent/30 ring-2 ring-primary"
                )}
                whileHover={{ scale: 1.3, y: -4 }}
                whileTap={{ scale: 0.95 }}
                title={reactionType}
              >
                <span className="text-2xl">{REACTION_EMOJIS[key]}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReactionPicker;
