import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.slice(7);
  const neonAuthUrl = process.env.NEON_AUTH_URL;

  if (!neonAuthUrl) {
    console.error("NEON_AUTH_URL not configured");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const response = await fetch(`${neonAuthUrl}/get-session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const data = await response.json();
    if (!data?.session?.userId) {
      return res.status(401).json({ error: "Invalid session" });
    }

    req.userId = data.session.userId;
    next();
  } catch (error) {
    console.error("Auth validation error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
}
