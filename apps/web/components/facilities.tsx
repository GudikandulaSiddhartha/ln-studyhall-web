"use client";

import { motion } from "framer-motion";
import { facilities } from "@/lib/data";
import { Section } from "@/components/section";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function Facilities() {
  return (
    <Section
      eyebrow="Facilities"
      title="Everything a serious study routine needs"
      description="Every hall is designed for long, distraction-free focus with predictable comfort and operational visibility."
      className="scroll-mt-24"
    >
      <div id="facilities" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {facilities.map((facility, index) => (
          <motion.div
            key={facility.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, delay: index * 0.04 }}
            whileHover={{ y: -8, scale: 1.02 }}
          >
            <Card className="h-full">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-md bg-lagoon/15 text-lagoon dark:bg-neon/15 dark:text-neon">
                <facility.icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">{facility.title}</CardTitle>
              <CardDescription className="mt-3">{facility.description}</CardDescription>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
