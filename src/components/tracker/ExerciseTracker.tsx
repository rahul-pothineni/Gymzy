import { Ban, Info } from "lucide-react";
import type { Exercise, SessionExercise, SetData } from "../../types";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

interface ExerciseTrackerProps {
  exercise: SessionExercise;
  planExercise: Exercise;
  onChange: (exerciseId: string, setsData: SetData[]) => void;
  onSkip: (exerciseId: string) => void;
}

export function ExerciseTracker({
  exercise,
  planExercise,
  onChange,
  onSkip,
}: ExerciseTrackerProps) {
  const handleSetChange = (
    setIndex: number,
    field: keyof Pick<SetData, "weight" | "repsCompleted" | "notes">,
    value: string,
  ) => {
    const updated = exercise.setsData.map((set, i) => {
      if (i !== setIndex) return set;
      if (field === "notes") {
        return { ...set, notes: value };
      }
      const num = value === "" ? null : Number(value);
      return { ...set, [field]: num };
    });
    onChange(exercise.id, updated);
  };

  return (
    <Card
      variant="bordered"
      className={exercise.skipped ? "opacity-50" : ""}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h4 className="font-semibold text-lg">{exercise.exerciseName}</h4>
          <div className="flex items-center gap-3 mt-1 text-sm text-[var(--color-muted)]">
            <span>
              <span className="text-[var(--color-accent)] font-medium">
                {planExercise.sets}
              </span>
              {" x "}
              {planExercise.reps}
            </span>
            <span>Rest: {planExercise.rest}</span>
            <span>RPE {planExercise.rpe}</span>
          </div>
          {planExercise.notes && (
            <p className="text-xs text-[var(--color-muted)] mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              {planExercise.notes}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSkip(exercise.id)}
        >
          <Ban className="w-4 h-4" />
        </Button>
      </div>

      {!exercise.skipped && (
        <div className="space-y-3">
          {/* Header row */}
          <div className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-3 text-xs text-[var(--color-muted)] uppercase tracking-wider px-1">
            <span>Set</span>
            <span>Weight</span>
            <span>Reps</span>
            <span>Notes</span>
          </div>

          {exercise.setsData.map((set, i) => (
            <div
              key={set.setNumber}
              className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-3 items-center"
            >
              <span className="text-sm text-[var(--color-muted)] text-center font-medium">
                {set.setNumber}
              </span>
              <Input
                type="number"
                placeholder="lbs"
                inputMode="decimal"
                min={0}
                value={set.weight ?? ""}
                onChange={(e) =>
                  handleSetChange(i, "weight", e.target.value)
                }
              />
              <Input
                type="number"
                placeholder="reps"
                inputMode="numeric"
                min={0}
                value={set.repsCompleted ?? ""}
                onChange={(e) =>
                  handleSetChange(i, "repsCompleted", e.target.value)
                }
              />
              <Input
                type="text"
                placeholder="felt easy..."
                value={set.notes}
                onChange={(e) =>
                  handleSetChange(i, "notes", e.target.value)
                }
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
