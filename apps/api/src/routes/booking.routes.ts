import crypto from "node:crypto";
import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

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

const createBookingSchema = z.object({
  body: z.object({
    branchId: z.string(),
    seatId: z.string(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime()
  })
});

bookingRouter.get("/availability", validate(availabilitySchema), async (_request, response, next) => {
  try {
    const { branchId, startAt, endAt } = response.locals.validated.query;
    const seats = await prisma.seat.findMany({
      where: { branchId },
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

    response.json(
      (seats as AvailabilitySeat[]).map((seat) => ({
        id: seat.id,
        label: seat.label,
        status: seat.status !== "AVAILABLE" || seat.bookings.length ? "BOOKED" : "AVAILABLE"
      }))
    );
  } catch (error) {
    next(error);
  }
});

bookingRouter.post("/", requireAuth, validate(createBookingSchema), async (request, response, next) => {
  try {
    const input = response.locals.validated.body;
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);

    if (startAt >= endAt) return response.status(400).json({ message: "End time must be after start time" });

    const booking = await prisma.$transaction(
      async (transaction: Prisma.TransactionClient) => {
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.seatId}))`;

        const seat = await transaction.seat.findFirst({
          where: {
            id: input.seatId,
            branchId: input.branchId
          },
          select: {
            id: true,
            status: true
          }
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

        if (conflict) {
          throw new Error("Seat is no longer available");
        }

        return transaction.booking.create({
          data: {
            userId: request.user!.sub,
            branchId: input.branchId,
            seatId: input.seatId,
            startAt,
            endAt,
            qrToken: crypto.randomBytes(24).toString("hex"),
            status: "CONFIRMED"
          }
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 7000
      }
    );

    response.status(201).json(booking);
  } catch (error) {
    if (error instanceof Error && ["Seat is no longer available", "Seat is not available for booking"].includes(error.message)) {
      return response.status(409).json({ message: error.message });
    }
    next(error);
  }
});

bookingRouter.post("/:id/check-in", requireAuth, async (request, response, next) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: String(request.params.id) },
      data: {
        status: "CHECKED_IN",
        attendances: {
          create: {
            userId: request.user!.sub
          }
        }
      },
      include: { attendances: true }
    });
    response.json(booking);
  } catch (error) {
    next(error);
  }
});
