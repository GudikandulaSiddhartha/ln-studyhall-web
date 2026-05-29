"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storeAuth, API_URL } from "@/lib/api";
import { Navbar } from "@/components/navbar";

export default function AdminLoginPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!inviteCode.trim()) { setError("Enter your admin invite code."); return; }

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
    <main className="min-h-screen px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <Navbar />
      <div className="mx-auto max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl border border-brass/30 bg-brass/10">
            <ShieldCheck className="h-7 w-7 text-brass" />
          </div>
          <h1 className="text-3xl font-semibold">Admin access</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Enter your private invite code to access the admin dashboard.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Admin invite code
            <input
              type="password"
              value={inviteCode}
              onChange={(e) => { setInviteCode(e.target.value); setError(null); }}
              className="h-12 rounded-md border border-black/10 bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-brass dark:border-white/10 dark:bg-slate-950/70"
              placeholder="Enter invite code"
              autoFocus
            />
          </label>

          {error && (
            <p className="rounded-md border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          )}

          <Button type="submit" variant="premium" className="w-full" disabled={loading}>
            <ShieldCheck className="h-4 w-4" />
            {loading ? "Verifying..." : "Access admin dashboard"}
          </Button>
        </form>
      </div>
    </main>
  );
}
