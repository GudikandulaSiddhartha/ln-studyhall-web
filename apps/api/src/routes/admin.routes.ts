import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { adminLimiter } from "../middleware/security.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin, adminLimiter);

// ─── Analytics ────────────────────────────────────────────────────────────────
adminRouter.get("/analytics", async (_req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const SEAT_PRICE = 1500; // ₹ per confirmed booking

    const [totalUsers, totalBookings, totalBranches,
      allTimeConfirmed, monthlyConfirmed, lastMonthConfirmed,
      activeBookings, monthlySignups] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.branch.count(),
      // Revenue = confirmed bookings × seat price (no Payment table dependency)
      prisma.booking.count({ where: { status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED"] } } }),
      prisma.booking.count({ where: { status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED"] }, createdAt: { gte: startOfMonth } } }),
      prisma.booking.count({ where: { status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED"] }, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.booking.count({ where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } })
    ]);

    const cur = monthlyConfirmed * SEAT_PRICE;
    const last = (lastMonthConfirmed || 1) * SEAT_PRICE;

    res.json({
      totalUsers, totalBookings, totalBranches,
      allTimeRevenue: allTimeConfirmed * SEAT_PRICE,
      monthlyRevenue: cur,
      revenueGrowth: Math.round(((cur - last) / last) * 100),
      activeBookings, monthlySignups
    });
  } catch (e) { next(e); }
});

// ─── Monthly revenue chart ─────────────────────────────────────────────────────
adminRouter.get("/revenue/monthly", async (_req, res, next) => {
  try {
    const SEAT_PRICE = 1500;
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const data = await Promise.all(months.map(async (start) => {
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const [confirmed, bookings] = await Promise.all([
        prisma.booking.count({ where: { status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED"] }, createdAt: { gte: start, lte: end } } }),
        prisma.booking.count({ where: { createdAt: { gte: start, lte: end } } })
      ]);
      return {
        month: start.toLocaleString("default", { month: "short" }),
        revenue: confirmed * SEAT_PRICE,
        bookings
      };
    }));
    res.json(data);
  } catch (e) { next(e); }
});

// ─── Users list ────────────────────────────────────────────────────────────────
adminRouter.get("/users", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const search = String(req.query.search ?? "");
    const skip = (page - 1) * limit;
    const where = search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit, orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, phone: true, role: true, createdAt: true,
          bookings: { orderBy: { createdAt: "desc" }, take: 1, select: { startAt: true, endAt: true, status: true, createdAt: true } },
          _count: { select: { bookings: true } }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users: users.map((u) => ({
        id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
        joinedAt: u.createdAt, totalBookings: u._count.bookings, lastBooking: u.bookings[0] ?? null
      })),
      total, page, pages: Math.ceil(total / limit)
    });
  } catch (e) { next(e); }
});

// ─── All bookings ──────────────────────────────────────────────────────────────
adminRouter.get("/bookings", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        skip, take: limit, orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          seat: { select: { label: true } },
          branch: { select: { name: true } }
        }
      }),
      prisma.booking.count()
    ]);
    res.json({ bookings, total, page, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

// ─── Branches list ─────────────────────────────────────────────────────────────
adminRouter.get("/branches", async (_req, res, next) => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { seats: true, bookings: true } } }
    });
    res.json(branches);
  } catch (e) { next(e); }
});

// ─── Seats — all branches with live booking info ───────────────────────────────
adminRouter.get("/seats", async (req, res, next) => {
  try {
    const branchId = req.query.branchId ? String(req.query.branchId) : undefined;

    const seats = await prisma.seat.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: [{ branchId: "asc" }, { label: "asc" }],
      include: {
        branch: { select: { id: true, name: true } },
        bookings: {
          where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            user: { select: { id: true, name: true, phone: true, email: true } }
          }
        }
      }
    });

    // Sort numerically
    const sorted = seats.sort((a, b) => Number(a.label) - Number(b.label));

    res.json(sorted.map((s) => ({
      id: s.id,
      label: s.label,
      seatNumber: Number(s.label),
      status: s.status,
      branchId: s.branchId,
      branchName: s.branch.name,
      activeBooking: s.bookings[0] ? {
        userId: s.bookings[0].user.id,
        userName: s.bookings[0].user.name,
        userPhone: s.bookings[0].user.phone,
        userEmail: s.bookings[0].user.email,
        status: s.bookings[0].status,
        startAt: s.bookings[0].startAt,
        endAt: s.bookings[0].endAt,
        bookingId: s.bookings[0].id
      } : null
    })));
  } catch (e) { next(e); }
});

// ─── Release seat ──────────────────────────────────────────────────────────────
adminRouter.patch("/seats/:id/release", async (req, res, next) => {
  try {
    const seat = await prisma.seat.update({
      where: { id: String(req.params.id) },
      data: { status: "AVAILABLE" }
    });
    res.json({ message: "Seat released successfully", seat });
  } catch (e) { next(e); }
});

// ─── Block seat ────────────────────────────────────────────────────────────────
adminRouter.patch("/seats/:id/block", async (req, res, next) => {
  try {
    await prisma.booking.updateMany({
      where: { seatId: String(req.params.id), status: { in: ["PENDING", "CONFIRMED"] } },
      data: { status: "CANCELLED" }
    });
    const seat = await prisma.seat.update({
      where: { id: String(req.params.id) },
      data: { status: "BLOCKED" }
    });
    res.json({ message: "Seat blocked and active bookings cancelled", seat });
  } catch (e) { next(e); }
});

// ─── Cancel booking ────────────────────────────────────────────────────────────
adminRouter.patch("/bookings/:id/cancel", async (req, res, next) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: String(req.params.id) },
      data: { status: "CANCELLED" }
    });
    res.json({ message: "Booking cancelled", booking });
  } catch (e) { next(e); }
});

// ─── Confirm booking ────────────────────────────────────────────────────────────
adminRouter.patch("/bookings/:id/confirm", async (req, res, next) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: String(req.params.id) },
      data: { status: "CONFIRMED" }
    });
    res.json({ message: "Booking confirmed", booking });
  } catch (e) { next(e); }
});

// ─── Activity feed ─────────────────────────────────────────────────────────────
adminRouter.get("/activity", async (_req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      take: 10, orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        seat: { select: { label: true } },
        branch: { select: { name: true } }
      }
    });
    res.json({ bookings });
  } catch (e) { next(e); }
});
