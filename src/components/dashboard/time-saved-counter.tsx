"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

/** Animated count-up: "Donna saved you 4h 20m this week" */
export function TimeSavedCounter({ minutes }: { minutes: number }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => {
    const m = Math.round(v);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
  });
  const prev = useRef(0);

  useEffect(() => {
    const controls = animate(mv, minutes, {
      duration: prev.current === 0 ? 1.4 : 0.8,
      ease: "easeOut",
    });
    prev.current = minutes;
    return controls.stop;
  }, [minutes, mv]);

  return (
    <div className="mt-2 text-center">
      <p className="text-sm text-ink-soft">Donna saved you</p>
      <motion.p className="font-display text-5xl font-semibold tracking-tight text-iridescent">
        {display}
      </motion.p>
    </div>
  );
}
