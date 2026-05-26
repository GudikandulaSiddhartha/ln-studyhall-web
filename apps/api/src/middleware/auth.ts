import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

type JwtPayload = {
  sub: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace("Bearer ", "");
  if (!token) return response.status(401).json({ message: "Authentication required" });

  try {
    request.user = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return next();
  } catch {
    return response.status(401).json({ message: "Invalid token" });
  }
}

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  if (!request.user || !["ADMIN", "SUPER_ADMIN"].includes(request.user.role)) {
    return response.status(403).json({ message: "Admin access required" });
  }
  return next();
}
