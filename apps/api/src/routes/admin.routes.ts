import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/analytics", async (_request, response, next) => {
  try {
    const [users, bookings, branches, payments] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.branch.count(),
      prisma.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true }
      })
    ]);

    response.json({
      users,
      bookings,
      branches,
      revenue: payments._sum.amount ?? 0
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/activity", async (_request, response, next) => {
  try {
    const [bookings, notifications, chatLogs] = await Promise.all([
      prisma.booking.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
      prisma.notification.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
      prisma.chatLog.findMany({ take: 5, orderBy: { createdAt: "desc" } })
    ]);
    response.json({ bookings, notifications, chatLogs });
  } catch (error) {
    next(error);
  }
});
