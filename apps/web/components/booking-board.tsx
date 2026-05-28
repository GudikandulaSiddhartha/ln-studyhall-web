"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { getStoredAuth } from "@/lib/api";
import { Building2, CalendarClock, CheckCircle2, CreditCard, MapPin, QrCode } from "lucide-react";
import { branches } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const monthlyAmount = 1500;

type SeatStatus = "available" | "booked" | "blocked";
type SaveState = "idle" | "saving" | "saved";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function buildBranchSeats(branchId: string, count: number) {
  const prefix = branchId === "ln-warangal" ? "W" : "H";

  return Array.from({ length: count }, (_, index) => {
    const seatNumber = index + 1;
    const status: SeatStatus =
      seatNumber % 17 === 0 ? "blocked" : seatNumber % 9 === 0 || seatNumber % 13 === 0 ? "booked" : "available";

    return {
      id: `${prefix}-${String(seatNumber).padStart(3, "0")}`,
      status
    };
  });
}

export function BookingBoard() {
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [reservedSeats, setReservedSeats] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [userPhone, setUserPhone] = useState<string>("");
  const startDate = useMemo(() => new Date(), []);
  const endDate = useMemo(() => addDays(startDate, 30), [startDate]);
  const selectedBranch = branches.find((branch) => branch.id === branchId) ?? branches[0];
  const branchSeats = useMemo(() => {
    const reserved = new Set(reservedSeats);

    return buildBranchSeats(selectedBranch.id, selectedBranch.seats).map((seat) => ({
      ...seat,
      status: reserved.has(`${selectedBranch.id}:${seat.id}`) ? "booked" as SeatStatus : seat.status
    }));
  }, [reservedSeats, selectedBranch.id, selectedBranch.seats]);
  const availableCount = branchSeats.filter((seat) => seat.status === "available").length;
  const paymentQrValue = useMemo(() => {
    const seat = selected ?? "SELECT-SEAT";
    return `LN StudyHall Payment | Branch: ${selectedBranch.name} | Seat: ${seat} | Plan: Monthly Pass | Amount: INR ${monthlyAmount} | Valid: ${formatDate(startDate)} to ${formatDate(endDate)}`;
  }, [endDate, selected, selectedBranch.name, startDate]);

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth) {
      setUserName(auth.user.name);
    }
    const storedSeats = localStorage.getItem("ln_reserved_seats");
    if (!storedSeats) return;
    try {
      const parsedSeats = JSON.parse(storedSeats);
      if (Array.isArray(parsedSeats)) {
        setReservedSeats(parsedSeats.filter((seat) => typeof seat === "string"));
      }
    } catch {
      setReservedSeats([]);
    }
  }, []);

  function chooseBranch(nextBranchId: string) {
    setBranchId(nextBranchId);
    setSelected(null);
    setSaveState("idle");
  }

  function chooseSeat(seatId: string) {
    setSelected(seatId);
    setSaveState("idle");
  }

  async function confirmBooking() {
    if (!selected) return;

    setSaveState("saving");

    const booking = {
      id: `LN-${selected}-${Date.now().toString().slice(-6)}`,
      branch: selectedBranch.name,
      branchId: selectedBranch.id,
      branchAddress: selectedBranch.area,
      seat: selected,
      slot: selectedBranch.hours,
      plan: "Monthly Pass",
      amount: monthlyAmount,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      paymentStatus: "Payment QR generated",
      bookingStatus: "Seat selected",
      createdAt: new Date().toISOString()
    };

    await new Promise((resolve) => setTimeout(resolve, 450));

    const nextReservedSeats = Array.from(new Set([...reservedSeats, `${selectedBranch.id}:${selected}`]));
    localStorage.setItem("ln_active_booking", JSON.stringify(booking));
    localStorage.setItem("ln_reserved_seats", JSON.stringify(nextReservedSeats));
    setReservedSeats(nextReservedSeats);
    setSaveState("saved");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <div className="space-y-6">
        <Card>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Select branch</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Choose a branch first. Seat numbers and availability update for that branch without disturbing the customer flow.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => chooseBranch(branch.id)}
                className={cn(
                  "rounded-lg border p-4 text-left transition hover:-translate-y-0.5",
                  branch.id === selectedBranch.id ? "border-lagoon bg-lagoon/10 shadow-glow" : "border-black/10 bg-white/35 dark:border-white/10 dark:bg-white/5"
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

        <Card>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Seat selection</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{selectedBranch.name} has {availableCount} seats available right now. Selected seats are softly held while payment QR is prepared.</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-lagoon" />Available</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-neon" />Selected</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-400" />Booked</span>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-3 sm:grid-cols-8 md:grid-cols-12">
            {branchSeats.map((seat) => {
              const isSelected = selected === seat.id;
              const disabled = seat.status !== "available";
              return (
                <button
                  key={seat.id}
                  disabled={disabled}
                  onClick={() => chooseSeat(seat.id)}
                  className={cn(
                    "aspect-square rounded-md text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-lagoon",
                    seat.status === "available" && "bg-lagoon/18 text-lagoon hover:scale-105 hover:bg-lagoon hover:text-ink",
                    seat.status === "booked" && "cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-700",
                    seat.status === "blocked" && "cursor-not-allowed bg-slate-900/30 text-slate-400 dark:bg-black/50",
                    isSelected && "bg-neon text-ink shadow-glow"
                  )}
                >
                  {seat.id}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-lagoon" />
            <h3 className="text-xl font-semibold">Booking summary</h3>
          </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span>Name</span><span className="text-right font-semibold">{userName || <span className="text-slate-400">Sign in to autofill</span>}</span></div>
              <div className="flex justify-between gap-4 items-center"><span>Mobile</span><input value={userPhone} onChange={e => setUserPhone(e.target.value)} placeholder="Enter mobile number" className="text-right font-semibold bg-transparent outline-none w-40 placeholder:text-slate-400 placeholder:font-normal" maxLength={10} /></div>
              <div className="border-t border-black/5 dark:border-white/5 pt-3" />
              <div className="flex justify-between gap-4"><span>Branch</span><span className="text-right font-semibold">{selectedBranch.name}</span></div>
              <div className="flex justify-between gap-4"><span>Address</span><span className="text-right font-semibold">{selectedBranch.landmark}</span></div>
              <div className="flex justify-between"><span>Seat</span><span className="font-semibold">{selected ?? "Choose seat"}</span></div>
              <div className="flex justify-between"><span>Hours</span><span className="font-semibold">{selectedBranch.hours}</span></div>
              <div className="flex justify-between"><span>Plan</span><span className="font-semibold">Monthly Pass</span></div>
              <div className="flex justify-between"><span>Amount</span><span className="font-semibold">Rs {monthlyAmount}</span></div>
              <div className="flex justify-between"><span>Start date</span><span className="font-semibold">{formatDate(startDate)}</span></div>
              <div className="flex justify-between"><span>End date</span><span className="font-semibold">{formatDate(endDate)}</span></div>
            </div>
          <Button disabled={!selected || saveState === "saving"} variant="premium" className="mt-6 w-full" onClick={confirmBooking}>
            <CheckCircle2 className="h-4 w-4" />
            {saveState === "saving" ? "Securing seat..." : saveState === "saved" ? "Booked ✓" : "Confirm booking & generate QR"}
          </Button>
          {selected && saveState === "idle" ? <p className="mt-3 text-sm font-medium text-lagoon">Seat {selected} is held for this checkout.</p> : null}
          {saveState === "saved" ? <p className="mt-3 text-sm font-medium text-lagoon">Seat secured. Payment QR and dashboard booking are ready.</p> : null}
        </Card>
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <QrCode className="h-5 w-5 text-neon" />
            <h3 className="text-xl font-semibold">{saveState === "saved" ? "Booking QR — show at entry" : "Payment QR"}</h3>
          </div>
          <motion.div animate={{ scale: selected ? 1 : 0.94, opacity: selected ? 1 : 0.5 }} className="grid place-items-center rounded-lg bg-white p-5">
            <QRCodeSVG value={paymentQrValue} size={180} level="H" includeMargin={true} />
          </motion.div>
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <CreditCard className="h-4 w-4 text-lagoon" />
            Select a branch and seat to generate the monthly payment QR for Rs {monthlyAmount}.
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
