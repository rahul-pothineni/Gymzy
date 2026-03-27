import { Dumbbell } from "lucide-react";
import type { DaySchedule } from "../../types";
import { Card } from "../ui/Card";

interface DaySelectorProps {
  weeklySchedule: DaySchedule[];
  onSelect: (day: DaySchedule) => void;
}

export function DaySelector({ weeklySchedule, onSelect }: DaySelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {weeklySchedule.map((day) => (
        <Card
          key={day.day}
          variant="bordered"
          className="cursor-pointer hover:border-[var(--color-accent)] hover:bg-[var(--color-card-hover)]"
          onClick={() => onSelect(day)}
        >
          <h3 className="font-semibold text-base tracking-tight">{day.day}</h3>
          <p className="text-sm text-[var(--color-muted)] mt-1">{day.focus}</p>
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)] mt-3">
            <Dumbbell className="w-4 h-4" />
            <span>{day.exercises.length} exercises</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
