"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, Building2, ImagePlus, MessageSquareText, UserCog, LogOut, Download } from "lucide-react";
import { getStoredAuth, clearAuth, API_URL } from "@/lib/api";
import * as XLSX from "xlsx";

const actions = [
  { label: "Manage branches", icon: Building2, href: "/admin/branches" },
  { label: "Add study hall photos", icon: ImagePlus, href: "/admin/photos" },
  { label: "Manage memberships", icon: UserCog, href: "/admin/memberships" },
  { label: "Send notifications", icon: Bell, href: "/admin/notifications" },
  { label: "Chatbot responses", icon: MessageSquareText, href: "/admin/chatbot" }
];

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right">
      <div className="text-2xl font-semibold tabular-nums text-lagoon">
        {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <div className="text-sm text-slate-500">
        {now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
      </div>
    </div>
  );
}

async function exportToExcel(token: string) {
  const res = await fetch(`${API_URL}/admin/bookings?limit=1000`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const bookings = data.bookings ?? [];

  const rows = bookings.map((b: {
    user: { name: string; phone: string | null };
    branch: { name: string };
    seat: { label: string };
    status: string;
    startAt: string;
    endAt: string;
    createdAt: string;
  }) => ({
    "Name": b.user.name,
    "Mobile Number": b.user.phone ?? "—",
    "Branch": b.branch.name,
    "Seat Number": b.seat.label,
    "Status": b.status,
    "Start Date": new Date(b.startAt).toLocaleDateString("en-IN"),
    "End Date": new Date(b.endAt).toLocaleDateString("en-IN"),
    "Booked On": new Date(b.createdAt).toLocaleDateString("en-IN")
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bookings");

  // Auto column widths
  const cols = Object.keys(rows[0] ?? {}).map((k) => ({ wch: Math.max(k.length, 16) }));
  ws["!cols"] = cols;

  XLSX.writeFile(wb, `ln-studyhall-bookings-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ name: string; token: string } | null>(null);

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored || (stored.user.role !== "ADMIN" && stored.user.role !== "SUPER_ADMIN")) {
      router.push("/signin");
      return;
    }
    setAdmin({ name: stored.user.name, token: stored.token });
  }, [router]);

  function handleSignOut() {
    clearAuth();
    router.push("/");
  }

  if (!admin) return null;

  return (
    <main className="min-h-screen px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <Navbar />
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.26em] text-lagoon">Admin</p>
            <h1 className="font-display text-5xl font-semibold tracking-normal md:text-7xl">Operations command center</h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400">Welcome back, {admin.name}</p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <LiveClock />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportToExcel(admin.token)}>
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3 md:grid-cols-5">
          {actions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="h-full cursor-pointer p-4 transition hover:-translate-y-0.5 hover:border-lagoon/40">
                <action.icon className="mb-3 h-5 w-5 text-lagoon" />
                <p className="text-sm font-semibold">{action.label}</p>
              </Card>
            </Link>
          ))}
        </div>

        <AnalyticsDashboard />
      </div>
    </main>
  );
}
