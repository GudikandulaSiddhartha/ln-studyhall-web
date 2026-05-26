import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { loginUser, registerAdmin, registerUser } from "../services/auth.service.js";

export const authRouter = Router();

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
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8),
    inviteCode: z.string().min(8)
  })
});

authRouter.post("/register", validate(registerSchema), async (request, response, next) => {
  try {
    response.status(201).json(await registerUser(response.locals.validated.body));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/register/admin", validate(adminRegisterSchema), async (_request, response, next) => {
  try {
    response.status(201).json(await registerAdmin(response.locals.validated.body));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", validate(loginSchema), async (request, response, next) => {
  try {
    response.json(await loginUser(response.locals.validated.body));
  } catch (error) {
    next(error);
  }
});

authRouter.get("/google", (_request, response) => {
  response.json({
    message: "Configure Google OAuth here or connect Auth.js on the Next.js frontend.",
    scopes: ["openid", "profile", "email"]
  });
});
