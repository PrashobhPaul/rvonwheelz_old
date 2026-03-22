import { Ride, LOCATIONS } from "@/lib/types";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface DirectionToggleProps {
  direction: Ride["direction"];
  onChange: (direction: Ride["direction"]) => void;
}

export function DirectionToggle({ direction, onChange }: DirectionToggleProps) {
  const isToOffice = direction === "to-office";

  return (
    <button
      onClick={() => onChange(isToOffice ? "to-home" : "to-office")}
      className="w-full flex items-center gap-3 rounded-lg border bg-card p-3 transition-all hover:ride-card-shadow-hover active:scale-[0.98]"
    >
      <div className="flex-1 text-right">
        <p className="text-xs text-muted-foreground">From</p>
        <p className="text-sm font-semibold text-foreground leading-tight">
          {isToOffice ? LOCATIONS.home : LOCATIONS.office}
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary">
        {isToOffice ? (
          <ArrowRight className="w-5 h-5 text-primary-foreground" />
        ) : (
          <ArrowLeft className="w-5 h-5 text-primary-foreground" />
        )}
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs text-muted-foreground">To</p>
        <p className="text-sm font-semibold text-foreground leading-tight">
          {isToOffice ? LOCATIONS.office : LOCATIONS.home}
        </p>
      </div>
    </button>
  );
}
