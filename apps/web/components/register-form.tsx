"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Role = "user" | "admin";

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  inviteCode: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  inviteCode: ""
};

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(values: FormState, role: Role) {
  const errors: FieldErrors = {};

  if (values.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!validateEmail(values.email)) errors.email = "Enter a valid email address.";
  if (values.phone && values.phone.replace(/\D/g, "").length < 10) errors.phone = "Enter a valid phone number.";
  if (values.password.length < 8) errors.password = "Password must be at least 8 characters.";
  if (role === "admin" && values.inviteCode.trim().length < 8) errors.inviteCode = "Admin invite code is required.";

  return errors;
}

export function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("user");
  const [values, setValues] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(() => (role === "admin" ? "/auth/register/admin" : "/auth/register"), [role]);

  function updateField(field: keyof FormState, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const errors = validateForm(values, role);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    const payload: Record<string, string> = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      password: values.password
    };

    if (role === "admin") {
      payload.inviteCode = values.inviteCode.trim();
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as AuthResponse | { message?: string };
      if (!response.ok) {
        throw new Error("message" in data && data.message ? data.message : "Registration failed");
      }

      const auth = data as AuthResponse;
      localStorage.setItem("ln_auth_token", auth.token);
      localStorage.setItem("ln_auth_user", JSON.stringify(auth.user));
      setMessage(role === "admin" ? "Admin account created. Opening admin dashboard..." : "Account created. Opening user dashboard...");
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5 sm:p-7">
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setRole("user")}
          className={cn(
            "rounded-lg border p-4 text-left transition hover:-translate-y-0.5",
            role === "user" ? "border-lagoon bg-lagoon/10 shadow-glow" : "border-black/10 bg-white/35 dark:border-white/10 dark:bg-white/5"
          )}
        >
          <UserRound className="mb-3 h-5 w-5 text-lagoon" />
          <span className="block font-semibold">User</span>
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Student dashboard</span>
        </button>
        <button
          type="button"
          onClick={() => setRole("admin")}
          className={cn(
            "rounded-lg border p-4 text-left transition hover:-translate-y-0.5",
            role === "admin" ? "border-brass bg-brass/10 shadow-warm" : "border-black/10 bg-white/35 dark:border-white/10 dark:bg-white/5"
          )}
        >
          <ShieldCheck className="mb-3 h-5 w-5 text-brass" />
          <span className="block font-semibold">Admin</span>
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Invite code required</span>
        </button>
      </div>

      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <AuthInput label="Full name" value={values.name} error={fieldErrors.name} placeholder="Enter full name" onChange={(value) => updateField("name", value)} />
        <AuthInput label="Email" type="email" value={values.email} error={fieldErrors.email} placeholder="name@example.com" onChange={(value) => updateField("email", value)} />
        <AuthInput label="Phone" value={values.phone} error={fieldErrors.phone} placeholder="+91 8555227719" onChange={(value) => updateField("phone", value)} />
        <AuthInput label="Password" type="password" value={values.password} error={fieldErrors.password} placeholder="Minimum 8 characters" onChange={(value) => updateField("password", value)} />
        {role === "admin" ? (
          <AuthInput label="Admin invite code" value={values.inviteCode} error={fieldErrors.inviteCode} placeholder="Private admin code" onChange={(value) => updateField("inviteCode", value)} accent="brass" />
        ) : null}

        {error ? <p className="rounded-md border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
        {message ? <p className="rounded-md border border-lagoon/25 bg-lagoon/10 p-3 text-sm text-lagoon">{message}</p> : null}

        <Button type="submit" variant="premium" className="mt-2 w-full" disabled={loading}>
          <UserPlus className="h-4 w-4" />
          {loading ? "Creating account..." : role === "admin" ? "Create admin account" : "Create user account"}
        </Button>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account? <Link href="/signin" className="font-semibold text-lagoon">Sign in</Link>
        </p>
      </form>
    </Card>
  );
}

function AuthInput({
  label,
  type = "text",
  value,
  error,
  placeholder,
  accent = "lagoon",
  onChange
}: {
  label: string;
  type?: string;
  value: string;
  error?: string;
  placeholder: string;
  accent?: "lagoon" | "brass";
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-12 rounded-md border bg-white/70 px-4 font-normal outline-none transition focus:ring-2 dark:bg-slate-950/70",
          error ? "border-red-500/70 focus:ring-red-500/30" : "border-black/10 dark:border-white/10",
          accent === "brass" ? "focus:ring-brass" : "focus:ring-lagoon"
        )}
        placeholder={placeholder}
      />
      {error ? <span className="text-xs font-medium text-red-600 dark:text-red-300">{error}</span> : null}
    </label>
  );
}
