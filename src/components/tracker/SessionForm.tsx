import { useState } from "react";
import { Save, CheckCircle, Loader2 } from "lucide-react";
import type { DaySchedule, SetData, WorkoutSession } from "../../types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { ExerciseTracker } from "./ExerciseTracker";

interface SessionFormProps {
  session: WorkoutSession;
  planDay: DaySchedule;
  onSave: (session: WorkoutSession, completed?: boolean) => void;
  isSaving: boolean;
}

export function SessionForm({
  session,
  planDay,
  onSave,
  isSaving,
}: SessionFormProps) {
  const [exercises, setExercises] = useState(session.exercises);

  const handleChange = (exerciseId: string, setsData: SetData[]) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, setsData } : ex)),
    );
  };

  const handleSkip = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, skipped: !ex.skipped } : ex,
      ),
    );
  };

  const buildPayload = (completed?: boolean): WorkoutSession => ({
    ...session,
    exercises,
    ...(completed !== undefined && { completed }),
  });

  const filledSets = exercises
    .filter((ex) => !ex.skipped)
    .flatMap((ex) => ex.setsData)
    .filter((s) => s.weight !== null || s.repsCompleted !== null).length;

  const totalSets = exercises
    .filter((ex) => !ex.skipped)
    .reduce((sum, ex) => sum + ex.setsData.length, 0);

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <Card variant="bordered">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{planDay.day}</h2>
            <p className="text-sm text-[var(--color-muted)]">{planDay.focus}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--color-muted)]">
            <span>{session.sessionDate}</span>
            <span>
              {filledSets}/{totalSets} sets logged
            </span>
          </div>
        </div>
      </Card>

      {/* Exercise list */}
      {exercises.map((exercise) => {
        const planExercise = planDay.exercises.find(
          (pe) => pe.name === exercise.exerciseName,
        );
        if (!planExercise) return null;
        return (
          <ExerciseTracker
            key={exercise.id}
            exercise={exercise}
            planExercise={planExercise}
            onChange={handleChange}
            onSkip={handleSkip}
          />
        );
      })}

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
        <Button
          variant="secondary"
          onClick={() => onSave(buildPayload())}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Progress
        </Button>
        <Button
          variant="primary"
          onClick={() => onSave(buildPayload(true))}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Complete Workout
        </Button>
      </div>
    </div>
  );
}
