import { useState } from "react";
import { Link } from "react-router-dom";
import { getDirectionShort, canRejectPassenger, canCancelRequest, getMinutesUntilRide, HOME_LOCATION } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Car, Phone, Trash2, ArrowRight, ArrowLeft, UserPlus, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRequests, useDeleteRide, useCreateRequest, useUpdateRequestStatus, useProfile } from "@/hooks/useRides";
import { useAuth } from "@/hooks/useAuth";

interface RideCardProps {
  ride: {
    id: string;
    user_id: string;
    name: string;
    phone: string;
    direction: string;
    destination: string;
    date: string;
    time: string;
    seats: number;
    vehicle: string;
    created_at: string;
  };
}

export function RideCard({ ride }: RideCardProps) {
  const [showPhone, setShowPhone] = useState(false);
  const { user } = useAuth();

  const { data: requests = [] } = useRequests(ride.id);
  const { data: driverProfile } = useProfile(ride.user_id);
  const deleteMutation = useDeleteRide();
  const requestMutation = useCreateRequest();
  const statusMutation = useUpdateRequestStatus();

  const isToOffice = ride.direction === "to-office";
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const availableSeats = ride.seats - approvedCount;
  const rideForTime = { date: ride.date, time: ride.time, direction: ride.direction as "to-office" | "to-home" } as any;
  const minutesUntil = getMinutesUntilRide({ ...rideForTime, id: ride.id, name: ride.name, phone: ride.phone, seats: ride.seats, vehicle: ride.vehicle, createdAt: ride.created_at });
  const isPast = minutesUntil < 0;
  const isOwner = user?.id === ride.user_id;
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const myRequest = requests.find((r) => r.passenger_id === user?.id);

  const handleDelete = () => {
    deleteMutation.mutate(ride.id, {
      onSuccess: () => toast.success("Ride deleted"),
      onError: () => toast.error("Failed to delete"),
    });
  };

  const handleRequest = () => {
    if (availableSeats <= 0) {
      toast.error("No seats available");
      return;
    }
    if (myRequest && myRequest.status !== "cancelled" && myRequest.status !== "rejected") {
      toast.error("You already have a request for this ride");
      return;
    }
    requestMutation.mutate(ride.id, {
      onSuccess: () => toast.success("Ride request sent! The driver will approve/reject."),
      onError: (e) => toast.error(e.message || "Failed to send request"),
    });
  };

  const handleApprove = (reqId: string, name: string) => {
    statusMutation.mutate({ id: reqId, status: "approved" }, {
      onSuccess: () => toast.success(`${name} approved`),
    });
  };

  const handleReject = (reqId: string, name: string) => {
    if (!canRejectPassenger(rideForTime)) {
      toast.error("Cannot reject within 15 minutes of ride start");
      return;
    }
    statusMutation.mutate({ id: reqId, status: "rejected" }, {
      onSuccess: () => toast.success(`${name} rejected`),
    });
  };

  const handleCancelMyRequest = () => {
    if (!myRequest) return;
    if (!canCancelRequest(rideForTime)) {
      toast.error("Cannot cancel within 30 minutes of ride start");
      return;
    }
    statusMutation.mutate({ id: myRequest.id, status: "cancelled" }, {
      onSuccess: () => toast.success("Request cancelled"),
    });
  };

  return (
    <Card className={`ride-card-shadow hover:ride-card-shadow-hover transition-shadow animate-slide-up ${isPast ? "opacity-60" : ""}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to={`/profile/${ride.user_id}`} className="font-semibold text-foreground hover:text-primary transition-colors underline-offset-2 hover:underline">{ride.name}</Link>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-xs">{availableSeats}/{ride.seats} seats</Badge>
            <Badge variant="secondary" className="text-xs">
              {isToOffice ? <ArrowRight className="w-3 h-3 mr-1" /> : <ArrowLeft className="w-3 h-3 mr-1" />}
              {getDirectionShort(ride.direction as "to-office" | "to-home")}
            </Badge>
          </div>
        </div>

        {/* Destination */}
        <p className="text-xs text-muted-foreground truncate">
          {ride.direction === "to-office"
            ? `${HOME_LOCATION} → ${ride.destination || "Destination"}`
            : `${ride.destination || "Destination"} → ${HOME_LOCATION}`}
        </p>

        {/* Details */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{ride.date} · {ride.time}</span>
          <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" />{ride.vehicle || "Car"}</span>
          {driverProfile?.registration_number && (
            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{driverProfile.registration_number}</span>
          )}
        </div>

        {!isPast && minutesUntil < 30 && minutesUntil > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-accent-foreground">
            <AlertCircle className="w-3.5 h-3.5" />Ride starts in {Math.round(minutesUntil)} min
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {showPhone ? (
            <a href={`tel:${ride.phone}`} className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Phone className="w-3.5 h-3.5" />{ride.phone}
            </a>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowPhone(true)} className="text-xs">
              <Phone className="w-3.5 h-3.5 mr-1" /> Contact
            </Button>
          )}

          {/* Request seat (only if not owner, not past, seats available) */}
          {!isOwner && !isPast && availableSeats > 0 && (!myRequest || myRequest.status === "cancelled" || myRequest.status === "rejected") && (
            <Button variant="default" size="sm" onClick={handleRequest} disabled={requestMutation.isPending} className="text-xs">
              <UserPlus className="w-3.5 h-3.5 mr-1" /> {requestMutation.isPending ? "Sending..." : "Request Seat"}
            </Button>
          )}

          {/* Show my request status */}
          {myRequest && myRequest.status !== "cancelled" && myRequest.status !== "rejected" && (
            <div className="flex items-center gap-2">
              <Badge variant={myRequest.status === "approved" ? "default" : "secondary"} className="text-xs">
                {myRequest.status === "approved" ? "✅ Approved" : "⏳ Pending"}
              </Badge>
              {myRequest.status !== "cancelled" && (
                <Button variant="ghost" size="sm" onClick={handleCancelMyRequest} className="text-xs text-muted-foreground">
                  Cancel
                </Button>
              )}
            </div>
          )}

          {/* Owner actions */}
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending} className="text-xs text-muted-foreground ml-auto">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Owner: manage requests */}
        {isOwner && requests.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Requests ({pendingRequests.length} pending)
            </p>
            <div className="space-y-2">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-medium text-foreground">{req.passenger_name}</span>
                    <span className="text-muted-foreground text-xs">{req.passenger_phone}</span>
                    <Badge variant={req.status === "approved" ? "default" : req.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                      {req.status}
                    </Badge>
                  </div>
                  {req.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="default" onClick={() => handleApprove(req.id, req.passenger_name)} className="h-6 w-6 p-0"><Check className="w-3 h-3" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(req.id, req.passenger_name)} className="h-6 w-6 p-0"><X className="w-3 h-3" /></Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
