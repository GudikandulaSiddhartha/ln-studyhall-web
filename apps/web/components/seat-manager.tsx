"use client";

import { useEffect, useState, useCallback } from "react";
import { Lock, Unlock, RefreshCw, X, CheckCircle } from "lucide-react";
import { API_URL, getStoredAuth } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Booking = {
  status: string;
  startAt: string;
  endAt: string;
  user: { name: string; phone: string | null };
};

type Seat = {
  id: string;
  label: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED" | "MAINTENANCE";
  zone: string | null;
  branch: { name: string };
  bookings: Booking[];
};

function statusColor(status: string) {
  switch (status) {
    case "AVAILABLE": return "bg-lagoon/20 text-lagoon border-lagoon/30";
    case "BOOKED": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "BLOCKED": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "MAINTENANCE": return "bg-brass/20 text-brass border-brass/30";
    default: return "bg-slate-500/20 text-slate-400";
  }
}

function seatGridColor(status: string) {
  switch (status) {
    case "AVAILABLE": return "bg-lagoon/15 border-lagoon/40 hover:border-lagoon text-lagoon";
    case "BOOKED": return "bg-blue-500/15 border-blue-500/40 hover:border-blue-400 text-blue-400";
    case "BLOCKED": return "bg-red-500/15 border-red-500/40 hover:border-red-400 text-red-400";
    case "MAINTENANCE": return "bg-brass/15 border-brass/40 hover:border-brass text-brass";
    default: return "bg-slate-500/15 border-slate-500/40 text-slate-400";
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function SeatManager() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Seat | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const token = getStoredAuth()?.token ?? "";

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/admin/seats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSeats(Array.isArray(data) ? data : []);
    } catch {
      setSeats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function patchSeat(seatId: string, action: "release" | "block") {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/admin/seats/${seatId}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage({ text: data.message, ok: true });
      await load(true);
      // Update selected seat
      setSelected((prev) => prev ? { ...prev, status: action === "release" ? "AVAILABLE" : "BLOCKED" } : null);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Action failed", ok: false });
    } finally {
      setActionLoading(false);
    }
  }

  // Filter
  const branches = ["all", ...Array.from(new Set(seats.map((s) => s.branch.name)))];
  const statuses = ["all", "AVAILABLE", "BOOKED", "BLOCKED", "MAINTENANCE"];

  const filtered = seats.filter((s) => {
    if (filterBranch !== "all" && s.branch.name !== filterBranch) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  // Stats
  const total = seats.length;
  const available = seats.filter((s) => s.status === "AVAILABLE").length;
  const booked = seats.filter((s) => s.status === "BOOKED").length;
  const blocked = seats.filter((s) => s.status === "BLOCKED").length;

  if (loading) {
    return (
      <div className="grid grid-cols-6 gap-2 animate-pulse">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="h-12 rounded-md bg-white/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total seats", value: total, color: "text-slate-400" },
          { label: "Available", value: available, color: "text-lagoon" },
          { label: "Booked", value: booked, color: "text-blue-400" },
          { label: "Blocked", value: blocked, color: "text-red-400" }
        ].map((s) => (
          <div key={s.label} className="glass rounded-lg p-4">
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + refresh */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}
          className="h-9 rounded-md border border-black/10 bg-white/70 px-3 text-sm outline-none dark:border-white/10 dark:bg-slate-950/70">
          {branches.map((b) => <option key={b} value={b}>{b === "all" ? "All branches" : b}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 rounded-md border border-black/10 bg-white/70 px-3 text-sm outline-none dark:border-white/10 dark:bg-slate-950/70">
          {statuses.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
        </select>
        <button onClick={() => load(true)} className="ml-auto flex items-center gap-1.5 rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/10">
          <RefreshCw className={`h-4 w-4 text-slate-400 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[["AVAILABLE", "text-lagoon"], ["BOOKED", "text-blue-400"], ["BLOCKED", "text-red-400"], ["MAINTENANCE", "text-brass"]].map(([s, c]) => (
          <span key={s} className={`flex items-center gap-1.5 ${c}`}>
            <span className="inline-block h-2.5 w-2.5 rounded-sm border border-current opacity-60" />
            {s}
          </span>
        ))}
      </div>

      {/* Seat grid */}
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
        {filtered.map((seat) => (
          <button
            key={seat.id}
            onClick={() => { setSelected(seat); setMessage(null); }}
            className={`relative flex h-12 flex-col items-center justify-center rounded-md border text-xs font-semibold transition ${seatGridColor(seat.status)} ${selected?.id === seat.id ? "ring-2 ring-white/60" : ""}`}
            title={`Seat ${seat.label} — ${seat.status}${seat.bookings[0] ? ` — ${seat.bookings[0].user.name}` : ""}`}
          >
            <span>{seat.label}</span>
            {seat.bookings.length > 0 && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-slate-400">No seats match filter</div>
        )}
      </div>

      {/* Seat detail panel */}
      {selected && (
        <div className="glass rounded-xl border border-white/10 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold">Seat #{selected.label}</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor(selected.status)}`}>
                {selected.status}
              </span>
            </div>
            <button onClick={() => setSelected(null)} className="rounded-md p-1.5 hover:bg-white/10">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          <p className="mb-4 text-sm text-slate-500">{selected.branch.name}</p>

          {/* Active booking info */}
          {selected.bookings.length > 0 && (
            <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm">
              <p className="font-semibold text-blue-400 mb-2">Active booking</p>
              <p className="text-slate-300">{selected.bookings[0]!.user.name}</p>
              <p className="text-slate-400">{selected.bookings[0]!.user.phone ?? "No phone"}</p>
              <p className="text-slate-400 mt-1">
                {fmtDate(selected.bookings[0]!.startAt)} → {fmtDate(selected.bookings[0]!.endAt)}
              </p>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`mb-4 flex items-center gap-2 rounded-md p-3 text-sm ${message.ok ? "bg-lagoon/10 text-lagoon" : "bg-red-500/10 text-red-400"}`}>
              {message.ok ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {selected.status !== "AVAILABLE" && (
              <Button variant="outline" onClick={() => patchSeat(selected.id, "release")} disabled={actionLoading}>
                <Unlock className="h-4 w-4 text-lagoon" />
                Release seat
              </Button>
            )}
            {selected.status !== "BLOCKED" && (
              <Button variant="outline" onClick={() => patchSeat(selected.id, "block")} disabled={actionLoading}>
                <Lock className="h-4 w-4 text-red-400" />
                Block seat
              </Button>
            )}
            {actionLoading && <span className="text-sm text-slate-400 self-center">Updating...</span>}
          </div>
        </div>
      )}
    </div>
  );
}
