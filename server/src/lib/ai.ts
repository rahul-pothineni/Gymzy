import OpenAI from "openai";
import dotenv from "dotenv";
import type { UserProfile, TrainingPlan } from "../../types";


dotenv.config();

export async function generateTrainingPlan(profile: UserProfile | Record<string, any>): Promise<Omit<TrainingPlan, "id" | "userId" | "version" | "createdAt">>{
    //normalize profile data
    const row = profile as UserProfile & { user_id?: string };
    const normalizedProfile: UserProfile = {
        userId: row.user_id ?? row.userId ?? "",
        goal: profile.goal || "bulk",
        experience: profile.experience || "intermediate",
        daysPerWeek: profile.daysPerWeek || 4,
        minutesPerDay: profile.minutesPerDay || 60,
        split: profile.split || "full_body"
    };

    const apiKey = process.env.OPEN_ROUTER_KEY;
    if(!apiKey){
        throw new Error("OPEN_ROUTER_KEY is not set");
    }

    const openai = new OpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
            "HTTP-Referer": process.env.BASE_URL || "http://localhost:3001",
            "X-Title": "Gymzy Workout Planner"
        }
    });

    //build prompt for AI
    const prompt = buildPrompt(normalizedProfile);
    try {
        const completion = await openai.chat.completions.create({
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
            {
                role: "system",
                content:
                "You are an expert fitness trainer and program designer. You must respond with valid JSON only. Do not include any markdown, reasoning, or additional text.",
            },
            {
                role: "user",
                content: prompt,
            },
            ],
            temperature: 0.6,
            response_format: { type: "json_object" },
        });
    
        const content = completion.choices[0].message.content;
    
        if (!content) {
            console.error(
            "No content in response from AI:",
            JSON.stringify(completion, null, 2),
            );
            throw new Error("No content in AI response");
        }
    
        const planData = JSON.parse(content);
    
        return formatPlanResponse(planData, normalizedProfile);       
    } catch (error) {
        console.error("Error generating training plan:", error);
        throw error;
    }
}

function formatPlanResponse(aiResponse: any, profile: UserProfile,): Omit<TrainingPlan, "id" | "userId" | "version" | "createdAt"> {
    const plan: Omit<TrainingPlan, "id" | "userId" | "version" | "createdAt"> = {
      overview: {
        goal: aiResponse.overview?.goal || `Customized ${profile.goal} program`,
        frequency:
          aiResponse.overview?.frequency ||
          `${profile.daysPerWeek} days per week`,
        split: aiResponse.overview?.split || profile.split,
        notes:
          aiResponse.overview?.notes ||
          "Follow the program consistently for best results.",
      },
      weeklySchedule: (aiResponse.weeklySchedule || []).map((day: any) => ({
        day: day.day || "Day",
        focus: day.focus || "Full Body",
        exercises: (day.exercises || []).map((ex: any) => ({
          name: ex.name || "Exercise",
          sets: ex.sets || 3,
          reps: ex.reps || "8-12",
          rest: ex.rest || "60-90 sec",
          rpe: ex.rpe || 7,
          notes: ex.notes,
          alternatives: ex.alternatives,
        })),
      })),
      progression:
        aiResponse.progression ||
        "Increase weight by 2.5-5lbs when you can complete all sets with good form. Track your progress weekly.",
    };
    return plan;
}

function buildPrompt(profile: UserProfile): string{
    const goalMap: Record<string, string> = {
        bulk: "Build muscle and strength, prioritizing gaining muscle mass and strength",
        cut: "Lose body fat and improve definition",
        maintain: "Stay in shape and prevent regressions",
        strength: "Improve strength and power",
        endurance: "Improve cardiovascular health and endurance",
    };
    const experienceMap: Record<string, string> = {
        beginner: "Beginner level fitness experience, starting from scratch",
        intermediate: "Intermediate level fitness experience, with some training history",
        advanced: "Advanced level fitness experience, with a lot of training history",
    };
    const splitMap: Record<string, string> = {
        full_body: "Train all major muscle groups in each workout",
        upper_lower: "Train upper and lower body according to the upper/lower split principles",
        push_pull: "Train push and pull and legs muscle groups according to the push/pull/legs split principles",
        custom: "Custom split based on user's preferences",
    };
    const daysPerWeekMap: Record<number, string> = {
        3: "3 days per week",
        4: "4 days per week",
        5: "5 days per week",
        6: "6 days per week",
        7: "7 days per week",
    };
    const minutesPerDayMap: Record<number, string> = {
        15: "15 minutes per day",
        30: "30 minutes per day",
        45: "45 minutes per day",
        60: "60 minutes per day",
    };

    return `You are a fitness expert and personal trainer like Jeff Nippard. 
    Create a personilzed plan where the user is able to workout ${daysPerWeekMap[profile.daysPerWeek]} per week, 
    focusing on ${goalMap[profile.goal]} with ${experienceMap[profile.experience]} experience.
    The user's split is ${splitMap[profile.split]} and they prefer to workout ${minutesPerDayMap[profile.minutesPerDay]} per day.
    
    The user's profile is as follows:
    ${JSON.stringify(profile, null, 2)}

    Create a detailed and personalized workout plan for the user.
    The plan should be in JSON format in the exact format as shown below:
{
    "overview": {
        "goal": "brief description of the training goal",
        "frequency": "X days per week",
        "split": "training split name",
        "notes": "important notes about the program (2-3 sentences)"
    },
    "weeklySchedule": [
        {
        "day": "Monday",
        "focus": "muscle group or focus area",
        "exercises": [
            {
            "name": "Exercise Name",
            "sets": 4,
            "reps": "6-8",
            "rest": "2-3 min",
            "rpe": 8,
            "notes": "form cues or tips (optional)",
            "alternatives": ["Alternative 1", "Alternative 2"]
            }
        ]
        }
    ],
    "progression": "detailed progression strategy (2-3 sentences explaining how to progress)"
}
  Requirements:
  - Create exactly ${profile.daysPerWeek} workout days
  - Each workout should fit within ${profile.minutesPerDay} minutes
  - Include 4-6 exercises per workout
  - RPE (Rate of Perceived Exertion) should be 6-9
  - Include compound movements for beginners/intermediate, advanced can have more isolation
  - Match the preferred split type: ${profile.split}
  - Provide exercise alternatives where appropriate
  - Make it progressive and suitable for ${experienceMap[profile.experience]} level
  Return ONLY the JSON object please. 
    `;
}
