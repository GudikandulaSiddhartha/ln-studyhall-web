import express from "express";
import morgan from "morgan";
import { applySecurity } from "./middleware/security.js";
import { authRouter } from "./routes/auth.routes.js";
import { branchRouter } from "./routes/branch.routes.js";
import { bookingRouter } from "./routes/booking.routes.js";
import { membershipRouter } from "./routes/membership.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { chatRouter } from "./routes/chat.routes.js";

export function createApp() {
  const app = express();

  applySecurity(app);
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("tiny"));

  app.get("/health", (_request, response) => response.json({ ok: true, service: "ln-studyhall-api" }));
  app.use("/api/auth", authRouter);
  app.use("/api/branches", branchRouter);
  app.use("/api/bookings", bookingRouter);
  app.use("/api/memberships", membershipRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/chat", chatRouter);

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Invalid credentials" ? 401 : 500;
    response.status(status).json({ message });
  });

  return app;
}
