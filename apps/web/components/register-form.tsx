"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserRound, UserPlus, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { auth, storeAuth, ApiError, API_URL } from "@/lib/api";

type Role = "user" | "admin";
type OtpStep = "idle" | "sending" | "sent" | "verifying" | "verified";

export function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("user");

  // ── User fields ──────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpStep, setOtpStep] = useState<OtpStep>("idle");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // ── Admin fields ─────────────────────────────────────────────────────────────
  const [inviteCode, setInviteCode] = useState("");

  // ── Shared ───────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── OTP: send ────────────────────────────────────────────────────────────────
  async function sendOtp() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors((p) => ({ ...p, email: "Enter a valid email first." }));
      return;
    }
    setOtpStep("sending");
    setOtpError(null);
    try {
      const res = await fetch(`${API_URL}/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed to send OTP");
      setOtpStep("sent");
      // Countdown 60s
      let secs = 60;
      setCountdown(secs);
      const t = setInterval(() => {
        secs -= 1;
        setCountdown(secs);
        if (secs <= 0) clearInterval(t);
      }, 1000);
    } catch (err) {
      setOtpStep("idle");
      setOtpError(err instanceof Error ? err.message : "Failed to send OTP");
    }
  }

  // ── OTP: verify ──────────────────────────────────────────────────────────────
  async function verifyOtp() {
    if (otp.length !== 6) { setOtpError("Enter the 6-digit code."); return; }
    setOtpStep("verifying");
    setOtpError(null);
    try {
      const res = await fetch(`${API_URL}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Invalid OTP");
      setOtpToken(data.token);
      setOtpStep("verified");
    } catch (err) {
      setOtpStep("sent");
      setOtpError(err instanceof Error ? err.message : "Invalid OTP");
    }
  }

  // ── Submit user registration ──────────────────────────────────────────────────
  async function onUserSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};
    if (name.trim().length < 2) errors.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
    if (password.length < 8) errors.password = "Min 8 characters.";
    if (otpStep !== "verified") errors.otp = "Please verify your email first.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const result = await auth.register({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, password, otpToken } as Parameters<typeof auth.register>[0]);
      storeAuth(result.token, result.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  // ── Submit admin (invite code only) ──────────────────────────────────────────
  async function onAdminSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!inviteCode.trim()) { setFieldErrors({ inviteCode: "Enter your invite code." }); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Invalid invite code.");
      storeAuth(data.token, data.user);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid invite code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5 sm:p-7">
      {/* Role tabs */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => { setRole("user"); setError(null); }}
          className={cn("rounded-lg border p-4 text-left transition hover:-translate-y-0.5",
            role === "user" ? "border-lagoon bg-lagoon/10" : "border-black/10 bg-white/35 dark:border-white/10 dark:bg-white/5")}>
          <UserRound className="mb-3 h-5 w-5 text-lagoon" />
          <span className="block font-semibold">Student</span>
          <span className="mt-1 block text-xs text-slate-500">Register with email OTP</span>
        </button>
        <button type="button" onClick={() => { setRole("admin"); setError(null); }}
          className={cn("rounded-lg border p-4 text-left transition hover:-translate-y-0.5",
            role === "admin" ? "border-brass bg-brass/10" : "border-black/10 bg-white/35 dark:border-white/10 dark:bg-white/5")}>
          <ShieldCheck className="mb-3 h-5 w-5 text-brass" />
          <span className="block font-semibold">Admin</span>
          <span className="mt-1 block text-xs text-slate-500">Invite code only</span>
        </button>
      </div>

      {/* ── USER FORM ── */}
      {role === "user" && (
        <form onSubmit={onUserSubmit} noValidate className="grid gap-4">
          {/* Name */}
          <label className="grid gap-2 text-sm font-medium">Full name
            <input value={name} onChange={(e) => setName(e.target.value)}
              className={cn("h-12 rounded-md border bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-lagoon dark:bg-slate-950/70", fieldErrors.name ? "border-red-500/70" : "border-black/10 dark:border-white/10")}
              placeholder="Gudikandula Siddhartha" />
            {fieldErrors.name && <span className="text-xs text-red-500">{fieldErrors.name}</span>}
          </label>

          {/* Email + Send OTP */}
          <label className="grid gap-2 text-sm font-medium">Email
            <div className="flex gap-2">
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setOtpStep("idle"); setFieldErrors((p) => ({ ...p, email: undefined as unknown as string })); }}
                disabled={otpStep === "verified"}
                className={cn("h-12 flex-1 rounded-md border bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-lagoon dark:bg-slate-950/70", fieldErrors.email ? "border-red-500/70" : "border-black/10 dark:border-white/10")}
                placeholder="name@example.com" />
              <Button type="button" variant="outline" className="shrink-0" onClick={sendOtp}
                disabled={otpStep === "verified" || otpStep === "sending" || (otpStep === "sent" && countdown > 0)}>
                <Mail className="h-4 w-4" />
                {otpStep === "verified" ? "Verified ✓" : otpStep === "sending" ? "Sending..." : otpStep === "sent" && countdown > 0 ? `Resend (${countdown}s)` : "Send OTP"}
              </Button>
            </div>
            {fieldErrors.email && <span className="text-xs text-red-500">{fieldErrors.email}</span>}
          </label>

          {/* OTP input */}
          {(otpStep === "sent" || otpStep === "verifying") && (
            <label className="grid gap-2 text-sm font-medium">
              Enter OTP sent to {email}
              <div className="flex gap-2">
                <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-12 flex-1 rounded-md border border-black/10 bg-white/70 px-4 text-center font-mono text-xl tracking-[0.5em] outline-none transition focus:ring-2 focus:ring-lagoon dark:border-white/10 dark:bg-slate-950/70"
                  placeholder="000000" maxLength={6} />
                <Button type="button" variant="outline" onClick={verifyOtp} disabled={otpStep === "verifying"}>
                  <KeyRound className="h-4 w-4" />
                  {otpStep === "verifying" ? "Checking..." : "Verify"}
                </Button>
              </div>
              {otpError && <span className="text-xs text-red-500">{otpError}</span>}
            </label>
          )}

          {otpStep === "verified" && (
            <div className="rounded-md border border-lagoon/30 bg-lagoon/10 px-4 py-3 text-sm text-lagoon">
              ✓ Email verified successfully
            </div>
          )}

          {/* Phone */}
          <label className="grid gap-2 text-sm font-medium">Phone (optional)
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="h-12 rounded-md border border-black/10 bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-lagoon dark:border-white/10 dark:bg-slate-950/70"
              placeholder="+91 8555827719" />
          </label>

          {/* Password */}
          <label className="grid gap-2 text-sm font-medium">Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className={cn("h-12 rounded-md border bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-lagoon dark:bg-slate-950/70", fieldErrors.password ? "border-red-500/70" : "border-black/10 dark:border-white/10")}
              placeholder="Minimum 8 characters" />
            {fieldErrors.password && <span className="text-xs text-red-500">{fieldErrors.password}</span>}
          </label>

          {fieldErrors.otp && <p className="text-sm text-red-500">{fieldErrors.otp}</p>}
          {error && <p className="rounded-md border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">{error}</p>}

          <Button type="submit" variant="premium" className="mt-2 w-full" disabled={loading}>
            <UserPlus className="h-4 w-4" />
            {loading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-lagoon">Sign in</Link>
          </p>
        </form>
      )}

      {/* ── ADMIN FORM ── */}
      {role === "admin" && (
        <form onSubmit={onAdminSubmit} noValidate className="grid gap-4">
          <div className="rounded-lg border border-brass/30 bg-brass/5 p-4 text-sm text-slate-600 dark:text-slate-300">
            <ShieldCheck className="mb-2 h-5 w-5 text-brass" />
            Enter your private admin invite code. No name, email, or password required.
          </div>
          <label className="grid gap-2 text-sm font-medium">Admin invite code
            <input type="password" value={inviteCode} onChange={(e) => { setInviteCode(e.target.value); setFieldErrors({}); setError(null); }}
              className={cn("h-12 rounded-md border bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-brass dark:bg-slate-950/70", fieldErrors.inviteCode ? "border-red-500/70" : "border-black/10 dark:border-white/10")}
              placeholder="Enter your invite code" />
            {fieldErrors.inviteCode && <span className="text-xs text-red-500">{fieldErrors.inviteCode}</span>}
          </label>
          {error && <p className="rounded-md border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">{error}</p>}
          <Button type="submit" variant="premium" className="mt-2 w-full" disabled={loading}>
            <ShieldCheck className="h-4 w-4" />
            {loading ? "Verifying..." : "Access admin dashboard"}
          </Button>
        </form>
      )}
    </Card>
  );
}
