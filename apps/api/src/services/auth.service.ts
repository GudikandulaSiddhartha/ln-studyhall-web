import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

// ─── OTP helpers (DB-backed — survives server restarts) ───────────────────────

export async function sendOtp(email: string) {
  const normalised = email.toLowerCase().trim();

  // Delete any old OTPs for this email first
  await prisma.otpToken.deleteMany({ where: { email: normalised } });

  const code = String(Math.floor(100_000 + Math.random() * 900_000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.otpToken.create({ data: { email: normalised, code, expiresAt } });

  await sendEmail({
    to: normalised,
    subject: "LN StudyHall — Your Verification Code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#0f172a;margin-bottom:8px">Verify your email</h2>
        <p style="color:#475569;margin-bottom:24px">
          Use the code below to verify your LN StudyHall account.
          It expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center;
                    letter-spacing:0.35em;font-size:40px;font-weight:800;color:#0f172a;font-family:monospace">
          ${code}
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;text-align:center">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `
  });
}

export async function verifyOtp(email: string, code: string): Promise<string> {
  const normalised = email.toLowerCase().trim();

  const record = await prisma.otpToken.findFirst({
    where: { email: normalised },
    orderBy: { createdAt: "desc" }
  });

  if (!record) {
    throw new Error("No OTP found for this email. Please request a new one.");
  }
  if (record.expiresAt < new Date()) {
    await prisma.otpToken.delete({ where: { id: record.id } });
    throw new Error("OTP has expired. Please request a new one.");
  }
  if (record.code !== code) {
    throw new Error("Incorrect OTP. Please try again.");
  }

  // OTP used — delete it immediately (one-time use)
  await prisma.otpToken.delete({ where: { id: record.id } });

  // Return a short-lived token that the register step will validate
  return jwt.sign(
    { emailVerified: normalised },
    env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

// ─── Register user ────────────────────────────────────────────────────────────

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() }
  });
  if (existing) throw new Error("An account with this email already exists.");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      phone: input.phone?.trim(),
      passwordHash
    }
  });

  // Welcome email — fire and forget (don't block registration)
  sendEmail({
    to: user.email,
    subject: "Welcome to LN StudyHall!",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#0f172a">Welcome, ${user.name}!</h2>
        <p style="color:#475569">
          Your LN StudyHall account is ready. You can now log in and book your seat.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin-top:32px">
          LN StudyHall — Hanamkonda &amp; Warangal
        </p>
      </div>
    `
  }).catch(() => {/* non-critical */});

  return createAuthResponse(user);
}

// ─── Register admin (invite code only) ───────────────────────────────────────

export async function registerAdmin(inviteCode: string) {
  if (inviteCode !== env.ADMIN_INVITE_CODE) {
    throw new Error("Invalid admin invite code.");
  }
  const existing = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    orderBy: { createdAt: "asc" }
  });
  if (existing) return createAuthResponse(existing);
  throw new Error("No admin account found. Contact the system administrator.");
}

// ─── User login ───────────────────────────────────────────────────────────────

export async function loginUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() }
  });
  if (!user?.passwordHash) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  return createAuthResponse(user);
}

// ─── Admin login ──────────────────────────────────────────────────────────────

export async function loginWithInviteCode(inviteCode: string) {
  if (inviteCode !== env.ADMIN_INVITE_CODE) {
    throw new Error("Invalid invite code");
  }
  const user = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    orderBy: { createdAt: "asc" }
  });
  if (!user) throw new Error("No admin account found. Register an admin first.");
  return createAuthResponse(user);
}

// ─── Email sender via Resend ──────────────────────────────────────────────────
// Resend free tier: 3,000 emails/month — https://resend.com
// Set RESEND_API_KEY in your .env / Render dashboard.
// From address: use a domain you own, or onboarding@resend.dev for testing.

const FROM_ADDRESS = "LN StudyHall <noreply@ln-studyhall.in>"; // change to your domain

async function sendEmail({
  to, subject, html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!env.RESEND_API_KEY) {
    // Dev fallback — print to console so you can still test locally
    console.log(`\n[EMAIL — no RESEND_API_KEY set]\nTo: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, "").trim()}\n`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RESEND_API_KEY}`
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html })
  });

  if (!response.ok) {
    const error = await response.text();
    // Log but don't crash the request — OTP is stored in DB regardless
    console.error(`[Resend] Failed to send email to ${to}:`, error);
  }
}

// ─── JWT helper ───────────────────────────────────────────────────────────────

function createAuthResponse(user: {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
}) {
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  };
}
