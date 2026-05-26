import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const branchRouter = Router();

const branchSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    address: z.string().min(5),
    landmark: z.string().optional(),
    phone: z.string().min(8),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    openHours: z.string().default("6 AM to 11 PM"),
    facilities: z.array(z.string()).default([])
  })
});

branchRouter.get("/", async (_request, response, next) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        seats: true,
        photos: true
      },
      orderBy: { createdAt: "desc" }
    });
    response.json(branches);
  } catch (error) {
    next(error);
  }
});

branchRouter.post("/", requireAuth, requireAdmin, validate(branchSchema), async (_request, response, next) => {
  try {
    const branch = await prisma.branch.create({ data: response.locals.validated.body });
    response.status(201).json(branch);
  } catch (error) {
    next(error);
  }
});
