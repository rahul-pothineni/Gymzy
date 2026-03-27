import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/Prisma";
import { validate, profileSchema } from "../lib/validation";
export const profileRouter = Router();

profileRouter.get("/", async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const profile = await prisma.user_profiles.findUnique({
            where: { user_id: userId },
        });

        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        res.json(profile);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

profileRouter.post("/", async (req: Request, res: Response) => {
    try{
        const userId = req.userId;
        const { goal, experience, daysPerWeek, minutesPerDay, split } = req.body;

        if(!userId){
            return res.status(400).json({ error: "User ID is required" });
        }

        const validation = validate(profileSchema, { goal, experience, daysPerWeek: parseInt(daysPerWeek), minutesPerDay: parseInt(minutesPerDay), split });
        if (!validation.success) {
            return res.status(400).json({ error: (validation as { success: false; error: string }).error });
        }

        await prisma.user_profiles.upsert({
            where: { user_id: userId },
            update: {
                goal,
                experience,
                daysPerWeek: parseInt(daysPerWeek),
                minutesPerDay: parseInt(minutesPerDay),
                split
            },
            create: {
                user_id: userId,
                goal,
                experience,
                daysPerWeek: parseInt(daysPerWeek),
                minutesPerDay: parseInt(minutesPerDay),
                split
            }
        });

        res.json({success: true});

    } catch (error) {
        console.error("Error creating profile:", error);
        res.status(500).json({ error: "Failed to save profile" });
    }
});
