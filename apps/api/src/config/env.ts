import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24).default("local-development-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ADMIN_INVITE_CODE: z.string().min(8).default("ln-admin-local"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  PORT: z.coerce.number().default(4000)
});

export const env = envSchema.parse(process.env);
