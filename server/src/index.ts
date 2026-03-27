import 'dotenv/config';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { profileRouter } from "./routes/profile";
import { planRouter } from "./routes/plan";
import { trackerRouter } from "./routes/tracker";
import { requireAuth } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

//API routes
app.use("/api/profile", requireAuth, profileRouter);
app.use("/api/plan", requireAuth, planRouter);
app.use("/api/tracker", requireAuth, trackerRouter);



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});