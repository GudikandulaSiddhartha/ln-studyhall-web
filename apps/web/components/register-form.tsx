"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { auth, storeAuth, ApiError, API_URL } from "@/lib/api";

type Role = "user" | "admin";

export function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("user");

  // User fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Admin fields
  const [inviteCode, setInviteCode] = useState("");

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── User submit ──────────────────────────────────────────────────────────────
  async function onUserSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};
    if (name.trim().length < 2) errors.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
    if (password.length < 8) errors.password = "Minimum 8 characters.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const result = await auth.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password
      });
      storeAuth(result.token, result.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  // ── Admin submit (invite code only) ──────────────────────────────────────────
  async function onAdminSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!inviteCode.trim()) {
      setFieldErrors({ inviteCode: "Enter your invite code." });
      return;
    }
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
        <button type="button" onClick={() => { setRole("user"); setError(null); setFieldErrors({}); }}
          className={cn("rounded-lg border p-4 text-left transition hover:-translate-y-0.5",
            role === "user" ? "border-lagoon bg-lagoon/10" : "border-black/10 bg-white/35 dark:border-white/10 dark:bg-white/5")}>
          <UserRound className="mb-3 h-5 w-5 text-lagoon" />
          <span className="block font-semibold">Student</span>
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Seat booking & dashboard</span>
        </button>
        <button type="button" onClick={() => { setRole("admin"); setError(null); setFieldErrors({}); }}
          className={cn("rounded-lg border p-4 text-left transition hover:-translate-y-0.5",
            role === "admin" ? "border-brass bg-brass/10" : "border-black/10 bg-white/35 dark:border-white/10 dark:bg-white/5")}>
          <ShieldCheck className="mb-3 h-5 w-5 text-brass" />
          <span className="block font-semibold">Admin</span>
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Invite code only</span>
        </button>
      </div>

      {/* ── USER FORM ── */}
      {role === "user" && (
        <form onSubmit={onUserSubmit} noValidate className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">Full name
            <input value={name} onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: "" })); }}
              className={cn("h-12 rounded-md border bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-lagoon dark:bg-slate-950/70",
                fieldErrors.name ? "border-red-500/70" : "border-black/10 dark:border-white/10")}
              placeholder="Gudikandula Siddhartha" />
            {fieldErrors.name && <span className="text-xs text-red-500">{fieldErrors.name}</span>}
          </label>

          <label className="grid gap-2 text-sm font-medium">Email
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
              className={cn("h-12 rounded-md border bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-lagoon dark:bg-slate-950/70",
                fieldErrors.email ? "border-red-500/70" : "border-black/10 dark:border-white/10")}
              placeholder="name@example.com" />
            {fieldErrors.email && <span className="text-xs text-red-500">{fieldErrors.email}</span>}
          </label>

          <label className="grid gap-2 text-sm font-medium">Phone (optional)
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="h-12 rounded-md border border-black/10 bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-lagoon dark:border-white/10 dark:bg-slate-950/70"
              placeholder="+91 8555827719" />
          </label>

          <label className="grid gap-2 text-sm font-medium">Password
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
              className={cn("h-12 rounded-md border bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-lagoon dark:bg-slate-950/70",
                fieldErrors.password ? "border-red-500/70" : "border-black/10 dark:border-white/10")}
              placeholder="Minimum 8 characters" />
            {fieldErrors.password && <span className="text-xs text-red-500">{fieldErrors.password}</span>}
          </label>

          {error && <p className="rounded-md border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">{error}</p>}

          <Button type="submit" variant="premium" className="mt-2 w-full" disabled={loading}>
            <UserPlus className="h-4 w-4" />
            {loading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
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
              className={cn("h-12 rounded-md border bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-brass dark:bg-slate-950/70",
                fieldErrors.inviteCode ? "border-red-500/70" : "border-black/10 dark:border-white/10")}
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
