"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import {
  Activity, CreditCard, Users, CalendarRange,
  TrendingUp, BookOpen, Search, RefreshCw
} from "lucide-react";
import { API_URL, getStoredAuth, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

type Analytics = {
  totalUsers: number;
  totalBookings: number;
  totalBranches: number;
  allTimeRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  activeBookings: number;
  monthlySignups: number;
};

type MonthlyData = { month: string; revenue: number; bookings: number }[];

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  joinedAt: string;
  totalBookings: number;
  lastBooking: { startAt: string; endAt: string; status: string } | null;
};

type BookingRow = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  user: { name: string; email: string };
  seat: { label: string };
  branch: { name: string };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function statusColor(status: string) {
  switch (status) {
    case "CONFIRMED": return "text-lagoon bg-lagoon/10";
    case "CHECKED_IN": return "text-neon bg-neon/10";
    case "COMPLETED": return "text-slate-500 bg-slate-100 dark:bg-slate-800";
    case "CANCELLED": return "text-red-500 bg-red-500/10";
    default: return "text-brass bg-brass/10";
  }
}

async function adminFetch<T>(path: string): Promise<T> {
  const stored = getStoredAuth();
  if (!stored) throw new ApiError("Not authenticated", 401, "AUTH");

  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${stored.token}` }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      (data as { message?: string }).message ?? "Request failed",
      res.status,
      res.status === 403 ? "AUTH" : "SERVER"
    );
  }
  return res.json() as Promise<T>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const [mounted, setMounted] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [search, setSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "bookings">("users");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [analyticsData, monthlyData, usersData, bookingsData] = await Promise.all([
        adminFetch<Analytics>("/admin/analytics"),
        adminFetch<MonthlyData>("/admin/revenue/monthly"),
        adminFetch<{ users: UserRow[]; total: number; pages: number }>(
          `/admin/users?page=${userPage}&search=${encodeURIComponent(search)}`
        ),
        adminFetch<{ bookings: BookingRow[] }>("/admin/bookings?limit=10")
      ]);

      setAnalytics(analyticsData);
      setMonthly(monthlyData);
      setUsers(usersData.users);
      setUserPages(usersData.pages);
      setBookings(bookingsData.bookings);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userPage, search]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) load(); }, [mounted, load]);

  if (!mounted || loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-16 rounded bg-white/20 dark:bg-white/5" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-500">{error}</p>
        <button onClick={() => load()} className="mt-4 text-sm text-lagoon underline">
          Try again
        </button>
      </Card>
    );
  }

  const statCards = [
    { label: "Monthly revenue", value: fmt(analytics?.monthlyRevenue ?? 0), sub: `${analytics?.revenueGrowth ?? 0}% vs last month`, icon: CreditCard, tone: "text-lagoon" },
    { label: "Total users", value: (analytics?.totalUsers ?? 0).toLocaleString(), sub: `+${analytics?.monthlySignups ?? 0} this month`, icon: Users, tone: "text-neon" },
    { label: "Active bookings", value: (analytics?.activeBookings ?? 0).toLocaleString(), sub: `${analytics?.totalBookings ?? 0} total`, icon: BookOpen, tone: "text-brass" },
    { label: "All-time revenue", value: fmt(analytics?.allTimeRevenue ?? 0), sub: `${analytics?.totalBranches ?? 0} branches`, icon: TrendingUp, tone: "text-plum" }
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold">{card.value}</p>
                <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
              </div>
              <card.icon className={`h-6 w-6 ${card.tone}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-6 text-lg font-semibold">Monthly Revenue (₹)</h3>
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => fmt(v)} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Area type="monotone" dataKey="revenue" stroke="#2DD4BF" fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="mb-6 text-lg font-semibold">Monthly Bookings</h3>
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#60A5FA" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Users & Bookings tables */}
      <Card>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("users")}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === "users" ? "bg-lagoon/20 text-lagoon" : "text-slate-500 hover:text-lagoon"}`}
            >
              <Users className="mr-1.5 inline h-4 w-4" />
              Users
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === "bookings" ? "bg-lagoon/20 text-lagoon" : "text-slate-500 hover:text-lagoon"}`}
            >
              <CalendarRange className="mr-1.5 inline h-4 w-4" />
              Bookings
            </button>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "users" && (
              <div className="flex items-center gap-2 rounded-md border border-black/10 bg-white/50 px-3 dark:border-white/10 dark:bg-white/5">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setUserPage(1); }}
                  placeholder="Search users..."
                  className="bg-transparent py-2 text-sm outline-none"
                />
              </div>
            )}
            <button
              onClick={() => load(true)}
              className="rounded-md border border-black/10 p-2 dark:border-white/10"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 text-slate-400 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Users table */}
        {activeTab === "users" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-white/5">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Phone</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Joined</th>
                  <th className="pb-3 pr-4">Bookings</th>
                  <th className="pb-3 pr-4">Last Booking Start</th>
                  <th className="pb-3">Last Booking End</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/30 dark:hover:bg-white/5">
                    <td className="py-3 pr-4 font-medium">{user.name}</td>
                    <td className="py-3 pr-4 text-slate-500">{user.email}</td>
                    <td className="py-3 pr-4 text-slate-500">{user.phone ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "bg-brass/10 text-brass" : "bg-lagoon/10 text-lagoon"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500">{fmtDate(user.joinedAt)}</td>
                    <td className="py-3 pr-4 text-center font-semibold">{user.totalBookings}</td>
                    <td className="py-3 pr-4 text-slate-500">
                      {user.lastBooking ? fmtDate(user.lastBooking.startAt) : "—"}
                    </td>
                    <td className="py-3 text-slate-500">
                      {user.lastBooking ? fmtDate(user.lastBooking.endAt) : "—"}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
            {userPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  disabled={userPage === 1}
                  onClick={() => setUserPage((p) => p - 1)}
                  className="rounded border px-3 py-1 text-sm disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-500">{userPage} / {userPages}</span>
                <button
                  disabled={userPage === userPages}
                  onClick={() => setUserPage((p) => p + 1)}
                  className="rounded border px-3 py-1 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bookings table */}
        {activeTab === "bookings" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-white/5">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Branch</th>
                  <th className="pb-3 pr-4">Seat No.</th>
                  <th className="pb-3 pr-4">Start Date</th>
                  <th className="pb-3 pr-4">End Date</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Booked On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/30 dark:hover:bg-white/5">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{b.user.name}</div>
                      <div className="text-xs text-slate-400">{b.user.email}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-500">{b.branch.name}</td>
                    <td className="py-3 pr-4 font-semibold text-lagoon">#{b.seat.label}</td>
                    <td className="py-3 pr-4 text-slate-500">{fmtDate(b.startAt)}</td>
                    <td className="py-3 pr-4 text-slate-500">{fmtDate(b.endAt)}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{fmtDate(b.createdAt)}</td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No bookings yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Activity feed */}
      <Card>
        <h3 className="mb-5 text-lg font-semibold">
          <Activity className="mr-2 inline h-5 w-5 text-lagoon" />
          Recent Activity
        </h3>
        <div className="space-y-2">
          {bookings.slice(0, 5).map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-md bg-white/40 p-3 text-sm dark:bg-white/5">
              <Activity className="h-4 w-4 shrink-0 text-lagoon" />
              <span>
                <span className="font-semibold">{b.user.name}</span> booked{" "}
                <span className="font-semibold text-lagoon">Seat #{b.seat.label}</span> at{" "}
                {b.branch.name} — {fmtDate(b.startAt)} to {fmtDate(b.endAt)}
              </span>
            </div>
          ))}
          {bookings.length === 0 && (
            <p className="text-sm text-slate-400">No recent activity</p>
          )}
        </div>
      </Card>
    </div>
  );
}
