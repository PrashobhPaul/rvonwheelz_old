import { Ride, HOME_LOCATION, DEFAULT_DESTINATION } from "@/lib/types";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface DirectionToggleProps {
  direction: Ride["direction"];
  onChange: (direction: Ride["direction"]) => void;
  destination?: string;
}

export function DirectionToggle({ direction, onChange, destination }: DirectionToggleProps) {
  const isToOffice = direction === "to-office";
  const dest = destination || DEFAULT_DESTINATION;

  return (
    <button
      onClick={() => onChange(isToOffice ? "to-home" : "to-office")}
      className="w-full flex items-center gap-3 rounded-lg border bg-card p-3 transition-all hover:ride-card-shadow-hover active:scale-[0.98]"
    >
      <div className="flex-1 text-right">
        <p className="text-xs text-muted-foreground">From</p>
        <p className="text-sm font-semibold text-foreground leading-tight">
          {isToOffice ? HOME_LOCATION : dest}
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
          {isToOffice ? dest : HOME_LOCATION}
        </p>
      </div>
    </button>
  );
}
