import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

// ─── Analytics summary ────────────────────────────────────────────────────────
adminRouter.get("/analytics", async (_request, response, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalUsers,
      totalBookings,
      totalBranches,
      allTimeRevenue,
      monthlyRevenue,
      lastMonthRevenue,
      activeBookings,
      monthlySignups
    ] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.branch.count(),
      prisma.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { status: "PAID", createdAt: { gte: startOfMonth } },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { status: "PAID", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true }
      }),
      prisma.booking.count({
        where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } }
      })
    ]);

    const currentMonthRev = monthlyRevenue._sum.amount ?? 0;
    const lastMonthRev = lastMonthRevenue._sum.amount ?? 1;
    const revenueGrowth = Math.round(((currentMonthRev - lastMonthRev) / lastMonthRev) * 100);

    response.json({
      totalUsers,
      totalBookings,
      totalBranches,
      allTimeRevenue: allTimeRevenue._sum.amount ?? 0,
      monthlyRevenue: currentMonthRev,
      revenueGrowth,
      activeBookings,
      monthlySignups
    });
  } catch (error) {
    next(error);
  }
});

// ─── Monthly revenue chart (last 6 months) ───────────────────────────────────
adminRouter.get("/revenue/monthly", async (_request, response, next) => {
  try {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const data = await Promise.all(
      months.map(async (start) => {
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        const result = await prisma.payment.aggregate({
          where: { status: "PAID", createdAt: { gte: start, lte: end } },
          _sum: { amount: true }
        });
        const bookings = await prisma.booking.count({
          where: { createdAt: { gte: start, lte: end } }
        });
        return {
          month: start.toLocaleString("default", { month: "short" }),
          revenue: result._sum.amount ?? 0,
          bookings
        };
      })
    );

    response.json(data);
  } catch (error) {
    next(error);
  }
});

// ─── Users list with booking info ─────────────────────────────────────────────
adminRouter.get("/users", async (request, response, next) => {
  try {
    const page = Number(request.query.page ?? 1);
    const limit = Number(request.query.limit ?? 20);
    const skip = (page - 1) * limit;
    const search = String(request.query.search ?? "");

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } }
          ]
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          bookings: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { startAt: true, endAt: true, status: true, createdAt: true }
          },
          _count: { select: { bookings: true } }
        }
      }),
      prisma.user.count({ where })
    ]);

    response.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        joinedAt: u.createdAt,
        totalBookings: u._count.bookings,
        lastBooking: u.bookings[0] ?? null
      })),
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
});

// ─── All bookings with user info ──────────────────────────────────────────────
adminRouter.get("/bookings", async (request, response, next) => {
  try {
    const page = Number(request.query.page ?? 1);
    const limit = Number(request.query.limit ?? 20);
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          seat: { select: { label: true } },
          branch: { select: { name: true } }
        }
      }),
      prisma.booking.count()
    ]);

    response.json({ bookings, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

// ─── Activity feed ────────────────────────────────────────────────────────────
adminRouter.get("/activity", async (_request, response, next) => {
  try {
    const [bookings, notifications, chatLogs] = await Promise.all([
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } }, seat: { select: { label: true } } }
      }),
      prisma.notification.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
      prisma.chatLog.findMany({ take: 5, orderBy: { createdAt: "desc" } })
    ]);
    response.json({ bookings, notifications, chatLogs });
  } catch (error) {
    next(error);
  }
});

// ─── Seat management ──────────────────────────────────────────────────────────

// Get all seats across all branches
adminRouter.get("/seats", async (_request, response, next) => {
  try {
    const seats = await prisma.seat.findMany({
      orderBy: [{ branchId: "asc" }, { label: "asc" }],
      include: {
        branch: { select: { name: true } },
        bookings: {
          where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, phone: true } } }
        }
      }
    });

    // Sort numerically by label
    const sorted = seats.sort((a, b) => Number(a.label) - Number(b.label));

    response.json(sorted.map((s) => ({
      id: s.id,
      label: s.label,
      status: s.status,
      branchId: s.branchId,
      branchName: s.branch.name,
      activeBooking: s.bookings[0] ?? null
    })));
  } catch (error) {
    next(error);
  }
});

