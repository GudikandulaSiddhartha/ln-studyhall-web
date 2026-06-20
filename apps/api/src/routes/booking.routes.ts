import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { bookingLimiter } from "../middleware/security.js";

export const bookingRouter = Router();

type AvailabilitySeat = {
  id: string;
  label: string;
  status: string;
  bookings: unknown[];
};

const availabilitySchema = z.object({
  query: z.object({
    branchId: z.string(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime()
  })
});

// Guest fields — no account needed
const createBookingSchema = z.object({
  body: z.object({
    branchId: z.string(),
    seatId: z.string(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    guestName: z.string().min(2, "Please enter your full name"),
    guestPhone: z.string().min(10, "Please enter a valid 10-digit mobile number").max(10)
  })
});

// ─── Availability (public) ────────────────────────────────────────────────────
bookingRouter.get(
  "/availability",
  validate(availabilitySchema),
  async (_request, response, next) => {
    try {
      const { branchId, startAt, endAt } = response.locals.validated.query;

      const seats = await prisma.seat.findMany({
        where: { branchId },
        orderBy: { label: "asc" },
        include: {
          bookings: {
            where: {
              status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
              startAt: { lt: new Date(endAt) },
              endAt: { gt: new Date(startAt) }
            }
          }
        }
      });

      const sorted = (seats as AvailabilitySeat[]).sort(
        (a, b) => Number(a.label) - Number(b.label)
      );

      response.json(
        sorted.map((seat) => ({
          id: seat.id,
          label: seat.label,
          seatNumber: Number(seat.label),
          status:
            seat.status !== "AVAILABLE" || seat.bookings.length > 0
              ? "BOOKED"
              : "AVAILABLE"
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

// ─── Create booking — no sign-in required (guest booking) ────────────────────
bookingRouter.post(
  "/",
  bookingLimiter,
  validate(createBookingSchema),
  async (request, response, next) => {
    try {
      const input = response.locals.validated.body;
      const startAt = new Date(input.startAt);
      const endAt = new Date(input.endAt);

      if (startAt >= endAt) {
        return response.status(400).json({ message: "End time must be after start time" });
      }

      // Optional: attach signed-in user account if token present
      let userId: string | null = null;
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const jwt = (await import("jsonwebtoken")).default;
          const { env } = await import("../config/env.js");
          const decoded = jwt.verify(authHeader.slice(7), env.JWT_SECRET) as { sub: string };
          userId = decoded.sub;
        } catch { /* guest — no user attached */ }
      }

      const booking = await prisma.$transaction(
        async (transaction: Prisma.TransactionClient) => {
          // Advisory lock — prevents race condition on same seat
          await transaction.$executeRaw`
            SELECT pg_advisory_xact_lock(hashtext(${input.seatId}))
          `;

          // If signed in — prevent multiple active bookings
          if (userId) {
            const existing = await transaction.booking.findFirst({
              where: { userId, status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] } },
              select: { id: true }
            });
            if (existing) {
              throw new Error("You already have an active booking. Cancel it before booking a new seat.");
            }
          }

          const seat = await transaction.seat.findFirst({
            where: { id: input.seatId, branchId: input.branchId },
            select: { id: true, status: true, label: true }
          });

          if (!seat || seat.status !== "AVAILABLE") {
            throw new Error("Seat is not available for booking");
          }

          const conflict = await transaction.booking.findFirst({
            where: {
              seatId: input.seatId,
              status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
              startAt: { lt: endAt },
              endAt: { gt: startAt }
            },
            select: { id: true }
          });

          if (conflict) throw new Error("Seat is no longer available");

          // PENDING — admin confirms after verifying UPI UTR number
          return transaction.booking.create({
            data: {
              ...(userId ? { userId } : {}),
              branchId: input.branchId,
              seatId: input.seatId,
              startAt,
              endAt,
              qrToken: crypto.randomBytes(24).toString("hex"),
              status: "PENDING",
              // Guest name + phone stored in notes field
              notes: JSON.stringify({
                guestName: input.guestName,
                guestPhone: input.guestPhone
              })
            },
            include: {
              seat: { select: { label: true } },
              branch: { select: { name: true } }
            }
          });
        },
        { isolationLevel: "Serializable" as const, timeout: 10000 }
      );

      response.status(201).json({
        ...booking,
        guestName: input.guestName,
        guestPhone: input.guestPhone
      });
    } catch (error) {
      if (
        error instanceof Error &&
        [
          "Seat is no longer available",
          "Seat is not available for booking",
          "You already have an active booking. Cancel it before booking a new seat."
        ].includes(error.message)
      ) {
        return response.status(409).json({ message: error.message });
      }
      next(error);
    }
  }
);

// ─── Check in ────────────────────────────────────────────────────────────────
bookingRouter.post(
  "/:id/check-in",
  async (request, response, next) => {
    try {
      const booking = await prisma.booking.update({
        where: { id: String(request.params.id) },
        data: { status: "CHECKED_IN" },
      });
      response.json(booking);
    } catch (error) {
      next(error);
    }
  }
);
