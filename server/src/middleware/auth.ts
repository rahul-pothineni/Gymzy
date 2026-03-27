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

  try {
    // Decode JWT payload (NeonAuth issues standard JWTs)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );

    if (!payload.sub) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return res.status(401).json({ error: "Token expired" });
    }

    req.userId = payload.sub;
    next();
  } catch (error) {
    console.error("Auth validation error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
}
