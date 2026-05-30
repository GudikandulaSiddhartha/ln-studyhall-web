"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { SeatManager } from "@/components/seat-manager";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, Building2, ImagePlus, MessageSquareText, UserCog, LogOut, Download } from "lucide-react";
import { getStoredAuth, clearAuth, API_URL } from "@/lib/api";


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

async function exportToCSV(token: string) {
  const [usersRes, bookingsRes] = await Promise.all([
    fetch(`${API_URL}/admin/users?limit=1000`, { headers: { Authorization: `Bearer ${token}` } }),
    fetch(`${API_URL}/admin/bookings?limit=1000`, { headers: { Authorization: `Bearer ${token}` } })
  ]);

  const usersData = await usersRes.json();
  const bookingsData = await bookingsRes.json();

  const users: {
    id: string; name: string; email: string; phone: string | null;
    role: string; joinedAt: string; totalBookings: number;
    lastBooking: { startAt: string; endAt: string; status: string } | null;
  }[] = usersData.users ?? [];

  const bookings: {
    userId?: string;
    user: { name: string; phone: string | null; email?: string };
    branch: { name: string };
    seat: { label: string };
    status: string; startAt: string; endAt: string; createdAt: string;
  }[] = bookingsData.bookings ?? [];

  const today = new Date().toISOString().slice(0, 10);

  // Build a map of userId → latest booking
  const bookingMap = new Map<string, typeof bookings[0]>();
  for (const b of bookings) {
    if (b.userId && !bookingMap.has(b.userId)) {
      bookingMap.set(b.userId, b);
    }
  }

  // Payment status helper
  const paymentStatus = (status: string) => {
    if (["CONFIRMED", "CHECKED_IN", "COMPLETED"].includes(status)) return "Paid";
    if (status === "CANCELLED") return "Cancelled";
    return "Unpaid";
  };

  // ── Users sheet: one row per user with seat + payment ─────────────────────
  const userHeaders = [
    "Name", "Email", "Mobile Number", "Role", "Joined Date",
    "Seat Booked", "Seat Number", "Branch", "Start Date", "End Date", "Payment Status"
  ];

  const userRows = users.map((u) => {
    const booking = bookingMap.get(u.id);
    return [
      u.name,
      u.email,
      u.phone ?? "",
      u.role,
      new Date(u.joinedAt).toLocaleDateString("en-IN"),
      booking ? "Yes" : "No",
      booking ? booking.seat.label : "",
      booking ? booking.branch.name : "",
      booking ? new Date(booking.startAt).toLocaleDateString("en-IN") : "",
      booking ? new Date(booking.endAt).toLocaleDateString("en-IN") : "",
      booking ? paymentStatus(booking.status) : "Unpaid"
    ];
  });

  // ── Bookings sheet ────────────────────────────────────────────────────────
  const bookingHeaders = [
    "Name", "Mobile Number", "Branch", "Seat Number",
    "Start Date", "End Date", "Payment Status", "Booked On"
  ];

  const bookingRows = bookings.map((b) => [
    b.user.name,
    b.user.phone ?? "",
    b.branch.name,
    b.seat.label,
    new Date(b.startAt).toLocaleDateString("en-IN"),
    new Date(b.endAt).toLocaleDateString("en-IN"),
    paymentStatus(b.status),
    new Date(b.createdAt).toLocaleDateString("en-IN")
  ]);

  const toCSV = (headers: string[], rows: string[][]) =>
    [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

  const csvContent =
    "USERS\n" +
    toCSV(userHeaders, userRows.length > 0 ? userRows : [Array(userHeaders.length).fill("No data")]) +
    "\n\nBOOKINGS\n" +
    toCSV(bookingHeaders, bookingRows.length > 0 ? bookingRows : [Array(bookingHeaders.length).fill("No data")]);

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ln-studyhall-export-${today}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ name: string; token: string } | null>(null);

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored || (stored.user.role !== "ADMIN" && stored.user.role !== "SUPER_ADMIN")) {
      router.push("/admin-login");
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
              <Button variant="outline" onClick={() => exportToCSV(admin.token)}>
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

        {/* Seat Management */}
        <div className="mt-8">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lagoon">Seat Management</p>
            <h2 className="mt-1 text-2xl font-semibold">Release & block seats</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Click any seat to view details and control its availability.</p>
          </div>
          <SeatManager />
        </div>
      </div>
    </main>
  );
}
