
import type { UserProfile } from "../types";
import { getAuthToken } from "./auth";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function post(path: string, body: object) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({}))).error || "Request failed",
    );

  return res.json();
}

async function get(path: string) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: await authHeaders(),
  });
  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({}))).error || "Request failed",
    );
  return res.json();
}

async function put(path: string, body: object) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({}))).error || "Request failed",
    );

  return res.json();
}

async function del(path: string) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({}))).error || "Request failed",
    );
  return res.json();
}

export const api = {
  getProfile: () => {
    return get(`/profile`);
  },

  saveProfile: (
    profile: Omit<UserProfile, "userId" | "updatedAt">,
  ) => {
    return post("/profile", { ...profile });
  },

  generatePlan: () => {
    return post("/plan/generate", {});
  },

  getCurrentPlan: () => {
    return get(`/plan/current`);
  },

  getAllPlans: () => {
    return get(`/plan/all`);
  },

  updatePlan: (planId: string, weeklySchedule: import("../types").DaySchedule[]) => {
    return put(`/plan/${planId}`, { weeklySchedule });
  },

  createSession: (data: {
    planId: string;
    dayLabel: string;
    focus: string;
    sessionDate: string;
    exercises: Array<{ exerciseName: string; order: number; setsCount: number }>;
  }) => {
    return post("/tracker/sessions", data);
  },

  getTodaySession: (date: string) => {
    return get(`/tracker/sessions/today?date=${date}`);
  },

  updateSession: (
    sessionId: string,
    data: {
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

  getSessions: (limit = 20, offset = 0) => {
    return get(`/tracker/sessions?limit=${limit}&offset=${offset}`);
  },

  deleteSession: (sessionId: string) => {
    return del(`/tracker/sessions/${sessionId}`);
  },
};
