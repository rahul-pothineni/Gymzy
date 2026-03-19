import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/Prisma";
import { generateTrainingPlan } from "../lib/ai";

export const planRouter = Router();

planRouter.post("/generate", async (req: Request, res: Response) => {
    try{
        const{userId} = req.body;
        if(!userId){
            return res.status(400).json({ error: "User ID is required" });
        }

        const profile = await prisma.user_profiles.findUnique({
            where: { id: userId }
        });
        if(!profile){
            return res.status(400).json({ error: "Profile not found, please complete onboarding first." });
        }

        //need plan table in prisma schema
        const latestPlan = await prisma.model_training_plans.findFirst({
            where: { user_id: userId },
            orderBy: { createdAt: "desc" },
            select: {version: true}
        });
        const nextVersion = latestPlan ? latestPlan.version + 1 : 1;

        let planJson; //AI generated plan in JSON format
        try{
            planJson = await generateTrainingPlan(profile);

        }catch(error){
            console.error("Error generating plan from AI:", error);
            return res.status(500).json({ 
                error: "Failed to generate plan. Try Again",
                details: error instanceof Error ? error.message : "Unknown error"
            });

        }


        const planText = JSON.stringify(planJson, null, 2);

        const newPlan = await prisma.model_training_plans.create({
            data: {
                user_id: userId,
                plan_json: planJson as any,
                plan_text: planText,
                version: nextVersion
            }
        });
        //return the success case
        res.json({id: newPlan.id, version: newPlan.version, createdAt: newPlan.createdAt});
    }
    catch(error){
        console.error("Error generating plan:", error);
        res.status(500).json({ error: "Failed to generate plan" });
    }
});