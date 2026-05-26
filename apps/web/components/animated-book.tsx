"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function AnimatedBook() {
  const bookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bookRef.current) return;
    const pages = bookRef.current.querySelectorAll(".book-page");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pages,
        { rotateY: 0, x: 0 },
        {
          rotateY: -178,
          x: -4,
          duration: 1.2,
          ease: "power3.inOut",
          stagger: 0.18,
          repeat: -1,
          repeatDelay: 1.4,
          yoyo: true
        }
      );
    }, bookRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={bookRef} className="book-cover relative mx-auto h-56 w-80 sm:h-72 sm:w-[28rem]" aria-label="Animated opening book">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-ink via-slate-900 to-slate-700 shadow-2xl dark:shadow-glow" />
      <div className="absolute left-1/2 top-4 h-[calc(100%-2rem)] w-1 rounded-full bg-brass" />
      {[0, 1, 2, 3].map((page) => (
        <div
          key={page}
          className="book-page absolute left-1/2 top-5 h-[calc(100%-2.5rem)] w-[46%] rounded-r-lg border border-brass/20 bg-gradient-to-br from-paper to-white p-4 shadow-xl"
          style={{ zIndex: 10 - page, transform: `translateZ(${page * 4}px)` }}
        >
          <div className="mb-4 h-3 w-24 rounded bg-slate-300/70" />
          <div className="space-y-2">
            <div className="h-2 rounded bg-slate-200" />
            <div className="h-2 w-4/5 rounded bg-slate-200" />
            <div className="h-2 w-2/3 rounded bg-slate-200" />
          </div>
          <div className="mt-8 grid grid-cols-3 gap-2">
            <span className="h-10 rounded bg-lagoon/20" />
            <span className="h-10 rounded bg-brass/20" />
            <span className="h-10 rounded bg-neon/20" />
          </div>
        </div>
      ))}
      <div className="absolute left-5 top-5 h-[calc(100%-2.5rem)] w-[44%] rounded-l-lg bg-gradient-to-br from-paper to-white p-5 shadow-inner">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-brass">Focus</div>
        <div className="mt-5 font-display text-3xl font-semibold text-ink">LN</div>
        <div className="mt-2 h-1 w-24 rounded bg-lagoon" />
      </div>
    </div>
  );
}
