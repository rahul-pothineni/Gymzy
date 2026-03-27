export interface User{
    id: string;
    email: string;
    createdAt: string;
}

export interface UserProfile{
    userId: string;
    goal: "cut" | "bulk" | "maintain";
    experience: "beginner" | "intermediate" | "advanced";
    daysPerWeek: 3 | 4 | 5 | 6 | 7;
    minutesPerDay: 15 | 30 | 45 | 60;
    split: "full_body" | "upper_lower" | "push_pull" | "custom";
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

export interface PlanSummary {
    id: string;
    version: number;
    createdAt: string;
    overview: PlanOverview;
    weeklySchedule: DaySchedule[];
}

export interface SetData {
    setNumber: number;
    weight: number | null;
    repsCompleted: number | null;
    notes: string;
}

export interface SessionExercise {
    id: string;
    sessionId: string;
    exerciseName: string;
    exerciseOrder: number;
    setsData: SetData[];
    skipped: boolean;
}

export interface WorkoutSession {
    id: string;
    userId: string;
    planId: string;
    dayLabel: string;
    focus: string;
    completed: boolean;
    notes?: string;
    sessionDate: string;
    createdAt: string;
    exercises: SessionExercise[];
}