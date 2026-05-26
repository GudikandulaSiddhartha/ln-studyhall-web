import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const membershipRouter = Router();

membershipRouter.get("/", async (_request, response, next) => {
  try {
    response.json(await prisma.membership.findMany({ where: { isActive: true }, orderBy: { price: "asc" } }));
  } catch (error) {
    next(error);
  }
});

membershipRouter.post("/:id/subscribe", requireAuth, async (request, response, next) => {
  try {
    const membership = await prisma.membership.findUniqueOrThrow({ where: { id: String(request.params.id) } });
    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setDate(startsAt.getDate() + membership.durationDays);

    const subscription = await prisma.userMembership.create({
      data: {
        userId: request.user!.sub,
        membershipId: membership.id,
        startsAt,
        endsAt
      }
    });

    response.status(201).json(subscription);
  } catch (error) {
    next(error);
  }
});
