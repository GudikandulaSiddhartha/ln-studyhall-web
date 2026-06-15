import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { authLimiter, otpLimiter } from "../middleware/security.js";
import { loginUser, loginWithInviteCode, registerAdmin, registerUser, sendOtp, verifyOtp } from "../services/auth.service.js";

export const authRouter = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8)
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

const adminRegisterSchema = z.object({
  body: z.object({
    inviteCode: z.string().min(1)
  })
});

const adminLoginSchema = z.object({
  body: z.object({
    inviteCode: z.string().min(1)
  })
});

const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6)
  })
});

// ─── OTP routes ───────────────────────────────────────────────────────────────

authRouter.post("/otp/send", otpLimiter, validate(sendOtpSchema), async (_request, response, next) => {
  try {
    await sendOtp(response.locals.validated.body.email);
    response.json({ message: "OTP sent to your email" });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/otp/verify", otpLimiter, validate(verifyOtpSchema), async (_request, response, next) => {
  try {
    const token = await verifyOtp(
      response.locals.validated.body.email,
      response.locals.validated.body.otp
    );
    response.json({ token });
  } catch (error) {
    next(error);
  }
});

// ─── User register ────────────────────────────────────────────────────────────

authRouter.post("/register", authLimiter, validate(registerSchema), async (_request, response, next) => {
  try {
    response.status(201).json(await registerUser(response.locals.validated.body));
  } catch (error) {
    next(error);
  }
});

// ─── Admin register (invite code only) ───────────────────────────────────────

authRouter.post("/register/admin", authLimiter, validate(adminRegisterSchema), async (_request, response, next) => {
  try {
    response.status(201).json(await registerAdmin(response.locals.validated.body.inviteCode));
  } catch (error) {
    next(error);
  }
});

// ─── User login ───────────────────────────────────────────────────────────────

authRouter.post("/login", authLimiter, validate(loginSchema), async (_request, response, next) => {
  try {
    response.json(await loginUser(response.locals.validated.body));
  } catch (error) {
    next(error);
  }
});

// ─── Admin login (invite code only) ──────────────────────────────────────────

authRouter.post("/admin-login", authLimiter, validate(adminLoginSchema), async (_request, response, next) => {
  try {
    response.json(await loginWithInviteCode(response.locals.validated.body.inviteCode));
  } catch (error) {
    next(error);
  }
});

authRouter.get("/google", (_request, response) => {
  response.json({ message: "Configure Google OAuth here.", scopes: ["openid", "profile", "email"] });
});
