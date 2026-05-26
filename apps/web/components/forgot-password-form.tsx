"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!validateEmail(email)) {
      setError("Enter the email linked with your LN StudyHall account.");
      return;
    }

    setError(null);
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);
    setMessage("If this email exists, reset instructions will be sent by the admin team.");
  }

  return (
    <Card className="p-5 sm:p-7">
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Account email
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
              setMessage(null);
            }}
            aria-invalid={Boolean(error)}
            className={cn("h-12 rounded-md border bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-lagoon dark:bg-slate-950/70", error ? "border-red-500/70 focus:ring-red-500/30" : "border-black/10 dark:border-white/10")}
            placeholder="name@example.com"
          />
          {error ? <span className="text-xs font-medium text-red-600 dark:text-red-300">{error}</span> : null}
        </label>

        {message ? <p className="rounded-md border border-lagoon/25 bg-lagoon/10 p-3 text-sm text-lagoon">{message}</p> : null}

        <Button type="submit" variant="premium" className="mt-2 w-full" disabled={loading}>
          <MailCheck className="h-4 w-4" />
          {loading ? "Checking account..." : "Send reset instructions"}
        </Button>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Remembered your password? <Link href="/signin" className="font-semibold text-lagoon">Sign in</Link>
        </p>
      </form>
    </Card>
  );
}
