import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, MapPin, X, ArrowRight } from "lucide-react";
import { useRides, useRequests } from "@/hooks/useRides";
import { useAuth } from "@/hooks/useAuth";
import { getMinutesUntilRide, HOME_LOCATION } from "@/lib/types";
import { Link } from "react-router-dom";

export interface CancelledRideInfo {
  id: string;
  destination: string;
  direction: string;
  date: string;
  time: string;
  name: string;
}

interface Props {
  cancelledRide: CancelledRideInfo;
  onDismiss: () => void;
}

export function RideCancelledSuggestions({ cancelledRide, onDismiss }: Props) {
  const { data: rides = [] } = useRides();
  const { data: allRequests = [] } = useRequests();
  const { user } = useAuth();

  const alternatives = useMemo(() => {
    const cancelledArea = (cancelledRide.destination || "").split("–")[0].trim();
    const [cH, cM] = cancelledRide.time.split(":").map(Number);
    const cancelledMins = cH * 60 + cM;

    return rides
      .filter((r) => {
        // Must be same date, direction, not the cancelled ride, not own ride
        if (r.id === cancelledRide.id) return false;
        if (r.date !== cancelledRide.date) return false;
        if (r.direction !== cancelledRide.direction) return false;
        if (r.user_id === user?.id) return false;
        // Must be in the future (≥15 min)
        if (getMinutesUntilRide({ ...r, direction: r.direction as any } as any) < 15) return false;
        return true;
      })
      .map((r) => {
        const rideArea = (r.destination || "").split("–")[0].trim();
        const [rH, rM] = r.time.split(":").map(Number);
        const rideMins = rH * 60 + rM;
        const timeDiff = Math.abs(rideMins - cancelledMins);

        // Must be within ±30 minutes
        if (timeDiff > 30) return null;

        // Check available seats
        const approved = allRequests.filter(
          (req) => req.ride_id === r.id && req.status === "approved"
        ).length;
        const available = r.seats - approved;
        if (available <= 0) return null;

        // Score: same route gets priority, then closest time
        const routeScore = rideArea === cancelledArea ? 100 : 0;
        const timeScore = 30 - timeDiff; // higher = closer time

        return { ...r, available, _score: routeScore + timeScore, _timeDiff: timeDiff, _sameRoute: rideArea === cancelledArea };
      })
      .filter(Boolean)
      .sort((a, b) => b!._score - a!._score)
      .slice(0, 4) as (typeof rides[number] & { available: number; _timeDiff: number; _sameRoute: boolean })[];
  }, [rides, allRequests, cancelledRide, user?.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <Card className="w-full max-w-md max-h-[80vh] overflow-auto animate-in slide-in-from-bottom-4">
        <CardContent className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Ride Cancelled</h3>
                <p className="text-xs text-muted-foreground">
                  {cancelledRide.name}'s ride on {cancelledRide.date} at {cancelledRide.time}
                </p>
              </div>
            </div>
            <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Alternatives */}
          {alternatives.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Here are similar rides</p>
              {alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className={`rounded-lg border p-3 space-y-1.5 ${alt._sameRoute ? "border-primary/30 bg-primary/5" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/profile/${alt.user_id}`}
                      className="text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {alt.name}
                    </Link>
                    <div className="flex items-center gap-1.5">
                      {alt._sameRoute && (
                        <Badge variant="secondary" className="text-[10px]">Same route</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">{alt.available} seat{alt.available !== 1 ? "s" : ""}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alt.time}
                      {alt._timeDiff > 0 && (
                        <span className="text-[10px]">({alt._timeDiff < 1 ? "same time" : `${alt._timeDiff}m ${parseInt(alt.time) > parseInt(cancelledRide.time) ? "later" : "earlier"}`})</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {alt.destination}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">No similar rides available right now.</p>
              <p className="text-xs mt-1">Try checking back later or offer your own ride!</p>
            </div>
          )}

          <Button variant="outline" size="sm" className="w-full text-xs" onClick={onDismiss}>
            Dismiss
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
