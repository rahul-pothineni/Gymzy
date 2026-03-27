import { z } from "zod";

// ── Profile ──────────────────────────────────────────────
export const profileSchema = z.object({
  goal: z.enum(["cut", "bulk", "strength", "endurance", "recomp"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  daysPerWeek: z.number().int().min(2).max(7),
  minutesPerDay: z.number().int().min(15).max(180),
  split: z.enum(["full_body", "upper_lower", "push_pull", "custom"]),
});

// ── Plan ─────────────────────────────────────────────────
const exerciseSchema = z.object({
  name: z.string().min(1).max(200),
  sets: z.number().int().min(1).max(20),
  reps: z.string().min(1).max(50),
  rest: z.string().min(1).max(50),
  rpe: z.number().min(1).max(10),
  notes: z.string().max(500).optional(),
  alternatives: z.array(z.string().max(200)).optional(),
});

const dayScheduleSchema = z.object({
  day: z.string().min(1).max(50),
  focus: z.string().min(1).max(100),
  exercises: z.array(exerciseSchema).min(1).max(30),
});

export const weeklyScheduleSchema = z.array(dayScheduleSchema).min(1).max(7);

export const updatePlanSchema = z.object({
  weeklySchedule: weeklyScheduleSchema,
});

// ── Tracker ──────────────────────────────────────────────
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createSessionSchema = z.object({
  planId: z.string().uuid(),
  dayLabel: z.string().min(1).max(50),
  focus: z.string().min(1).max(100),
  sessionDate: z.string().regex(dateRegex, "Date must be YYYY-MM-DD"),
  exercises: z
    .array(
      z.object({
        exerciseName: z.string().min(1).max(200),
        order: z.number().int().min(0).max(50),
        setsCount: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
});

const setDataSchema = z.object({
  setNumber: z.number().int().min(1).max(20),
  weight: z.number().min(0).max(9999).nullable(),
  repsCompleted: z.number().int().min(0).max(999).nullable(),
  notes: z.string().max(500),
});

export const updateSessionSchema = z.object({
  completed: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
  exercises: z.array(
    z.object({
      id: z.string().uuid(),
      setsData: z.array(setDataSchema),
      skipped: z.boolean().optional(),
    }),
  ),
});

// ── Helper ───────────────────────────────────────────────
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  return { success: false, error: messages.join("; ") };
}
