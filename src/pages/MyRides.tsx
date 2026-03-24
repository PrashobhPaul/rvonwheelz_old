import { useMemo } from "react";
import { useRides, useRequests } from "@/hooks/useRides";
import { useAuth } from "@/hooks/useAuth";
import { RideCard } from "@/components/RideCard";
import { Badge } from "@/components/ui/badge";
import { Car, TicketCheck, Loader2 } from "lucide-react";
import { getDirectionShort } from "@/lib/types";

export default function MyRides() {
  const { user } = useAuth();
  const { data: rides = [], isLoading: ridesLoading } = useRides();
  const { data: allRequests = [], isLoading: reqLoading } = useRequests();

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
              <RideCard key={ride.id} ride={ride} />
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
              <div key={req.id} className="rounded-lg border bg-card p-3 space-y-1.5">
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
