"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { getStoredAuth, API_URL } from "@/lib/api";
import { Building2, CalendarClock, CheckCircle2, CreditCard, MapPin, QrCode, RefreshCw, Lock } from "lucide-react";
import { branches } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const monthlyAmount = 1500;
type SaveState = "idle" | "saving" | "saved" | "error";

type LiveSeat = {
  id: string;
  label: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED" | "MAINTENANCE";
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function BookingBoard() {
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedSeatLabel, setSelectedSeatLabel] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [liveSeats, setLiveSeats] = useState<LiveSeat[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(false);

  const startDate = useMemo(() => new Date(), []);
  const endDate = useMemo(() => addDays(startDate, 30), [startDate]);
  const selectedBranch = branches.find((b) => b.id === branchId) ?? branches[0]!;

  // ── Load user ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const auth = getStoredAuth();
    if (auth) setUserName(auth.user.name);
  }, []);

  // ── Fetch live seats from API ──────────────────────────────────────────────
  const fetchSeats = useCallback(async () => {
    setSeatsLoading(true);
    try {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      const res = await fetch(
        `${API_URL}/bookings/availability?branchId=${branchId}&startAt=${start}&endAt=${end}`
      );
      if (res.ok) {
        const data = await res.json();
        setLiveSeats(Array.isArray(data) ? data : []);
      } else {
        setLiveSeats([]);
      }
    } catch {
      setLiveSeats([]);
    } finally {
      setSeatsLoading(false);
    }
  }, [branchId, startDate, endDate]);

  useEffect(() => {
    fetchSeats();
    setSelected(null);
    setSelectedSeatLabel(null);
    setSaveState("idle");
  }, [fetchSeats]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const availableCount = liveSeats.filter((s) => s.status === "AVAILABLE").length;
  const bookedCount = liveSeats.filter((s) => s.status === "BOOKED").length;
  const blockedCount = liveSeats.filter((s) => s.status === "BLOCKED" || s.status === "MAINTENANCE").length;

  // ── QR value ───────────────────────────────────────────────────────────────
  const paymentQrValue = useMemo(() => {
    const seat = selectedSeatLabel ?? "SELECT-SEAT";
    return `LN StudyHall | Branch: ${selectedBranch.name} | Seat: ${seat} | Plan: Monthly Pass | Amount: INR ${monthlyAmount} | ${formatDate(startDate)} to ${formatDate(endDate)}`;
  }, [endDate, selectedSeatLabel, selectedBranch.name, startDate]);

  // ── Choose branch ──────────────────────────────────────────────────────────
  function chooseBranch(nextBranchId: string) {
    setBranchId(nextBranchId);
    setSelected(null);
    setSelectedSeatLabel(null);
    setSaveState("idle");
    setSaveError(null);
  }

  // ── Choose seat ────────────────────────────────────────────────────────────
  function chooseSeat(seatId: string, label: string) {
    setSelected(seatId);
    setSelectedSeatLabel(label);
    setSaveState("idle");
    setSaveError(null);
  }

  // ── Confirm booking ────────────────────────────────────────────────────────
  async function confirmBooking() {
    if (!selected) return;
    setSaveState("saving");
    setSaveError(null);

    const auth = getStoredAuth();
    if (!auth) {
      setSaveError("Please sign in to book a seat.");
      setSaveState("error");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          branchId,
          seatId: selected,
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Booking failed");

      // Save locally for dashboard
      localStorage.setItem("ln_active_booking", JSON.stringify({
        id: data.id,
        branch: selectedBranch.name,
        branchId,
        seat: selectedSeatLabel,
        plan: "Monthly Pass",
        amount: monthlyAmount,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: data.status,
        qrToken: data.qrToken
      }));

      setSaveState("saved");
      // Refresh seats so booked seat shows as unavailable
      await fetchSeats();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Booking failed. Please try again.");
      setSaveState("error");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <div className="space-y-6">

        {/* Branch selector */}
        <Card>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Select branch</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Choose a branch to see live seat availability.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => chooseBranch(branch.id)}
                className={cn(
                  "rounded-lg border p-4 text-left transition hover:-translate-y-0.5",
                  branch.id === branchId
                    ? "border-lagoon bg-lagoon/10 shadow-glow"
                    : "border-black/10 bg-white/35 dark:border-white/10 dark:bg-white/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <Building2 className="mt-1 h-5 w-5 text-lagoon" />
                  <div>
                    <h3 className="font-semibold">{branch.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{branch.landmark}</p>
                    <p className="mt-2 text-xs font-semibold text-brass">{branch.hours}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Seat grid */}
        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Seat selection</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {seatsLoading ? "Loading live seats..." : `${availableCount} available · ${bookedCount} booked · ${blockedCount} blocked`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-lagoon" />Available</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-neon" />Selected</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-400" />Booked</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-500/60" />Blocked</span>
              </div>
              <button onClick={() => fetchSeats()} title="Refresh seats" className="rounded-md border border-black/10 p-1.5 dark:border-white/10">
                <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${seatsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {seatsLoading ? (
            <div className="grid grid-cols-6 gap-3 sm:grid-cols-8 md:grid-cols-12 animate-pulse">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-md bg-white/10" />
              ))}
            </div>
          ) : liveSeats.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No seats found. Make sure seats are added for this branch in the admin panel.
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-3 sm:grid-cols-8 md:grid-cols-12">
              {liveSeats.map((seat) => {
                const isSelected = selected === seat.id;
                const isAvailable = seat.status === "AVAILABLE";
                const isBlocked = seat.status === "BLOCKED" || seat.status === "MAINTENANCE";
                return (
                  <button
                    key={seat.id}
                    disabled={!isAvailable}
                    onClick={() => chooseSeat(seat.id, seat.label)}
                    className={cn(
                      "aspect-square rounded-md text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-lagoon",
                      isAvailable && !isSelected && "bg-lagoon/18 text-lagoon hover:scale-105 hover:bg-lagoon hover:text-ink",
                      seat.status === "BOOKED" && "cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-700",
                      isBlocked && "cursor-not-allowed bg-red-500/20 text-red-400",
                      isSelected && "bg-neon text-ink shadow-glow scale-105"
                    )}
                    title={
                      seat.status === "BOOKED" ? `Seat ${seat.label} — Booked` :
                      isBlocked ? `Seat ${seat.label} — Blocked by admin` :
                      `Seat ${seat.label} — Available`
                    }
                  >
                    {isBlocked ? <Lock className="mx-auto h-3 w-3" /> : seat.label}
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Right panel */}
      <div className="space-y-6">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-lagoon" />
            <h3 className="text-xl font-semibold">Booking summary</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span>Name</span>
              <span className="text-right font-semibold">
                {userName || <span className="text-slate-400">Sign in to autofill</span>}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Mobile</span>
              <input
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="Enter mobile number"
                className="w-40 bg-transparent text-right font-semibold outline-none placeholder:font-normal placeholder:text-slate-400"
                maxLength={10}
              />
            </div>
            <div className="border-t border-black/5 pt-3 dark:border-white/5" />
            <div className="flex justify-between gap-4">
              <span>Branch</span>
              <span className="text-right font-semibold">{selectedBranch.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Address</span>
              <span className="text-right font-semibold">{selectedBranch.landmark}</span>
            </div>
            <div className="flex justify-between">
              <span>Seat</span>
              <span className="font-semibold">{selectedSeatLabel ?? "Choose seat"}</span>
            </div>
            <div className="flex justify-between">
              <span>Hours</span>
              <span className="font-semibold">{selectedBranch.hours}</span>
            </div>
            <div className="flex justify-between">
              <span>Plan</span>
              <span className="font-semibold">Monthly Pass</span>
            </div>
            <div className="flex justify-between">
              <span>Amount</span>
              <span className="font-semibold">Rs {monthlyAmount}</span>
            </div>
            <div className="flex justify-between">
              <span>Start date</span>
              <span className="font-semibold">{formatDate(startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span>End date</span>
              <span className="font-semibold">{formatDate(endDate)}</span>
            </div>
          </div>

          {saveError && (
            <p className="mt-4 rounded-md border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-500">
              {saveError}
            </p>
          )}

          <Button
            disabled={!selected || saveState === "saving" || saveState === "saved"}
            variant="premium"
            className="mt-6 w-full"
            onClick={confirmBooking}
          >
            <CheckCircle2 className="h-4 w-4" />
            {saveState === "saving" ? "Securing seat..." :
             saveState === "saved" ? "Booked ✓" :
             "Confirm booking & generate QR"}
          </Button>

          {selected && saveState === "idle" && (
            <p className="mt-3 text-sm font-medium text-lagoon">Seat {selectedSeatLabel} is ready to book.</p>
          )}
          {saveState === "saved" && (
            <p className="mt-3 text-sm font-medium text-lagoon">✓ Seat booked! Show the QR at entry.</p>
          )}
        </Card>

        {/* QR card */}
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <QrCode className="h-5 w-5 text-neon" />
            <h3 className="text-xl font-semibold">
              {saveState === "saved" ? "Booking QR — show at entry" : "Payment QR"}
            </h3>
          </div>
          <motion.div
            animate={{ scale: selected ? 1 : 0.94, opacity: selected ? 1 : 0.5 }}
            className="grid place-items-center rounded-lg bg-white p-5"
          >
            <QRCodeSVG value={paymentQrValue} size={180} level="H" includeMargin />
          </motion.div>
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <CreditCard className="h-4 w-4 text-lagoon" />
            Select a branch and seat to generate your booking QR.
          </p>
          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            <MapPin className="mt-0.5 h-3.5 w-3.5 text-lagoon" />
            {selectedBranch.area}
          </p>
        </Card>
      </div>
    </div>
  );
}
