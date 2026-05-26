import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";

export const chatRouter = Router();

const chatSchema = z.object({
  body: z.object({
    userId: z.string().optional(),
    locale: z.string().default("en-IN"),
    prompt: z.string().min(1).max(1000)
  })
});

chatRouter.post("/", validate(chatSchema), async (_request, response, next) => {
  try {
    const { prompt, locale, userId } = response.locals.validated.body;
    const normalized = prompt.toLowerCase();
    const answer = normalized.includes("premium")
      ? "Premium Cabin Plan includes private cabin access, 24/7 entry, power backup, and priority support."
      : normalized.includes("timing")
        ? "Most students prefer 6 AM to 10 AM for revision and 7 PM to 11 PM for deep practice."
        : "LN StudyHall offers daily, weekly, monthly, and premium cabin plans with seat booking and QR verification.";

    const log = await prisma.chatLog.create({
      data: {
        userId,
        locale,
        prompt,
        response: answer
      }
    });

    response.json({ answer, logId: log.id });
  } catch (error) {
    next(error);
  }
});
