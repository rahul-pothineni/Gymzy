import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/Prisma";
import { generateTrainingPlan } from "../lib/ai";

export const planRouter = Router();

planRouter.post("/generate", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const profile = await prisma.user_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      return res
        .status(400)
        .json({ error: "User profile not found. Complete onboarding first." });
    }

    // NEED THE PLAN TABLE
    const latestPlan = await prisma.model_training_plans.findFirst({
      where: { user_id: userId },
      orderBy: { createdAt: "desc" },
      select: { version: true },
    });

    const nextVersion = latestPlan ? latestPlan.version + 1 : 1;
    let planJson;

    try {
      planJson = await generateTrainingPlan(profile);
    } catch (error) {
      console.error("AI generation failed:", error);
      return res.status(500).json({
        error: "Failed to generate training plan. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    const planText = JSON.stringify(planJson, null, 2);

    const newPlan = await prisma.model_training_plans.create({
      data: {
        user_id: userId,
        plan_json: planJson as any,
        plan_text: planText,
        version: nextVersion,
      },
    });

    res.json({
      id: newPlan.id,
      version: newPlan.version,
      createdAt: newPlan.createdAt,
    });
  } catch (error) {
    console.error("Error generating plan:", error);
    res.status(500).json({ error: "Failed to generate plan" });
  }
});

planRouter.get("/all", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const plans = await prisma.model_training_plans.findMany({
      where: { user_id: userId },
      orderBy: { version: "desc" },
    });

    res.json(
      plans.map((plan) => {
        const planJson = plan.plan_json as any;
        return {
          id: plan.id,
          version: plan.version,
          createdAt: plan.createdAt,
          overview: planJson.overview,
          weeklySchedule: planJson.weeklySchedule,
        };
      })
    );
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

planRouter.put("/:planId", async (req: Request, res: Response) => {
  try {
    const planId = req.params.planId as string;
    const { userId, weeklySchedule } = req.body;

    if (!userId || !weeklySchedule) {
      return res.status(400).json({ error: "userId and weeklySchedule are required" });
    }

    const plan = await prisma.model_training_plans.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    if (plan.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const planJson = plan.plan_json as any;
    planJson.weeklySchedule = weeklySchedule;

    const updated = await prisma.model_training_plans.update({
      where: { id: planId },
      data: {
        plan_json: planJson,
        plan_text: JSON.stringify(planJson, null, 2),
      },
    });

    res.json({
      id: updated.id,
      userId: updated.user_id,
      planJson: updated.plan_json,
      version: updated.version,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ error: "Failed to update plan" });
  }
});

planRouter.get("/current", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const plan = await prisma.model_training_plans.findFirst({
      where: { user_id: userId },
      orderBy: { createdAt: "desc" },
    });

    if (!plan) {
      return res.status(404).json({ error: "No plan found" });
    }

    res.json({
      id: plan.id,
      userId: plan.user_id,
      planJson: plan.plan_json,
      planText: plan.plan_text,
      version: plan.version,
      createdAt: plan.createdAt,
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    res.status(500).json({ error: "Failed to fetch plan" });
  }
});