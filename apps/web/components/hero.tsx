"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, Headphones, Sparkles } from "lucide-react";
import { AnimatedBook } from "@/components/animated-book";
import { Button } from "@/components/ui/button";
import { ThemeLamp } from "@/components/theme-lamp";
import { trustBadges } from "@/lib/data";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <ThemeLamp />
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-10 top-40 h-2 w-2 rounded-full bg-lagoon shadow-glow" />
        <div className="absolute right-1/3 top-28 h-1.5 w-1.5 rounded-full bg-brass shadow-warm" />
        <div className="absolute bottom-28 left-1/4 h-2 w-2 rounded-full bg-neon shadow-glow" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[rgb(var(--background))] to-transparent" />
      </div>
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/50 px-4 py-2 text-sm font-semibold text-ink backdrop-blur dark:border-white/15 dark:bg-white/5 dark:text-white">
            <Sparkles className="h-4 w-4 text-lagoon" />
            Premium study spaces with live booking
          </div>
          <h1 className="font-display text-6xl font-semibold leading-[0.95] tracking-normal text-ink dark:text-white sm:text-7xl lg:text-8xl">
            LN StudyHall
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Book silent seats, private cabins, 24/7 access, and exam-ready study environments with a polished digital experience for students, admins, and branch managers.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="premium">
              <Link href="/booking">
                Book a seat
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/dashboard">
                <CalendarCheck className="h-5 w-5" />
                User dashboard
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="glass flex items-center gap-3 rounded-lg p-3">
                <badge.icon className="h-5 w-5 text-lagoon" />
                <span className="text-sm font-medium">{badge.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.1 }} className="relative">
          <AnimatedBook />
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity }} className="glass absolute -bottom-6 left-2 max-w-xs rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-lagoon/15">
                <Headphones className="h-5 w-5 text-lagoon" />
              </span>
              <div>
                <p className="text-sm font-semibold">LN AI Assistant</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Memberships, timings, booking help</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
