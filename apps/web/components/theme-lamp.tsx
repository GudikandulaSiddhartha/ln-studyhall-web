"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";

export function ThemeLamp() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="pointer-events-none absolute right-4 top-20 h-80 w-80 sm:right-12 lg:right-24" aria-hidden>
      <motion.div
        animate={{ rotate: isDark ? -5 : 4, y: isDark ? -4 : 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute right-20 top-0 h-24 w-4 rounded-full bg-slate-800 dark:bg-slate-200"
      />
      <motion.div
        animate={{ boxShadow: isDark ? "0 0 0 rgba(96,165,250,0)" : "0 0 54px rgba(214,169,75,.75)" }}
        className="absolute right-10 top-20 h-14 w-28 rounded-t-full bg-brass dark:bg-slate-700"
      />
      <motion.div
        animate={{ opacity: isDark ? 0.07 : 0.72, scaleY: isDark ? 0.8 : 1 }}
        transition={{ duration: 0.8 }}
        className="lamp-beam absolute right-[-22px] top-32 h-60 w-64 bg-gradient-to-b from-brass/50 to-transparent"
      />
    </div>
  );
}
