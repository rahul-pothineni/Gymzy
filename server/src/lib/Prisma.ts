import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

console.log("[prisma] DATABASE_URL is", connectionString ? "SET" : "UNSET");
console.log("[prisma] env keys:", Object.keys(process.env).filter(k => k.includes("DATABASE") || k.includes("POSTGRES")).join(", ") || "(none)");

const pool = new pg.Pool({
  connectionString,
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("[prisma] Pool error:", err.message);
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
