"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { auth, storeAuth, ApiError } from "@/lib/api";

type FieldErrors = {
  email?: string;
  password?: string;
};

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const errors: FieldErrors = {};
    if (!validateEmail(email)) errors.email = "Enter a valid email address.";
    if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    try {
      const result = await auth.login({ email: email.trim(), password });
      storeAuth(result.token, result.user);
      router.push(result.user.role === "USER" ? "/dashboard" : "/admin");
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.code === "NETWORK") {
          setError("Cannot connect to the server. Please try again in a moment.");
        } else if (caught.code === "AUTH") {
          setError("Invalid email or password.");
        } else {
          setError(caught.message || "Sign in failed. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5 sm:p-7">
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldErrors((current) => ({ ...current, email: undefined }));
              setError(null);
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            className={cn(
              "h-12 rounded-md border bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-lagoon dark:bg-slate-950/70",
              fieldErrors.email
                ? "border-red-500/70 focus:ring-red-500/30"
                : "border-black/10 dark:border-white/10"
            )}
            placeholder="name@example.com"
          />
          {fieldErrors.email ? (
            <span className="text-xs font-medium text-red-600 dark:text-red-300">
              {fieldErrors.email}
            </span>
          ) : null}
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
              setError(null);
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            className={cn(
              "h-12 rounded-md border bg-white/70 px-4 font-normal outline-none transition focus:ring-2 focus:ring-lagoon dark:bg-slate-950/70",
              fieldErrors.password
                ? "border-red-500/70 focus:ring-red-500/30"
                : "border-black/10 dark:border-white/10"
            )}
            placeholder="Enter password"
          />
          {fieldErrors.password ? (
            <span className="text-xs font-medium text-red-600 dark:text-red-300">
              {fieldErrors.password}
            </span>
          ) : null}
        </label>

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <input type="checkbox" className="h-4 w-4 accent-lagoon" />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-semibold text-lagoon">
            Forgot password?
          </Link>
        </div>

        {error ? (
          <p className="rounded-md border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="premium" className="mt-2 w-full" disabled={loading}>
          <LogIn className="h-4 w-4" />
          {loading ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          New to LN StudyHall?{" "}
          <Link href="/register" className="font-semibold text-lagoon">
            Create account
          </Link>
        </p>
      </form>
    </Card>
  );
}
