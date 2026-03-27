
import type { UserProfile } from "../types";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function post(path: string, body: object) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({}))).error || "Request failed",
    );

  return res.json();
}

async function get(path: string) {
  const res = await fetch(`${BASE_URL}/api${path}`);
  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({}))).error || "Request failed",
    );
  return res.json();
}

async function put(path: string, body: object) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({}))).error || "Request failed",
    );

  return res.json();
}

async function del(path: string) {
  const res = await fetch(`${BASE_URL}/api${path}`, { method: "DELETE" });
  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({}))).error || "Request failed",
    );
  return res.json();
}

export const api = {
  getProfile: (userId: string) => {
    return get(`/profile?userId=${userId}`);
  },

  saveProfile: (
    userId: string,
    profile: Omit<UserProfile, "userId" | "updatedAt">,
  ) => {
    return post("/profile", { userId, ...profile });
  },

  generatePlan: (userId: string) => {
    return post("/plan/generate", { userId });
  },

  getCurrentPlan: (userId: string) => {
    return get(`/plan/current?userId=${userId}`);
  },

  getAllPlans: (userId: string) => {
    return get(`/plan/all?userId=${userId}`);
  },

  updatePlan: (planId: string, userId: string, weeklySchedule: import("../types").DaySchedule[]) => {
    return put(`/plan/${planId}`, { userId, weeklySchedule });
  },

  createSession: (data: {
    userId: string;
    planId: string;
    dayLabel: string;
    focus: string;
    sessionDate: string;
    exercises: Array<{ exerciseName: string; order: number; setsCount: number }>;
  }) => {
    return post("/tracker/sessions", data);
  },

  getTodaySession: (userId: string, date: string) => {
    return get(`/tracker/sessions/today?userId=${userId}&date=${date}`);
  },

  updateSession: (
    sessionId: string,
    data: {
      userId: string;
      completed?: boolean;
      notes?: string;
      exercises: Array<{
        id: string;
        setsData: Array<{ setNumber: number; weight: number | null; repsCompleted: number | null; notes: string }>;
        skipped?: boolean;
      }>;
    },
  ) => {
    return put(`/tracker/sessions/${sessionId}`, data);
  },

  getSessions: (userId: string, limit = 20, offset = 0) => {
    return get(`/tracker/sessions?userId=${userId}&limit=${limit}&offset=${offset}`);
  },

  deleteSession: (sessionId: string, userId: string) => {
    return del(`/tracker/sessions/${sessionId}?userId=${userId}`);
  },
};