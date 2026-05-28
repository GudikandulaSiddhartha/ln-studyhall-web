"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredAuth } from "@/lib/api";

export function WelcomePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Don't show if already logged in
    const stored = getStoredAuth();
    if (stored) return;

    // Don't show if already dismissed this session
    const dismissed = sessionStorage.getItem("ln_welcome_dismissed");
    if (dismissed) return;

    // Show after 1.2s delay
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    sessionStorage.setItem("ln_welcome_dismissed", "1");
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          />

          {/* Popup */}
          <motion.div
            key="popup"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-x-4 top-1/2 z-[101] mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 transition hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Logo */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-ink text-white shadow-lg dark:bg-white dark:text-ink">
                <BookOpen className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Welcome to LN StudyHall
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Book your seat, track attendance, and manage your membership — all in one place.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3">
              <Button asChild variant="premium" className="w-full" onClick={dismiss}>
                <Link href="/register">
                  <UserPlus className="h-4 w-4" />
                  Create account
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full" onClick={dismiss}>
                <Link href="/signin">
                  <LogIn className="h-4 w-4" />
                  Sign in to your account
                </Link>
              </Button>
            </div>

            {/* Skip */}
            <button
              onClick={dismiss}
              className="mt-4 w-full text-center text-xs text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
            >
              Continue browsing without signing in
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
