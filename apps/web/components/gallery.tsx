"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";

type GalleryMedia = {
  src: string;
  alt: string;
  type?: "image" | "video";
  poster?: string;
};

const slides: { title: string; eyebrow: string; description: string; images: GalleryMedia[] }[] = [
  {
    title: "Cabin Focus Zone",
    eyebrow: "Individual cabin views",
    description: "Dedicated study cabins with teal privacy panels, ergonomic chairs, charging points, and bright focused lighting.",
    images: [
      { src: "/gallery/cabin-focus-main.jpeg", alt: "LN StudyHall individual cabin rows with teal study partitions" },
      { src: "/gallery/cabin-focus-wide.jpeg", alt: "Wide view of LN StudyHall cabin seating area" },
      { src: "/gallery/cabin-focus-close.jpeg", alt: "Close view of cabin seating and study desks" },
      { src: "/gallery/ln-studyhall-timeline.mp4", alt: "Video walkthrough of LN StudyHall", type: "video", poster: "/gallery/cabin-focus-main.jpeg" }
    ]
  },
  {
    title: "Silent Rooms",
    eyebrow: "Quiet reading rooms",
    description: "Calm reading spaces with organized cabin rows, library shelves, and a distraction-free environment for long sessions.",
    images: [
      { src: "/gallery/silent-room-cabins-library.jpeg", alt: "Silent room cabins beside library shelves" },
      { src: "/gallery/silent-room-library.jpeg", alt: "Silent study room with rows of cabins and bookshelves" },
      { src: "/gallery/ln-studyhall-front.jpeg", alt: "LN StudyHall exterior frontage" }
    ]
  }
];

const AUTO_SCROLL_MS = 3500;

export function Gallery() {
  const [slideIdx, setSlideIdx] = useState(0);
  const [imageIdx, setImageIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slide = slides[slideIdx]!;
  const media = slide.images[imageIdx] ?? slide.images[0]!;
  const isVideo = media.type === "video";

  // ── Auto scroll ─────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    setDirection(1);
    setImageIdx((prev) => {
      const next = prev + 1;
      if (next >= slide.images.length) {
        // Move to next slide
        setSlideIdx((s) => (s + 1) % slides.length);
        return 0;
      }
      return next;
    });
  }, [slide.images.length]);

  useEffect(() => {
    if (paused || isVideo) return;
    timerRef.current = setInterval(goNext, AUTO_SCROLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [goNext, paused, isVideo, slideIdx, imageIdx]);

  // ── Video autoplay ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, media.src]);

  function selectImage(idx: number) {
    setDirection(idx > imageIdx ? 1 : -1);
    setImageIdx(idx);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function selectSlide(idx: number) {
    setDirection(idx > slideIdx ? 1 : -1);
    setSlideIdx(idx);
    setImageIdx(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function prev() {
    setDirection(-1);
    const prevIdx = imageIdx - 1;
    if (prevIdx < 0) {
      const prevSlide = (slideIdx + slides.length - 1) % slides.length;
      setSlideIdx(prevSlide);
      setImageIdx(slides[prevSlide]!.images.length - 1);
    } else {
      setImageIdx(prevIdx);
    }
  }

  function next() {
    setDirection(1);
    goNext();
  }

  return (
    <Section eyebrow="Gallery" title="Real LN StudyHall cabin views" description="Explore actual cabin-focused seating and silent study room views from LN StudyHall.">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">

        {/* ── Main viewer ─────────────────────────────────────────────────── */}
        <div className="relative min-h-[32rem] overflow-hidden rounded-lg border border-white/20 bg-ink shadow-2xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${slideIdx}-${imageIdx}`}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {isVideo ? (
                <video
                  ref={videoRef}
                  key={media.src}
                  className="absolute inset-0 h-full w-full object-cover"
                  src={media.src}
                  poster={media.poster}
                  controls
                  muted
                  playsInline
                  autoPlay
                  loop
                  preload="auto"
                />
              ) : (
                <Image
                  src={media.src}
                  alt={media.alt}
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                  priority={slideIdx === 0 && imageIdx === 0}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Gradient overlays */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

          {/* Bottom bar */}
          <div className="absolute bottom-0 inset-x-0 p-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-lagoon">{slide.eyebrow}</p>
              <h3 className="mt-1 font-display text-3xl font-semibold text-white">{slide.title}</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Pause/play auto scroll */}
              {!isVideo && (
                <Button size="icon" variant="outline" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Resume auto scroll" : "Pause auto scroll"}>
                  {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              )}
              <Button size="icon" variant="outline" onClick={prev} aria-label="Previous">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="outline" onClick={next} aria-label="Next">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-20 left-6 flex gap-1.5">
            {slide.images.map((_, i) => (
              <button
                key={i}
                onClick={() => selectImage(i)}
                className={`h-1.5 rounded-full transition-all ${i === imageIdx ? "w-6 bg-lagoon" : "w-1.5 bg-white/40"}`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ── Thumbnails sidebar ────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Thumbnail strip */}
          <div className="glass rounded-lg p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Photos & video</p>
            <div className="grid grid-cols-3 gap-2">
              {slide.images.map((item, i) => (
                <button
                  key={item.src}
                  onClick={() => selectImage(i)}
                  className={`relative h-20 overflow-hidden rounded-md border-2 transition hover:scale-[1.04] ${i === imageIdx ? "border-lagoon shadow-glow" : "border-transparent"}`}
                  aria-label={item.alt}
                >
                  <Image
                    src={item.type === "video" ? (item.poster ?? "/gallery/cabin-focus-main.jpeg") : item.src}
                    alt={item.alt}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  {item.type === "video" && (
                    <span className="absolute inset-0 grid place-items-center bg-black/40">
                      <Play className="h-6 w-6 text-white drop-shadow" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Slide switchers */}
          {slides.map((s, i) => (
            <button
              key={s.title}
              onClick={() => selectSlide(i)}
              className={`glass flex w-full items-center justify-between rounded-lg p-4 text-left transition hover:-translate-y-1 ${i === slideIdx ? "border-lagoon/40 ring-1 ring-lagoon/30" : ""}`}
            >
              <span>
                <span className="block font-medium">{s.title}</span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{s.images.length} views</span>
              </span>
              <span className="text-sm text-slate-400">0{i + 1}</span>
            </button>
          ))}

          {/* Auto scroll status */}
          <p className="text-center text-xs text-slate-400">
            {isVideo ? "Video playing" : paused ? "Auto scroll paused" : "Auto scrolling every 3.5s"}
          </p>
        </div>
      </div>
    </Section>
  );
}
