import { Dumbbell, Info } from "lucide-react";
import type { DaySchedule, Exercise } from "../../types";
import { Card } from "../ui/Card";

function ExerciseRow({
  exercise,
  index,
  editable,
  onChange,
}: {
  exercise: Exercise;
  index: number;
  editable?: boolean;
  onChange?: (updated: Exercise) => void;
}) {
  if (editable && onChange) {
    return (
      <tr className="border-b border-[var(--color-border)] last:border-0">
        <td className="py-2 pr-3">
          <div className="flex items-start gap-2">
            <span className="text-xs text-[var(--color-muted)] w-5 pt-2">
              {index + 1}.
            </span>
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={exercise.name}
                onChange={(e) => onChange({ ...exercise, name: e.target.value })}
                className="w-full px-2 py-1.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-sm font-medium text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
              />
              <input
                type="text"
                value={exercise.notes ?? ""}
                onChange={(e) =>
                  onChange({ ...exercise, notes: e.target.value || undefined })
                }
                placeholder="Notes (optional)"
                className="w-full px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-xs text-[var(--color-muted)] placeholder:text-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </div>
          </div>
        </td>

        <td className="py-2 px-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <input
              type="number"
              value={exercise.sets}
              onChange={(e) =>
                onChange({ ...exercise, sets: parseInt(e.target.value) || 0 })
              }
              className="w-12 px-1.5 py-1.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-sm text-center font-medium text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
              min={0}
            />
            <span className="text-[var(--color-muted)] text-sm">x</span>
            <input
              type="text"
              value={exercise.reps}
              onChange={(e) =>
                onChange({ ...exercise, reps: e.target.value })
              }
              className="w-16 px-1.5 py-1.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-sm text-center text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>
        </td>

        <td className="py-2 px-2 text-center">
          <input
            type="text"
            value={exercise.rest}
            onChange={(e) => onChange({ ...exercise, rest: e.target.value })}
            className="w-16 px-1.5 py-1.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-sm text-center text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </td>

        <td className="py-2 px-2 text-center">
          <input
            type="number"
            value={exercise.rpe}
            onChange={(e) =>
              onChange({ ...exercise, rpe: parseFloat(e.target.value) || 0 })
            }
            className="w-12 px-1.5 py-1.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-sm text-center font-medium text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            min={1}
            max={10}
            step={0.5}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-[var(--color-border)] last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-start gap-3">
          <span className="text-xs text-[var(--color-muted)] w-5">
            {index + 1}.
          </span>
          <div>
            <p className="font-medium">{exercise.name}</p>
            {exercise.notes && (
              <p className="text-xs text-[var(--color-muted)] mt-0.5 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {exercise.notes}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="py-3 px-4 text-center whitespace-nowrap">
        <span className="text-[var(--color-accent)] font-medium">
          {exercise.sets}
        </span>
        <span className="text-[var(--color-muted)]"> x </span>
        <span>{exercise.reps}</span>
      </td>

      <td className="py-3 px-4 text-center">
        <span className="text-[var(--color-muted)]">{exercise.rest}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium
            ${
              exercise.rpe >= 8
                ? "bg-[var(--color-error)]/10 text-[var(--color-error)]"
                : exercise.rpe >= 7
                  ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                  : "bg-[var(--color-success)]/10 text-[var(--color-success)]"
            }`}
        >
          {exercise.rpe}
        </span>
      </td>
    </tr>
  );
}

function DayCard({
  schedule,
  editable,
  onChange,
}: {
  schedule: DaySchedule;
  editable?: boolean;
  onChange?: (updated: DaySchedule) => void;
}) {
  function handleExerciseChange(exerciseIndex: number, updated: Exercise) {
    if (!onChange) return;
    const newExercises = [...schedule.exercises];
    newExercises[exerciseIndex] = updated;
    onChange({ ...schedule, exercises: newExercises });
  }

  return (
    <Card variant="bordered" className="overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-base tracking-tight">{schedule.day}</h3>
          <p className="text-sm text-[var(--color-muted)]">{schedule.focus}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <Dumbbell className="w-4 h-4" />
          <span>{schedule.exercises.length} exercises</span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--color-muted)] text-xs uppercase tracking-widest">
              <th className="text-left py-2 pr-4 font-medium">Exercise</th>
              <th className="py-2 px-4 font-medium">Sets x Reps</th>
              <th className="py-2 px-4 font-medium">Rest</th>
              <th className="py-2 px-4 font-medium">RPE</th>
            </tr>
          </thead>

          <tbody>
            {schedule.exercises.map((exercise, key) => (
              <ExerciseRow
                key={key}
                exercise={exercise}
                index={key}
                editable={editable}
                onChange={(updated) => handleExerciseChange(key, updated)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

interface PlanDisplayProps {
  weeklySchedule: DaySchedule[];
  editable?: boolean;
  onChange?: (updated: DaySchedule[]) => void;
}

export function PlanDisplay({ weeklySchedule, editable, onChange }: PlanDisplayProps) {
  function handleDayChange(dayIndex: number, updated: DaySchedule) {
    if (!onChange) return;
    const newSchedule = [...weeklySchedule];
    newSchedule[dayIndex] = updated;
    onChange(newSchedule);
  }

  return (
    <div className="space-y-6 mb-8">
      {weeklySchedule.map((schedule, key) => (
        <DayCard
          key={key}
          schedule={schedule}
          editable={editable}
          onChange={(updated) => handleDayChange(key, updated)}
        />
      ))}
    </div>
  );
}
