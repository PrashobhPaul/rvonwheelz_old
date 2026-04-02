import { useState, useEffect } from "react";
import { getActiveSuggestion, FrequentPattern } from "@/lib/habitTracker";
import { getDirectionShort } from "@/lib/types";
import { Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SmartRideBannerProps {
  onOfferRide: () => void;
}

export function SmartRideBanner({ onOfferRide }: SmartRideBannerProps) {
  const [suggestion, setSuggestion] = useState<FrequentPattern | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check immediately, then every 60s
    const check = () => {
      const s = getActiveSuggestion();
      setSuggestion(s);
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!suggestion || dismissed) return null;

  const actionLabel = suggestion.action === "offered" ? "offer" : "book";
  const dirLabel = getDirectionShort(suggestion.direction);

  return (
    <div className="relative rounded-lg border border-primary/30 bg-primary/5 p-3 animate-fade-in">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-start gap-2.5 pr-5">
        <div className="rounded-full bg-primary/10 p-1.5 mt-0.5 shrink-0">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">
            You usually {actionLabel} a ride at {suggestion.time}
          </p>
          <p className="text-xs text-muted-foreground">
            {dirLabel} · {suggestion.from} → {suggestion.to}
          </p>
          <Button size="sm" className="text-xs h-7 mt-1" onClick={onOfferRide}>
            {suggestion.action === "offered" ? "Offer a Ride Now" : "Find a Ride Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}
