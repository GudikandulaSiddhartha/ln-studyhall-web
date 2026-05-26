"use client";

import { useState } from "react";
import { Clock, MapPinned, Navigation, Phone } from "lucide-react";
import { branches } from "@/lib/data";
import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function BranchMap() {
  const [selected, setSelected] = useState(branches[0]);
  const phoneHref = `tel:+91${selected.phone.split(",")[0].replace(/\D/g, "")}`;

  return (
    <Section eyebrow="Branches" title="LN StudyHall branch locations" description="Find the nearest LN StudyHall branch, check landmarks, facilities, hours, and open the exact Google Maps navigation link.">
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-3">
          {branches.map((branch) => (
            <button key={branch.id} onClick={() => setSelected(branch)} className="glass w-full rounded-lg p-5 text-left transition hover:-translate-y-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{branch.name}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{branch.area}</p>
                  <p className="mt-2 text-xs text-lagoon">{branch.landmark}</p>
                </div>
                <span className="rounded-full bg-lagoon/15 px-3 py-1 text-xs font-semibold text-lagoon">{branch.hours}</span>
              </div>
            </button>
          ))}
        </div>
        <Card className="relative min-h-[34rem] overflow-hidden p-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(45,212,191,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,.12)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-neon/20 dark:from-slate-950/70" />
          {branches.map((branch, index) => (
            <button
              key={branch.id}
              onClick={() => setSelected(branch)}
              className="absolute grid h-12 w-12 place-items-center rounded-full bg-ink text-white shadow-glow transition hover:scale-110 dark:bg-neon dark:text-ink"
              style={{ left: `${22 + index * 24}%`, top: `${26 + (index % 2) * 24}%` }}
              aria-label={`Select ${branch.name}`}
            >
              <MapPinned className="h-5 w-5" />
            </button>
          ))}
          <div className="glass absolute bottom-5 left-5 right-5 rounded-lg p-5">
            <h3 className="text-xl font-semibold">{selected.name}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{selected.area}</p>
            <p className="mt-1 text-sm text-lagoon">{selected.landmark}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brass/15 px-3 py-1 text-xs font-semibold text-brass">
                <Clock className="h-3.5 w-3.5" />
                {selected.hours}
              </span>
              {selected.facilities.map((facility) => (
                <span key={facility} className="rounded-full bg-lagoon/15 px-3 py-1 text-xs font-semibold text-lagoon">
                  {facility}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="premium">
                <a href={selected.mapsUrl} target="_blank" rel="noreferrer">
                  <Navigation className="h-4 w-4" />
                  Navigate
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={phoneHref}>
                  <Phone className="h-4 w-4" />
                  {selected.phone}
                </a>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Section>
  );
}
