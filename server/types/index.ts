export interface UserProfile{
    userId: string;
    goal: string;
    experience: string;
    daysPerWeek: number;
    minutesPerDay: number;
    split: string;
}

export interface TrainingPlan{
    id: string;
    userId: string;
    overview: PlanOverview;
    weeklySchedule: DaySchedule[];
    progression: string;
    version: number;
    createdAt: string;
}

export interface PlanOverview{
    goal: string;
    frequency: string;
    split: string;
    notes: number;
}

export interface DaySchedule{
    day: string;
    focus: string;
    exercises: Exercise[];
}

export interface Exercise{
    name: string;
    sets: number;
    reps: string;
    rest: string;
    rpe: number;
    notes?: string;
    alternatives?: string[];
}