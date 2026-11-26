import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface AnimatedNumberProps {
  value: string | number;
  className?: string;
  highlightTone?: 'default' | 'boundary' | 'wicket';
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  className = '',
  highlightTone = 'default',
}) => {
  const reduced = useReducedMotion();
  const prevRef = useRef<string | number>(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setFlash(true);
      const t = window.setTimeout(() => setFlash(false), 620);
      return () => window.clearTimeout(t);
    }
  }, [value]);

  const flashClass = !flash
    ? ''
    : highlightTone === 'boundary'
      ? 'text-[#F59E0B]'
      : highlightTone === 'wicket'
        ? 'text-[#FB7185]'
        : 'text-[#38BDF8]';

  if (reduced) {
    return (
      <span className={`font-mono tabular-nums transition-colors duration-300 ${flashClass} ${className}`}>
        {value}
      </span>
    );
  }

  return (
    <span className={`relative inline-flex overflow-hidden align-baseline ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block font-mono tabular-nums transition-colors duration-300 ${flashClass}`}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
