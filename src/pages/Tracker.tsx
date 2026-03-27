import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { DaySchedule, PlanSummary, WorkoutSession } from "../types";
import { Select } from "../components/ui/Select";
import { DaySelector } from "../components/tracker/DaySelector";
import { SessionForm } from "../components/tracker/SessionForm";
import { SessionHistory } from "../components/tracker/SessionHistory";

function getTodayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Tracker() {
  const { user, isLoading: authLoading } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<"workout" | "history">("workout");

  // Workout tab state
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // History tab state
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Load plans + check for today's session on mount
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function init() {
      setLoading(true);
      try {
        const [allPlans, todaySession] = await Promise.all([
          api.getAllPlans(),
          api.getTodaySession(getTodayDate()),
        ]);

        setPlans(allPlans);
        if (allPlans.length > 0) {
          setSelectedPlanId(allPlans[0].id);
        }

        if (todaySession) {
          setSession(todaySession);
        }
      } catch (err) {
        console.error("Error initializing tracker:", err);
        setError("Failed to load tracker data.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [user, authLoading]);

  // Load history when switching to history tab
  useEffect(() => {
    if (activeTab !== "history" || !user) return;
    loadHistory(true);
  }, [activeTab, user]);

  async function loadHistory(reset = false) {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const offset = reset ? 0 : history.length;
      const data = await api.getSessions(20, offset);
      setHistory(reset ? data.sessions : [...history, ...data.sessions]);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  async function handleDaySelect(day: DaySchedule) {
    if (!user || !selectedPlan) return;
    setIsCreating(true);
    setError("");
    try {
      const newSession = await api.createSession({
        planId: selectedPlan.id,
        dayLabel: day.day,
        focus: day.focus,
        sessionDate: getTodayDate(),
        exercises: day.exercises.map((ex, i) => ({
          exerciseName: ex.name,
          order: i,
          setsCount: ex.sets,
        })),
      });
      setSession(newSession);
    } catch (err) {
      console.error("Error creating session:", err);
      setError("Failed to create session.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSave(updated: WorkoutSession, completed?: boolean) {
    if (!user) return;
    setIsSaving(true);
    setError("");
    try {
      const saved = await api.updateSession(updated.id, {
        completed: completed ?? updated.completed,
        notes: updated.notes,
        exercises: updated.exercises.map((ex) => ({
          id: ex.id,
          setsData: ex.setsData,
          skipped: ex.skipped,
        })),
      });
      setSession(saved);
    } catch (err) {
      console.error("Error saving session:", err);
      setError("Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  }

  // Auth / plan guards
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-foreground)]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (plans.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  const sessionPlanDay = session
    ? plans
        .find((p) => p.id === session.planId)
        ?.weeklySchedule.find((d) => d.day === session.dayLabel) ?? null
    : null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">Tracker</h1>

        {/* Tab bar */}
        <div className="flex gap-1 mb-8 border-b border-[var(--color-border)]">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "workout"
                ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
            onClick={() => setActiveTab("workout")}
          >
            Today's Workout
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
            onClick={() => setActiveTab("history")}
          >
            Previous Sessions
          </button>
        </div>

        {error && (
          <p className="text-[var(--color-error)] text-sm mb-4">{error}</p>
        )}

        {/* Today's Workout tab */}
        {activeTab === "workout" && (
          <>
            {session && sessionPlanDay ? (
              <SessionForm
                session={session}
                planDay={sessionPlanDay}
                onSave={handleSave}
                isSaving={isSaving}
              />
            ) : (
              <div className="space-y-6">
                <Select
                  label="Select Plan"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  options={plans.map((p) => ({
                    value: p.id,
                    label: `v${p.version} — ${new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
                  }))}
                />

                {selectedPlan && (
                  <>
                    <h2 className="text-lg font-semibold tracking-tight">Pick a day</h2>
                    {isCreating ? (
                      <div className="flex items-center justify-center py-12 text-[var(--color-muted)]">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Creating session...
                      </div>
                    ) : (
                      <DaySelector
                        weeklySchedule={selectedPlan.weeklySchedule}
                        onSelect={handleDaySelect}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <SessionHistory
            sessions={history}
            isLoading={historyLoading}
            onLoadMore={() => loadHistory(false)}
            hasMore={hasMore}
          />
        )}
      </div>
    </div>
  );
}
