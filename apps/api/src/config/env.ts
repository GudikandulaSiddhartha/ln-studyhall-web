import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  // No default — server must crash loudly if this is missing in production.
  // Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters. Set it in your .env or deployment dashboard."),
  JWT_EXPIRES_IN: z.string().default("7d"),
  // No default — a guessable fallback lets anyone log in as admin.
  ADMIN_INVITE_CODE: z.string().min(16, "ADMIN_INVITE_CODE must be at least 16 characters. Set a long random value."),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  PORT: z.coerce.number().default(4000),
  RESEND_API_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);
