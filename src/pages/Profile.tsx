import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import {
  Calendar,
  Check,
  Dumbbell,
  Pencil,
  Plus,
  RefreshCcw,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Card } from "../components/ui/Card";
import { PlanDisplay } from "../components/plan/PlanDisplay";
import { api } from "../lib/api";
import type { DaySchedule } from "../types";

export default function Profile() {
  const { user, isLoading, plan, generatePlan, refreshData } = useAuth();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedSchedule, setEditedSchedule] = useState<DaySchedule[] | null>(null);

  async function handleRegenerate() {
    setIsRegenerating(true);
    try {
      await generatePlan();
    } finally {
      setIsRegenerating(false);
    }
  }

  function handleStartEdit() {
    if (!plan) return;
    setEditedSchedule(JSON.parse(JSON.stringify(plan.weeklySchedule)));
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditedSchedule(null);
  }

  async function handleSaveEdit() {
    if (!user || !plan || !editedSchedule) return;
    setIsSaving(true);
    try {
      await api.updatePlan(plan.id, user.id, editedSchedule);
      await refreshData();
      setIsEditing(false);
      setEditedSchedule(null);
    } catch (err) {
      console.error("Error saving plan:", err);
    } finally {
      setIsSaving(false);
    }
  }

  if (!user && !isLoading) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCcw className="w-6 h-6 animate-spin text-[var(--color-muted)]" />
      </div>
    );
  }

  if (!plan) {
    return <Navigate to="/onboarding" replace />;
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-1">Your Training Plan</h1>
            <p className="text-[var(--color-muted)] text-sm">
              Version {plan.version} · Created {formatDate(plan.createdAt)}
            </p>
          </div>

          <div className="flex gap-2">
            <Link to="/onboarding">
              <Button variant="primary" className="gap-2">
                <Plus className="w-4 h-4" />
                New Plan
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="gap-2"
              disabled={isRegenerating}
              onClick={handleRegenerate}
            >
              <RefreshCcw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card variant="bordered" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-card)] flex items-center justify-center">
              <Target className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Goal</p>
              <p className="font-medium text-sm">{plan.overview.goal}</p>
            </div>
          </Card>
          <Card variant="bordered" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-card)] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Frequency</p>
              <p className="font-medium text-sm">{plan.overview.frequency}</p>
            </div>
          </Card>
          <Card variant="bordered" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-card)] flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Split</p>
              <p className="font-medium text-sm">{plan.overview.split}</p>
            </div>
          </Card>
          <Card variant="bordered" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-card)] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Version</p>
              <p className="font-medium text-sm">{plan.version}</p>
            </div>
          </Card>
        </div>

        <Card variant="bordered" className="mb-8">
          <h2 className="font-semibold text-base tracking-tight mb-3">Program Notes</h2>
          <p className="text-[var(--color-muted)] text-sm leading-relaxed">
            {plan.overview.notes}
          </p>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg tracking-tight">Weekly Schedule</h2>
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5"
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={handleStartEdit}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          )}
        </div>
        <PlanDisplay
          weeklySchedule={isEditing && editedSchedule ? editedSchedule : plan.weeklySchedule}
          editable={isEditing}
          onChange={setEditedSchedule}
        />

        <Card variant="bordered" className="mb-8">
          <h2 className="font-semibold text-base tracking-tight mb-3">Progression Strategy</h2>
          <p className="text-[var(--color-muted)] text-sm leading-relaxed">
            {plan.progression}
          </p>
        </Card>
      </div>
    </div>
  );
}
