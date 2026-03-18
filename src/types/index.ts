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