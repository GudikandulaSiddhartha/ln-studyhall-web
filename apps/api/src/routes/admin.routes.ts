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
