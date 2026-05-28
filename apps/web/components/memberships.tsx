"use client";

import { motion } from "framer-motion";
import { Check, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { memberships } from "@/lib/data";
import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const fallbackMemberships = [
  {
    name: "Monthly Pass",
    price: 1500,
    description: "Best value for regular learners who need a focused monthly study routine.",
    features: ["Reading room access", "AC study hall", "High-speed WiFi", "Individual cabins", "Drinking water", "CCTV security"],
    featured: true
  }
];

export function Memberships() {
  const router = useRouter();
  const visibleMemberships = Array.isArray(memberships) && memberships.length > 0 ? memberships : fallbackMemberships;

  return (
    <Section
      eyebrow="Memberships"
      title="Simple monthly membership"
      description="One clear monthly plan for students who want a focused, comfortable, and consistent study space."
    >
      <div id="memberships" className="grid max-w-md gap-5">
        {visibleMemberships.map((plan, index) => {
          const features = Array.isArray(plan.features) ? plan.features : [];
          return (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }}>
              {plan.featured ? (
                /* Featured card — plain div to prevent glass override */
                <div className="relative h-full rounded-lg border border-lagoon/60 p-6" style={{ background: "#0f172a", color: "#ffffff" }}>
                  <span className="absolute right-4 top-4 rounded-full bg-lagoon px-3 py-1 text-xs font-semibold" style={{ color: "#0f172a" }}>Popular</span>
                  <h3 className="text-xl font-semibold" style={{ color: "#ffffff" }}>{plan.name}</h3>
                  <p className="mt-3 text-sm" style={{ color: "#94a3b8" }}>{plan.description}</p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="text-4xl font-semibold" style={{ color: "#ffffff" }}>₹{plan.price}</span>
                    <span className="pb-1 text-sm" style={{ color: "#64748b" }}>/ plan</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: "#ffffff" }}>
                        <Check className="h-4 w-4 text-lagoon" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="premium" className="mt-7 w-full" onClick={() => router.push("/booking")}>
                    <CreditCard className="h-4 w-4" />
                    Book a seat
                  </Button>
                </div>
              ) : (
                <Card className="h-full">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="text-4xl font-semibold">₹{plan.price}</span>
                    <span className="pb-1 text-sm text-slate-500">/ plan</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-lagoon" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="mt-7 w-full" onClick={() => router.push("/booking")}>
                    <CreditCard className="h-4 w-4" />
                    Book a seat
                  </Button>
                </Card>
              )}
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
