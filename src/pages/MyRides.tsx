import { useMemo, useState, useEffect } from "react";
import { useRides, useRequests, useCompletionStats } from "@/hooks/useRides";
import { useAuth } from "@/hooks/useAuth";
import { RideCard } from "@/components/RideCard";
import { Badge } from "@/components/ui/badge";
import { Car, TicketCheck, Loader2, TrendingUp, UserCheck, Radio, Clock, MapPin, CalendarCheck } from "lucide-react";
import { getDirectionShort, isRideOngoing } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { getFrequentPatterns, FrequentPattern } from "@/lib/habitTracker";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function MyRides() {
  const { user } = useAuth();
  const { data: rides = [], isLoading: ridesLoading } = useRides();
  const { data: allRequests = [], isLoading: reqLoading } = useRequests();
  const { data: completionStats } = useCompletionStats(user?.id);
  const [patterns, setPatterns] = useState(getFrequentPatterns());
  const navigate = useNavigate();

  useEffect(() => {
    setPatterns(getFrequentPatterns());
  }, []);

  const myRides = useMemo(
    () => rides.filter((r) => r.user_id === user?.id).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
    [rides, user]
  );

  const myRequests = useMemo(() => {
    const reqs = allRequests.filter((r) => r.passenger_id === user?.id);
    return reqs.map((req) => ({
      ...req,
      ride: rides.find((r) => r.id === req.ride_id),
    })).sort((a, b) => (b.requested_at || "").localeCompare(a.requested_at || ""));
  }, [allRequests, rides, user]);

  // Current active rides + historical completions
  const now = new Date();
  const activePastGiven = myRides.filter((r) => new Date(`${r.date}T${r.time}`) < now).length;
  const activePastTaken = myRequests.filter((r) => r.status === "approved" && r.ride && new Date(`${r.ride.date}T${r.ride.time}`) < now).length;
  const ridesGivenCount = (completionStats?.ridesGiven || 0) + activePastGiven;
  const ridesTakenCount = (completionStats?.ridesTaken || 0) + activePastTaken;

  // Derive pattern stats
  const mostFrequentTime = useMemo(() => {
    if (patterns.length === 0) return null;
    const sorted = [...patterns].sort((a, b) => b.count - a.count);
    const [h, m] = sorted[0].time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }, [patterns]);

  const mostUsedRoute = useMemo(() => {
    if (patterns.length === 0) return null;
    const sorted = [...patterns].sort((a, b) => b.count - a.count);
    return sorted[0].destination;
  }, [patterns]);

  const habitConsistency = useMemo(() => {
    if (patterns.length === 0) return null;
    const totalCount = patterns.reduce((sum, p) => sum + p.count, 0);
    const daysPerWeek = Math.min(7, Math.round(totalCount / Math.max(1, patterns.length)));
    return `${daysPerWeek} days/week`;
  }, [patterns]);

  const isLoading = ridesLoading || reqLoading;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your rides...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ride Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{ridesGivenCount}</p>
              <p className="text-xs text-muted-foreground">Rides Given</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{ridesTakenCount}</p>
              <p className="text-xs text-muted-foreground">Rides Taken</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ride Patterns */}
      {patterns.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Your Ride Patterns</h2>
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                <div className="rounded-full bg-primary/10 p-2">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <p className="text-base font-bold text-foreground">{mostFrequentTime}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Most Frequent Time</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                <div className="rounded-full bg-primary/10 p-2">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs font-bold text-foreground leading-tight">{mostUsedRoute}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Most Used Route</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                <div className="rounded-full bg-primary/10 p-2">
                  <CalendarCheck className="w-4 h-4 text-primary" />
                </div>
                <p className="text-base font-bold text-foreground">{habitConsistency}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Habit Consistency</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* My Offered Rides */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Rides I'm Offering</h2>
          <Badge variant="secondary" className="text-xs">{myRides.length}</Badge>
        </div>

        {myRides.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">You haven't offered any rides yet.</p>
        ) : (
          <div className="space-y-3">
            {myRides.map((ride) => (
              <div key={ride.id} className="relative">
                {isRideOngoing(ride) && (
                  <Badge className="absolute -top-2 right-2 z-10 bg-green-600 hover:bg-green-700 text-white text-[10px] px-2 py-0.5 animate-pulse gap-1">
                    <Radio className="w-3 h-3" />
                    Ongoing
                  </Badge>
                )}
                <RideCard ride={ride} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Seat Requests */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <TicketCheck className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">My Seat Requests</h2>
          <Badge variant="secondary" className="text-xs">{myRequests.length}</Badge>
        </div>

        {myRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">You haven't requested any seats yet.</p>
        ) : (
          <div className="space-y-2">
            {myRequests.map((req) => (
              <div key={req.id} className="relative rounded-lg border bg-card p-3 space-y-1.5">
                {req.ride && isRideOngoing(req.ride) && (
                  <Badge className="absolute -top-2 right-2 z-10 bg-green-600 hover:bg-green-700 text-white text-[10px] px-2 py-0.5 animate-pulse gap-1">
                    <Radio className="w-3 h-3" />
                    Ongoing
                  </Badge>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {req.ride ? req.ride.name : "Unknown driver"}
                  </span>
                  <Badge
                    variant={
                      req.status === "approved" ? "default" :
                      req.status === "rejected" ? "destructive" :
                      req.status === "cancelled" ? "outline" :
                      "secondary"
                    }
                    className="text-xs"
                  >
                    {req.status === "approved" ? "✅ Approved" :
                     req.status === "rejected" ? "❌ Rejected" :
                     req.status === "cancelled" ? "Cancelled" :
                     "⏳ Pending"}
                  </Badge>
                </div>
                {req.ride && (
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{req.ride.date} · {req.ride.time}</span>
                    <span>{getDirectionShort(req.ride.direction as "to-office" | "to-home")}</span>
                    <span>{req.ride.vehicle || "Car"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
