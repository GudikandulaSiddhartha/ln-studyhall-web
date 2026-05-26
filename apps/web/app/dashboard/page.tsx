"use client";

import { useEffect, useState } from "react";
import { Bell, CalendarCheck, CreditCard, MapPin, UserRound } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { userActivity } from "@/lib/data";

type StoredUser = {
  name: string;
  email: string;
  role: string;
};

type StoredBooking = {
  id: string;
  branch: string;
  seat: string;
  slot: string;
  plan: string;
  amount: number;
  startDate?: string;
  endDate?: string;
  paymentStatus: string;
  bookingStatus: string;
  createdAt: string;
};

function formatDate(value?: string) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getDaysRemaining(value?: string) {
  if (!value) return null;
  const end = new Date(value).getTime();
  const now = new Date().getTime();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

export default function UserDashboardPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [booking, setBooking] = useState<StoredBooking | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("ln_auth_user");
    const storedBooking = localStorage.getItem("ln_active_booking");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as StoredUser);
      } catch {
        setUser(null);
      }
    }

    if (storedBooking) {
      try {
        setBooking(JSON.parse(storedBooking) as StoredBooking);
      } catch {
        setBooking(null);
      }
    }
  }, []);

  const displayName = user?.name ?? "Registered User";
  const membership = booking?.plan ?? "Monthly Pass";
  const seat = booking?.seat ?? "Not selected";
  const paymentValue = booking ? `Rs ${booking.amount}` : "Rs 0";
  const daysRemaining = getDaysRemaining(booking?.endDate);
  const showRenewalReminder = typeof daysRemaining === "number" && daysRemaining >= 0 && daysRemaining <= 5;
  const notificationValue = showRenewalReminder ? `${daysRemaining} days left` : booking ? "Seat saved" : "Book a seat";

  return (
    <main className="min-h-screen px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <Navbar />
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.26em] text-lagoon">Dashboard</p>
          <h1 className="font-display text-5xl font-semibold tracking-normal md:text-7xl">Your study routine</h1>
        </div>
        <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <Card>
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-lg bg-lagoon/15 text-lagoon">
                <UserRound className="h-8 w-8" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold">{displayName}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{membership}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><span>Status</span><span className="font-semibold text-lagoon">{booking?.bookingStatus ?? "Ready to book"}</span></div>
              <div className="flex justify-between"><span>Seat</span><span className="font-semibold">{seat}</span></div>
              <div className="flex justify-between"><span>Payment</span><span className="font-semibold">{booking?.paymentStatus ?? "No payment QR yet"}</span></div>
            </div>
            <Button className="mt-6 w-full" variant="premium">Manage profile</Button>
          </Card>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Attendance", value: booking ? "Starts today" : "0 hrs", icon: CalendarCheck },
              { label: "Payments", value: paymentValue, icon: CreditCard },
              { label: "Notifications", value: notificationValue, icon: Bell }
            ].map((item) => (
              <Card key={item.label}>
                <item.icon className="mb-4 h-5 w-5 text-lagoon" />
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold">{item.value}</p>
              </Card>
            ))}
          </div>
        </div>

        <Card className="mt-6">
          <h2 className="mb-5 text-xl font-semibold">Current booking</h2>
          {booking ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-white/45 p-4 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Branch</p>
                <p className="mt-2 flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-lagoon" />{booking.branch}</p>
              </div>
              <div className="rounded-lg bg-white/45 p-4 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Seat and hours</p>
                <p className="mt-2 font-semibold">{booking.seat} · {booking.slot}</p>
              </div>
              <div className="rounded-lg bg-white/45 p-4 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Plan</p>
                <p className="mt-2 font-semibold">{booking.plan}</p>
              </div>
              <div className="rounded-lg bg-white/45 p-4 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Amount</p>
                <p className="mt-2 font-semibold">Rs {booking.amount}</p>
              </div>
              <div className="rounded-lg bg-white/45 p-4 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Start date</p>
                <p className="mt-2 font-semibold">{formatDate(booking.startDate)}</p>
              </div>
              <div className="rounded-lg bg-white/45 p-4 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-400">End date</p>
                <p className="mt-2 font-semibold">{formatDate(booking.endDate)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">No seat selected yet. Go to booking, select a seat, and save it to see it here.</p>
          )}
        </Card>

        {booking ? (
          <Card className="mt-6 border-brass/40 bg-brass/10">
            <div className="flex items-start gap-3">
              <Bell className="mt-1 h-5 w-5 text-brass" />
              <div>
                <h2 className="text-xl font-semibold">Membership reminder</h2>
                {showRenewalReminder ? (
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    Your monthly membership ends on {formatDate(booking.endDate)}. Please renew within the last 5 days to keep your seat active.
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    Renewal reminder is scheduled for the last 5 days before your membership ends on {formatDate(booking.endDate)}.
                  </p>
                )}
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="mt-6">
          <h2 className="mb-5 text-xl font-semibold">Attendance history</h2>
          <div className="grid grid-cols-7 gap-3">
            {userActivity.map((day) => (
              <div key={day.date} className="rounded-lg bg-white/45 p-3 dark:bg-white/5">
                <div className="mb-3 text-sm font-semibold">{day.date}</div>
                <div className="flex h-36 items-end rounded-md bg-slate-900/5 p-2 dark:bg-white/5">
                  <div className="w-full rounded bg-lagoon" style={{ height: `${day.hours * 10}%` }} />
                </div>
                <div className="mt-2 text-xs text-slate-500">{day.hours}h</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
