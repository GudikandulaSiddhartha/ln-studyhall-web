"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, SunMoon } from "lucide-react";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";

type GalleryMedia = {
  src: string;
  alt: string;
  type?: "image" | "video";
  poster?: string;
};

const slides = [
  {
    title: "Cabin Focus Zone",
    eyebrow: "Individual cabin views",
    description: "Dedicated study cabins with teal privacy panels, ergonomic chairs, charging points, and bright focused lighting.",
    images: [
      {
        src: "/gallery/cabin-focus-main.jpeg",
        alt: "LN StudyHall individual cabin rows with teal study partitions"
      },
      {
        src: "/gallery/cabin-focus-wide.jpeg",
        alt: "Wide view of LN StudyHall cabin seating area"
      },
      {
        src: "/gallery/cabin-focus-close.jpeg",
        alt: "Close view of cabin seating and study desks"
      },
      {
        src: "/gallery/ln-studyhall-timeline.mp4",
        alt: "Video walkthrough of LN StudyHall cabin focus area",
        type: "video",
        poster: "/gallery/cabin-focus-main.jpeg"
      }
    ] satisfies GalleryMedia[]
  },
  {
    title: "Silent Rooms",
    eyebrow: "Quiet reading rooms",
    description: "Calm reading spaces with organized cabin rows, library shelves, and a distraction-free environment for long sessions.",
    images: [
      {
        src: "/gallery/silent-room-cabins-library.jpeg",
        alt: "Silent room cabins beside library shelves"
      },
      {
        src: "/gallery/silent-room-library.jpeg",
        alt: "Silent study room with rows of cabins and bookshelves"
      },
      {
        src: "/gallery/ln-studyhall-front.jpeg",
        alt: "LN StudyHall exterior frontage"
      }
    ] satisfies GalleryMedia[]
  }
];

export function Gallery() {
  const [active, setActive] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const slide = slides[active];
  const image = slide.images[activeImage] ?? slide.images[0];

  function selectSlide(index: number) {
    setActive(index);
    setActiveImage(0);
  }

  function previousSlide() {
    selectSlide((active + slides.length - 1) % slides.length);
  }

  function nextSlide() {
    selectSlide((active + 1) % slides.length);
  }

  return (
    <Section eyebrow="Gallery" title="Real LN StudyHall cabin views" description="Explore actual cabin-focused seating and silent study room views from LN StudyHall.">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <motion.div key={`${slide.title}-${image.src}`} initial={{ opacity: 0.4, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative min-h-[32rem] overflow-hidden rounded-lg border border-white/20 bg-ink shadow-2xl">
          {image.type === "video" ? (
            <video
              key={image.src}
              className="absolute inset-0 h-full w-full object-cover"
              src={image.src}
              poster={image.poster}
              controls
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" priority={active === 0 && activeImage === 0} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/86 via-ink/12 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-lagoon">{slide.eyebrow}</p>
              <h3 className="mt-2 font-display text-5xl font-semibold text-white">{slide.title}</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/78">{slide.description}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="icon" variant="outline" aria-label="Previous gallery category" onClick={previousSlide}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="outline" aria-label="Next gallery category" onClick={nextSlide}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>
        <div className="space-y-4">
          <div className="glass rounded-lg p-5">
            <div className="mb-4 flex items-center gap-3">
              <SunMoon className="h-5 w-5 text-brass" />
              <h3 className="font-semibold">Cabin view set</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {slide.images.map((item, index) => (
                <button
                  key={item.src}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`relative h-24 overflow-hidden rounded-md border transition hover:scale-[1.03] ${activeImage === index ? "border-lagoon shadow-glow" : "border-white/20"}`}
                  aria-label={`Show ${item.alt}`}
                >
                  <Image src={item.type === "video" ? item.poster ?? "/gallery/cabin-focus-main.jpeg" : item.src} alt={item.alt} fill sizes="120px" className="object-cover" />
                  {item.type === "video" ? (
                    <span className="absolute inset-0 grid place-items-center bg-black/28 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                      Play
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
          {slides.map((item, index) => (
            <button key={item.title} onClick={() => selectSlide(index)} className="glass flex w-full items-center justify-between rounded-lg p-4 text-left transition hover:-translate-y-1">
              <span>
                <span className="block font-medium">{item.title}</span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{item.images.length} real views</span>
              </span>
              <span className="text-sm text-slate-500">0{index + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}
