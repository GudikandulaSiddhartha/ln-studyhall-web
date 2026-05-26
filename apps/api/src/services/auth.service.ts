import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

export async function registerUser(input: { name: string; email: string; password: string; phone?: string }) {
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

export async function registerAdmin(input: { name: string; email: string; password: string; phone?: string; inviteCode: string }) {
  if (input.inviteCode !== env.ADMIN_INVITE_CODE) {
    throw new Error("Invalid admin invite code");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash,
      role: "ADMIN",
      admin: {
        create: {
          permissions: ["branches:manage", "bookings:read", "analytics:read", "memberships:manage", "notifications:send"]
        }
      }
    }
  });

  return createAuthResponse(user);
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user?.passwordHash) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  return createAuthResponse(user);
}

function createAuthResponse(user: { id: string; name: string; email: string; role: "USER" | "ADMIN" | "SUPER_ADMIN" }) {
  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}
