import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/Prisma";
export const profileRouter = Router();

profileRouter.get("/", async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;

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
        const {userId, ...profileData} = req.body

        if(!userId){
            return res.status(400).json({ error: "User ID is required" });
        }

        const{
            goal,
            experience,
            daysPerWeek,
            minutesPerDay,
            split
        } = profileData;
        if(!goal || !experience || !daysPerWeek || !minutesPerDay || !split){
            return res.status(400).json({ error: "All fields are required" });
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