import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/Prisma";
import { validate, createSessionSchema, updateSessionSchema } from "../lib/validation";

export const trackerRouter = Router();

// POST /sessions — Create a new workout session
trackerRouter.post("/sessions", async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { planId, dayLabel, focus, sessionDate, exercises } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const validation = validate(createSessionSchema, { planId, dayLabel, focus, sessionDate, exercises });
    if (!validation.success) {
      return res.status(400).json({ error: (validation as { success: false; error: string }).error });
    }

    // Validate that sessionDate is a real date
    if (isNaN(new Date(sessionDate).getTime())) {
      return res.status(400).json({ error: "Invalid session date" });
    }

    // Check for existing session on this date + day
    const existing = await prisma.workout_sessions.findFirst({
      where: {
        user_id: userId,
        session_date: new Date(sessionDate),
        day_label: dayLabel,
      },
      include: { exercises: { orderBy: { exercise_order: "asc" } } },
    });

    if (existing) {
      return res.json(formatSession(existing));
    }

    const session = await prisma.workout_sessions.create({
      data: {
        user_id: userId,
        plan_id: planId,
        day_label: dayLabel,
        focus: focus || "",
        session_date: new Date(sessionDate),
        exercises: {
          create: (exercises || []).map(
            (ex: { exerciseName: string; order: number; setsCount: number }) => ({
              exercise_name: ex.exerciseName,
              exercise_order: ex.order,
              sets_data: Array.from({ length: ex.setsCount }, (_, i) => ({
                setNumber: i + 1,
                weight: null,
                repsCompleted: null,
                notes: "",
              })),
            })
          ),
        },
      },
      include: { exercises: { orderBy: { exercise_order: "asc" } } },
    });

    res.json(formatSession(session));
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// GET /sessions/today — Get session for a specific date
trackerRouter.get("/sessions/today", async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const date = req.query.date as string;

    if (!userId || !date) {
      return res.status(400).json({ error: "date query parameter is required" });
    }

    const session = await prisma.workout_sessions.findFirst({
      where: {
        user_id: userId,
        session_date: new Date(date),
      },
      include: { exercises: { orderBy: { exercise_order: "asc" } } },
    });

    if (!session) {
      return res.json(null);
    }

    res.json(formatSession(session));
  } catch (error) {
    console.error("Error fetching today's session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// PUT /sessions/:sessionId — Update session (save progress / mark complete)
trackerRouter.put("/sessions/:sessionId", async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const userId = req.userId;
    const { completed, notes, exercises } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const validation = validate(updateSessionSchema, { completed, notes, exercises });
    if (!validation.success) {
      return res.status(400).json({ error: (validation as { success: false; error: string }).error });
    }

    // Verify ownership
    const session = await prisma.workout_sessions.findFirst({
      where: { id: sessionId, user_id: userId },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.workout_sessions.update({
        where: { id: sessionId },
        data: {
          ...(completed !== undefined && { completed }),
          ...(notes !== undefined && { notes }),
        },
      });

      if (exercises && Array.isArray(exercises)) {
        for (const ex of exercises) {
          await tx.session_exercises.update({
            where: { id: ex.id },
            data: {
              sets_data: ex.setsData,
              ...(ex.skipped !== undefined && { skipped: ex.skipped }),
            },
          });
        }
      }
    });

    const updated = await prisma.workout_sessions.findUnique({
      where: { id: sessionId },
      include: { exercises: { orderBy: { exercise_order: "asc" } } },
    });

    res.json(formatSession(updated!));
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ error: "Failed to update session" });
  }
});

// GET /sessions — List previous sessions (paginated)
trackerRouter.get("/sessions", async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const [sessions, total] = await Promise.all([
      prisma.workout_sessions.findMany({
        where: { user_id: userId },
        orderBy: { session_date: "desc" },
        skip: offset,
        take: limit,
        include: { exercises: { orderBy: { exercise_order: "asc" } } },
      }),
      prisma.workout_sessions.count({ where: { user_id: userId } }),
    ]);

    res.json({
      sessions: sessions.map(formatSession),
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// DELETE /sessions/:sessionId — Delete a session
trackerRouter.delete("/sessions/:sessionId", async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const session = await prisma.workout_sessions.findFirst({
      where: { id: sessionId, user_id: userId },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    await prisma.workout_sessions.delete({ where: { id: sessionId } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

// Helper to format a session for the API response
function formatSession(session: any) {
  return {
    id: session.id,
    userId: session.user_id,
    planId: session.plan_id,
    dayLabel: session.day_label,
    focus: session.focus,
    completed: session.completed,
    notes: session.notes,
    sessionDate: session.session_date.toISOString().split("T")[0],
    createdAt: session.created_at.toISOString(),
    exercises: (session.exercises || []).map((ex: any) => ({
      id: ex.id,
      sessionId: ex.session_id,
      exerciseName: ex.exercise_name,
      exerciseOrder: ex.exercise_order,
      setsData: ex.sets_data,
      skipped: ex.skipped,
    })),
  };
}
