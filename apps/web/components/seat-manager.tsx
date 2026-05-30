"use client";

import { useEffect, useState, useCallback } from "react";
import { Lock, Unlock, RefreshCw, X, CheckCircle, User, Phone, Mail, CalendarRange, Building2 } from "lucide-react";
import { API_URL, getStoredAuth } from "@/lib/api";
import { Button } from "@/components/ui/button";

type ActiveBooking = {
  bookingId: string;
  userId: string;
  userName: string;
  userPhone: string | null;
  userEmail: string;
  status: string;
  startAt: string;
  endAt: string;
};

type Seat = {
  id: string;
  label: string;
  seatNumber: number;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED" | "MAINTENANCE";
  branchId: string;
  branchName: string;
  activeBooking: ActiveBooking | null;
};

type Branch = { id: string; name: string; _count: { seats: number; bookings: number } };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, { grid: string; badge: string; dot: string }> = {
  AVAILABLE:   { grid: "bg-lagoon/15 border-lagoon/50 hover:border-lagoon text-lagoon",           badge: "bg-lagoon/20 text-lagoon border-lagoon/30",       dot: "bg-lagoon" },
  BOOKED:      { grid: "bg-blue-500/15 border-blue-500/50 hover:border-blue-400 text-blue-400",   badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
  BLOCKED:     { grid: "bg-red-500/15 border-red-500/50 hover:border-red-400 text-red-400",       badge: "bg-red-500/20 text-red-400 border-red-500/30",    dot: "bg-red-400" },
  MAINTENANCE: { grid: "bg-brass/15 border-brass/50 hover:border-brass text-brass",               badge: "bg-brass/20 text-brass border-brass/30",          dot: "bg-brass" }
};

export function SeatManager() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const token = getStoredAuth()?.token ?? "";

  // Load branches once
  useEffect(() => {
    fetch(`${API_URL}/admin/branches`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setBranches(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [token]);

  // Load seats when branch changes
  const loadSeats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const url = selectedBranch === "all"
        ? `${API_URL}/admin/seats`
        : `${API_URL}/admin/seats?branchId=${selectedBranch}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSeats(Array.isArray(data) ? data : []);
    } catch { setSeats([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [selectedBranch, token]);

  useEffect(() => { loadSeats(); }, [loadSeats]);

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
      await loadSeats(true);
      setSelectedSeat((prev) => prev ? {
        ...prev,
        status: action === "release" ? "AVAILABLE" : "BLOCKED",
        activeBooking: action === "block" ? null : prev.activeBooking
      } : null);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Action failed", ok: false });
    } finally { setActionLoading(false); }
  }

  // Stats for current view
  const available = seats.filter((s) => s.status === "AVAILABLE").length;
  const booked = seats.filter((s) => s.status === "BOOKED").length;
  const blocked = seats.filter((s) => s.status === "BLOCKED").length;
  const maintenance = seats.filter((s) => s.status === "MAINTENANCE").length;

  const filtered = seats.filter((s) => filterStatus === "all" || s.status === filterStatus);

  // Group by branch for "all" view
  const branchGroups = selectedBranch === "all"
    ? Array.from(new Set(filtered.map((s) => s.branchName))).map((name) => ({
        name,
        seats: filtered.filter((s) => s.branchName === name)
      }))
    : [{ name: branches.find((b) => b.id === selectedBranch)?.name ?? "", seats: filtered }];

  return (
    <div className="space-y-6">

      {/* Branch selector tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setSelectedBranch("all"); setSelectedSeat(null); }}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
            selectedBranch === "all"
              ? "border-lagoon bg-lagoon/10 text-lagoon"
              : "border-black/10 bg-white/50 text-slate-600 hover:border-lagoon/40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          }`}
        >
          <Building2 className="h-4 w-4" />
          All Branches
          <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/10">
            {seats.length}
          </span>
        </button>
        {branches.map((b) => (
          <button
            key={b.id}
            onClick={() => { setSelectedBranch(b.id); setSelectedSeat(null); }}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              selectedBranch === b.id
                ? "border-lagoon bg-lagoon/10 text-lagoon"
                : "border-black/10 bg-white/50 text-slate-600 hover:border-lagoon/40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            }`}
          >
            {b.name}
            <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/10">
              {b._count.seats}
            </span>
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Available", value: available, color: "text-lagoon", dot: "bg-lagoon" },
          { label: "Booked", value: booked, color: "text-blue-400", dot: "bg-blue-400" },
          { label: "Blocked", value: blocked, color: "text-red-400", dot: "bg-red-400" },
          { label: "Maintenance", value: maintenance, color: "text-brass", dot: "bg-brass" }
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilterStatus(filterStatus === s.label.toUpperCase() ? "all" : s.label.toUpperCase())}
            className={`glass rounded-lg p-4 text-left transition hover:-translate-y-0.5 ${filterStatus === s.label.toUpperCase() ? "ring-1 ring-lagoon/40" : ""}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              <span className={`text-2xl font-semibold ${s.color}`}>{s.value}</span>
            </div>
            <p className="text-xs text-slate-500">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-500">
          Showing {filtered.length} seat{filtered.length !== 1 ? "s" : ""}
          {filterStatus !== "all" ? ` (${filterStatus})` : ""}
        </span>
        {filterStatus !== "all" && (
          <button onClick={() => setFilterStatus("all")} className="text-xs text-lagoon underline">Clear filter</button>
        )}
        <button onClick={() => loadSeats(true)} className="ml-auto flex items-center gap-1.5 rounded-md border border-black/10 px-3 py-1.5 text-xs dark:border-white/10">
          <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-8 gap-2 animate-pulse">
          {Array.from({ length: 32 }).map((_, i) => <div key={i} className="h-14 rounded-md bg-white/10" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {branchGroups.map((group) => (
            <div key={group.name}>
              {selectedBranch === "all" && (
                <div className="mb-3 flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-lagoon" />
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200">{group.name}</h3>
                  <span className="text-xs text-slate-400">{group.seats.length} seats</span>
                </div>
              )}

              {/* Seat grid */}
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
                {group.seats.map((seat) => {
                  const style = STATUS_STYLES[seat.status] ?? STATUS_STYLES.AVAILABLE!;
                  return (
                    <button
                      key={seat.id}
                      onClick={() => { setSelectedSeat(seat); setMessage(null); }}
                      className={`relative flex h-14 flex-col items-center justify-center rounded-md border text-xs font-semibold transition-all hover:scale-105 ${style.grid} ${selectedSeat?.id === seat.id ? "ring-2 ring-white/70 scale-105" : ""}`}
                      title={`Seat ${seat.label}${seat.activeBooking ? ` — ${seat.activeBooking.userName}` : ` — ${seat.status}`}`}
                    >
                      <span className="text-sm font-bold">{seat.label}</span>
                      <span className="text-[9px] opacity-70 mt-0.5">
                        {seat.status === "AVAILABLE" ? "Free" :
                         seat.status === "BOOKED" ? "Booked" :
                         seat.status === "BLOCKED" ? "Blocked" : "Maint."}
                      </span>
                      {seat.activeBooking && (
                        <span className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      )}
                    </button>
                  );
                })}
                {group.seats.length === 0 && (
                  <div className="col-span-full py-6 text-center text-sm text-slate-400">No seats</div>
                )}
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-lagoon/60" />Available</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-blue-400/60" />Booked</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-red-400/60" />Blocked</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-brass/60" />Maintenance</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seat detail side panel */}
      {selectedSeat && (
        <div className="glass rounded-xl border border-white/10 p-6 mt-4">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg border text-lg font-bold ${STATUS_STYLES[selectedSeat.status]?.grid ?? ""}`}>
                {selectedSeat.label}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">Seat #{selectedSeat.label}</h3>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[selectedSeat.status]?.badge ?? ""}`}>
                    {selectedSeat.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{selectedSeat.branchName}</p>
              </div>
            </div>
            <button onClick={() => setSelectedSeat(null)} className="rounded-md p-1.5 hover:bg-white/10">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Active booking card */}
          {selectedSeat.activeBooking ? (
            <div className="mb-5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">Active Booking</p>
              <div className="grid gap-2">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="font-medium text-slate-200">{selectedSeat.activeBooking.userName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="text-slate-300">{selectedSeat.activeBooking.userPhone ?? "No phone"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="text-slate-300">{selectedSeat.activeBooking.userEmail}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CalendarRange className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="text-slate-300">
                    {fmtDate(selectedSeat.activeBooking.startAt)} → {fmtDate(selectedSeat.activeBooking.endAt)}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-blue-500/20">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                  disabled={actionLoading}
                  onClick={async () => {
                    setActionLoading(true);
                    setMessage(null);
                    try {
                      const res = await fetch(`${API_URL}/admin/bookings/${selectedSeat.activeBooking!.bookingId}/cancel`, {
                        method: "PATCH",
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.message);
                      setMessage({ text: "Booking cancelled", ok: true });
                      await loadSeats(true);
                      setSelectedSeat((prev) => prev ? { ...prev, activeBooking: null, status: "AVAILABLE" } : null);
                    } catch (err) {
                      setMessage({ text: err instanceof Error ? err.message : "Failed", ok: false });
                    } finally { setActionLoading(false); }
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel this booking
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400 text-center">
              No active booking on this seat
            </div>
          )}

          {/* Status message */}
          {message && (
            <div className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${message.ok ? "bg-lagoon/10 text-lagoon border border-lagoon/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
              {message.ok ? <CheckCircle className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
              {message.text}
            </div>
          )}

          {/* Seat action buttons */}
          <div className="flex flex-wrap gap-2">
            {selectedSeat.status !== "AVAILABLE" && (
              <Button variant="outline" onClick={() => patchSeat(selectedSeat.id, "release")} disabled={actionLoading}>
                <Unlock className="h-4 w-4 text-lagoon" />
                Release seat
              </Button>
            )}
            {selectedSeat.status !== "BLOCKED" && (
              <Button variant="outline" onClick={() => patchSeat(selectedSeat.id, "block")} disabled={actionLoading}>
                <Lock className="h-4 w-4 text-red-400" />
                Block seat
              </Button>
            )}
            {actionLoading && <span className="self-center text-sm text-slate-400 animate-pulse">Updating...</span>}
          </div>
        </div>
      )}
    </div>
  );
}
