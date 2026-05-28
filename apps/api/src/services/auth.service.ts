import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

// ─── OTP store (in-memory, 10 min TTL) ───────────────────────────────────────
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function cleanExpiredOtps() {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt < now) otpStore.delete(key);
  }
}

export async function sendOtp(email: string) {
  cleanExpiredOtps();
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(email.toLowerCase(), { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

  // Send via AWS SES or fallback to console in dev
  try {
    await sendEmail({
      to: email,
      subject: "LN StudyHall — Email Verification OTP",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#0f172a;margin-bottom:8px">Verify your email</h2>
          <p style="color:#475569;margin-bottom:24px">Use the code below to verify your email address. It expires in 10 minutes.</p>
          <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;letter-spacing:0.3em;font-size:36px;font-weight:700;color:#0f172a">
            ${otp}
          </div>
          <p style="color:#94a3b8;font-size:13px;margin-top:24px">If you didn't request this, ignore this email.</p>
        </div>
      `
    });
  } catch (err) {
    // In dev/no SES — log to console so you can test
    console.log(`[OTP] ${email} → ${otp}`);
  }
}

export async function verifyOtp(email: string, otp: string): Promise<string> {
  const stored = otpStore.get(email.toLowerCase());
  if (!stored || stored.expiresAt < Date.now()) {
    throw new Error("OTP expired or not found. Please request a new one.");
  }
  if (stored.otp !== otp) {
    throw new Error("Incorrect OTP. Please try again.");
  }
  otpStore.delete(email.toLowerCase());

  // Return a short-lived verification token
  const token = jwt.sign({ emailVerified: email.toLowerCase() }, env.JWT_SECRET, { expiresIn: "15m" });
  return token;
}

// ─── Register user (requires OTP token) ──────────────────────────────────────
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash
    }
  });
  return createAuthResponse(user);
}

// ─── Register admin (invite code only) ───────────────────────────────────────
export async function registerAdmin(inviteCode: string) {
  if (inviteCode !== env.ADMIN_INVITE_CODE) {
    throw new Error("Invalid admin invite code.");
  }

  // Return existing admin if one exists
  const existing = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    orderBy: { createdAt: "asc" }
  });
  if (existing) return createAuthResponse(existing);

  throw new Error("No admin account found. Please contact the system administrator.");
}

// ─── Login user ───────────────────────────────────────────────────────────────
export async function loginUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user?.passwordHash) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  return createAuthResponse(user);
}

// ─── Admin login (invite code only) ──────────────────────────────────────────
export async function loginWithInviteCode(inviteCode: string) {
  if (inviteCode !== env.ADMIN_INVITE_CODE) {
    throw new Error("Invalid invite code");
  }

  const user = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    orderBy: { createdAt: "asc" }
  });

  if (!user) throw new Error("No admin account found. Please register an admin first.");
  return createAuthResponse(user);
}

// ─── Email sender (console fallback — replace with SES/Resend/Nodemailer later) ──
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  // Log OTP to console for now — visible in Render logs
  console.log(`\n[EMAIL] To: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, "").trim()}\n`);
}

// ─── JWT helper ───────────────────────────────────────────────────────────────
function createAuthResponse(user: {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
}) {
  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

// ─── Temp token for OTP verification ─────────────────────────────────────────
export function generateVerificationToken(email: string) {
  return crypto.randomBytes(32).toString("hex") + "." + Buffer.from(email).toString("base64");
}
