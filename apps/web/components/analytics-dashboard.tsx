"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Bell, Bot, CreditCard, Users } from "lucide-react";
import { adminLogs, branches, revenue } from "@/lib/data";
import { Card } from "@/components/ui/card";

const cards = [
  { label: "Monthly revenue", value: "₹3.98L", icon: CreditCard, tone: "text-lagoon" },
  { label: "Active users", value: "1,284", icon: Users, tone: "text-neon" },
  { label: "Occupancy", value: "91%", icon: Activity, tone: "text-brass" },
  { label: "Notifications", value: "36", icon: Bell, tone: "text-plum" }
];

export function AnalyticsDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold">{card.value}</p>
              </div>
              <card.icon className={`h-6 w-6 ${card.tone}`} />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <Card>
          <h3 className="mb-6 text-lg font-semibold">Revenue and occupancy</h3>
          <div className="h-80 min-w-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue}>
                  <defs>
                    <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#2DD4BF" fill="url(#revenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </Card>
        <Card>
          <h3 className="mb-6 text-lg font-semibold">Branch occupancy</h3>
          <div className="h-80 min-w-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branches}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="occupancy" fill="#60A5FA" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-5 text-lg font-semibold">Activity logs</h3>
          <div className="space-y-3">
            {adminLogs.map((log) => (
              <div key={log} className="flex items-center gap-3 rounded-md bg-white/40 p-3 text-sm dark:bg-white/5">
                <Activity className="h-4 w-4 text-lagoon" />
                {log}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="mb-5 text-lg font-semibold">Chatbot response management</h3>
          <div className="space-y-3">
            {["Membership pricing", "Branch timings", "Seat booking", "Holiday schedule"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-md bg-white/40 p-3 dark:bg-white/5">
                <span className="flex items-center gap-2 text-sm"><Bot className="h-4 w-4 text-lagoon" />{item}</span>
                <span className="text-xs font-semibold text-lagoon">Active</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
