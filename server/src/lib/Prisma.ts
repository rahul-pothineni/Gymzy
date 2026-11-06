import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[prisma] DATABASE_URL is not set!");
}

const pool = new pg.Pool({
  connectionString,
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("[prisma] Pool error:", err.message);
});

const adapter = new PrismaPg({ pool });
export const prisma = new PrismaClient({ adapter });
