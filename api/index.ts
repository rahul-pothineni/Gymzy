import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { profileRouter } from "../server/src/routes/profile.js";
import { planRouter } from "../server/src/routes/plan.js";
import { trackerRouter } from "../server/src/routes/tracker.js";
import { requireAuth } from "../server/src/middleware/auth.js";

const app = express();
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

const generateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: "Too many plan generations. Try again later." } });

// Diagnostic endpoint — remove after debugging
app.get("/api/debug-env", async (_req, res) => {
  let dbStatus = "untested";
  try {
    const { prisma } = await import("../server/src/lib/Prisma.js");
    await prisma.$queryRawUnsafe("SELECT 1");
    dbStatus = "connected";
  } catch (e: any) {
    dbStatus = "FAILED: " + e.message;
  }
  res.json({
    DATABASE_URL: process.env.DATABASE_URL ? "SET (" + process.env.DATABASE_URL.substring(0, 20) + "...)" : "UNSET",
    REDIS_URL: process.env.REDIS_URL ? "SET" : "UNSET",
    FRONTEND_URL: process.env.FRONTEND_URL || "UNSET",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    dbStatus,
  });
});

// Mount routes at both /api/* and /* since Vercel may pass either path
app.use("/api/profile", requireAuth, profileRouter);
app.use("/api/plan/generate", requireAuth, generateLimiter);
app.use("/api/plan", requireAuth, planRouter);
app.use("/api/tracker", requireAuth, trackerRouter);

app.use("/profile", requireAuth, profileRouter);
app.use("/plan/generate", requireAuth, generateLimiter);
app.use("/plan", requireAuth, planRouter);
app.use("/tracker", requireAuth, trackerRouter);

export default app;