// Release a seat (BLOCKED/MAINTENANCE → AVAILABLE)
adminRouter.patch("/seats/:id/release", async (request, response, next) => {
  try {
    const seat = await prisma.seat.update({
      where: { id: request.params.id },
      data: { status: "AVAILABLE" }
    });
    response.json({ message: `Seat ${seat.label} released`, seat });
  } catch (error) {
    next(error);
  }
});

// Block a seat (AVAILABLE → BLOCKED)
adminRouter.patch("/seats/:id/block", async (request, response, next) => {
  try {
    const seat = await prisma.seat.update({
      where: { id: request.params.id },
      data: { status: "BLOCKED" }
    });
    response.json({ message: `Seat ${seat.label} blocked`, seat });
  } catch (error) {
    next(error);
  }
});

// Set seat to maintenance
adminRouter.patch("/seats/:id/maintenance", async (request, response, next) => {
  try {
    const seat = await prisma.seat.update({
      where: { id: request.params.id },
      data: { status: "MAINTENANCE" }
    });
    response.json({ message: `Seat ${seat.label} set to maintenance`, seat });
  } catch (error) {
    next(error);
  }
});

// ─── Booking management ───────────────────────────────────────────────────────

// Cancel a booking (admin force cancel)
adminRouter.patch("/bookings/:id/cancel", async (request, response, next) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: request.params.id },
      data: { status: "CANCELLED" },
      include: {
        user: { select: { name: true } },
        seat: { select: { label: true } }
      }
    });
    response.json({ message: `Booking for ${booking.user.name} (Seat ${booking.seat.label}) cancelled`, booking });
  } catch (error) {
    next(error);
  }
});

// Confirm a pending booking
adminRouter.patch("/bookings/:id/confirm", async (request, response, next) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: request.params.id },
      data: { status: "CONFIRMED" },
      include: {
        user: { select: { name: true } },
        seat: { select: { label: true } }
      }
    });
    response.json({ message: `Booking confirmed for ${booking.user.name}`, booking });
  } catch (error) {
    next(error);
  }
});

// ─── Seat management ──────────────────────────────────────────────────────────

// Get all seats with status grouped by branch
adminRouter.get("/seats", async (_request, response, next) => {
  try {
    const seats = await prisma.seat.findMany({
      orderBy: [{ branchId: "asc" }, { label: "asc" }],
      include: {
        branch: { select: { name: true } },
        bookings: {
          where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
          take: 1,
          select: {
            status: true,
            startAt: true,
            endAt: true,
            user: { select: { name: true, phone: true } }
          }
        }
      }
    });

    const sorted = seats.sort((a, b) => Number(a.label) - Number(b.label));
    response.json(sorted);
  } catch (error) {
    next(error);
  }
});

// Release a seat (set to AVAILABLE)
adminRouter.patch("/seats/:id/release", async (request, response, next) => {
  try {
    const seat = await prisma.seat.update({
      where: { id: String(request.params.id) },
      data: { status: "AVAILABLE" }
    });
    response.json({ message: "Seat released", seat });
  } catch (error) {
    next(error);
  }
});

// Block a seat (set to BLOCKED)
adminRouter.patch("/seats/:id/block", async (request, response, next) => {
  try {
    // Cancel any active bookings on this seat
    await prisma.booking.updateMany({
      where: {
        seatId: String(request.params.id),
        status: { in: ["PENDING", "CONFIRMED"] }
      },
      data: { status: "CANCELLED" }
    });

    const seat = await prisma.seat.update({
      where: { id: String(request.params.id) },
      data: { status: "BLOCKED" }
    });
    response.json({ message: "Seat blocked", seat });
  } catch (error) {
    next(error);
  }
});

// Cancel a specific booking
adminRouter.patch("/bookings/:id/cancel", async (request, response, next) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: String(request.params.id) },
      data: { status: "CANCELLED" }
    });
    response.json({ message: "Booking cancelled", booking });
  } catch (error) {
    next(error);
  }
});

// Confirm a pending booking
adminRouter.patch("/bookings/:id/confirm", async (request, response, next) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: String(request.params.id) },
      data: { status: "CONFIRMED" }
    });
    response.json({ message: "Booking confirmed", booking });
  } catch (error) {
    next(error);
  }
});
