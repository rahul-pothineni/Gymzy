import { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, CheckCircle, Clock, Dumbbell, Loader2 } from "lucide-react";
import type { WorkoutSession } from "../../types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface SessionHistoryProps {
  sessions: WorkoutSession[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

function SessionDetail({ session }: { session: WorkoutSession }) {
  return (
    <div className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4">
      {session.exercises.map((exercise) => (
        <div key={exercise.id}>
          <p className="font-medium text-sm mb-2">
            {exercise.exerciseName}
            {exercise.skipped && (
              <span className="ml-2 text-xs text-[var(--color-muted)]">(Skipped)</span>
            )}
          </p>
          {!exercise.skipped && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[var(--color-muted)] text-xs uppercase tracking-wider">
                    <th className="text-left py-1 pr-4 font-medium">Set</th>
                    <th className="py-1 px-4 font-medium text-left">Weight</th>
                    <th className="py-1 px-4 font-medium text-left">Reps</th>
                    <th className="py-1 px-4 font-medium text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.setsData.map((set) => (
                    <tr
                      key={set.setNumber}
                      className="border-b border-[var(--color-border)] last:border-0"
                    >
                      <td className="py-2 pr-4 text-[var(--color-muted)]">
                        {set.setNumber}
                      </td>
                      <td className="py-2 px-4">
                        {set.weight !== null ? (
                          <span className="text-[var(--color-accent)] font-medium">{set.weight}</span>
                        ) : (
                          <span className="text-[var(--color-muted)]">—</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {set.repsCompleted !== null ? set.repsCompleted : (
                          <span className="text-[var(--color-muted)]">—</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-[var(--color-muted)] text-xs">
                        {set.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function SessionHistory({
  sessions,
  isLoading,
  onLoadMore,
  hasMore,
}: SessionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--color-muted)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading sessions...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--color-muted)]">
        <Dumbbell className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p>No previous sessions yet.</p>
        <p className="text-sm mt-1">Complete a workout to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const isExpanded = expandedId === session.id;
        return (
          <Card
            key={session.id}
            variant="bordered"
            className="cursor-pointer"
            onClick={() => setExpandedId(isExpanded ? null : session.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h4 className="font-semibold">{session.dayLabel}</h4>
                  <p className="text-sm text-[var(--color-accent)]">{session.focus}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <Calendar className="w-4 h-4" />
                  <span>{session.sessionDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <Dumbbell className="w-4 h-4" />
                  <span>{session.exercises.length}</span>
                </div>
                {session.completed ? (
                  <CheckCircle className="w-5 h-5 text-[var(--color-accent)]" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-400" />
                )}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[var(--color-muted)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--color-muted)]" />
                )}
              </div>
            </div>

            {isExpanded && <SessionDetail session={session} />}
          </Card>
        );
      })}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onLoadMore();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
