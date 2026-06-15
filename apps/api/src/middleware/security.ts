import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { Express } from "express";
import { env } from "../config/env.js";

// ─── Reusable limiter factory ──────────────────────────────────────────────────
function makeLimiter(max: number, windowMinutes: number, message: string) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message }
  });
}

// ─── Route-specific limiters (exported for use in route files) ────────────────

/** Auth: 10 attempts per 15 min — prevents brute-force on login/OTP */
export const authLimiter = makeLimiter(
  10, 15,
  "Too many login attempts. Please wait 15 minutes before trying again."
);

/** OTP: 5 sends per 15 min — prevents OTP spam / email flooding */
export const otpLimiter = makeLimiter(
  5, 15,
  "Too many OTP requests. Please wait 15 minutes."
);

/** Booking creation: 5 per 15 min — prevents seat squatting bots */
export const bookingLimiter = makeLimiter(
  5, 15,
  "Too many booking attempts. Please wait 15 minutes before trying again."
);

/** Admin routes: 120 per 15 min — generous but protected */
export const adminLimiter = makeLimiter(
  120, 15,
  "Too many admin requests. Please slow down."
);

export function applySecurity(app: Express) {
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true
    })
  );
  // Global fallback: 300 req / 15 min (route-specific limiters above are tighter)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
}
