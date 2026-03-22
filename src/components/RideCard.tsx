import { useState } from "react";
import { Ride, RideRequest, getDirectionShort, canRejectPassenger, canCancelRequest, getMinutesUntilRide } from "@/lib/types";
import { deleteRide, addRequest, getRequestsForRide, updateRequestStatus, getApprovedCount } from "@/lib/rides";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Users, Car, Phone, Trash2, ArrowRight, ArrowLeft, UserPlus, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface RideCardProps {
  ride: Ride;
  onDeleted: () => void;
}

export function RideCard({ ride, onDeleted }: RideCardProps) {
  const [showPhone, setShowPhone] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState("");
  const [requestMode, setRequestMode] = useState(false);
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [showRequests, setShowRequests] = useState(false);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerVerified, setOwnerVerified] = useState(false);
  const [, forceUpdate] = useState(0);

  const isToOffice = ride.direction === "to-office";
  const requests = getRequestsForRide(ride.id);
  const approvedCount = getApprovedCount(ride.id);
  const availableSeats = ride.seats - approvedCount;
  const minutesUntil = getMinutesUntilRide(ride);
  const isPast = minutesUntil < 0;

  const handleDelete = () => {
    if (verifyPhone === ride.phone) {
      deleteRide(ride.id);
      toast.success("Ride deleted");
      onDeleted();
    } else {
      toast.error("Phone number doesn't match");
    }
  };

  const handleRequest = () => {
    if (!passengerName.trim() || passengerPhone.trim().length < 10) {
      toast.error("Enter valid name and 10-digit phone");
      return;
    }
    if (availableSeats <= 0) {
      toast.error("No seats available");
      return;
    }
    const existing = requests.find(r => r.passengerPhone === passengerPhone.trim() && r.status !== "cancelled" && r.status !== "rejected");
    if (existing) {
      toast.error("You already have a request for this ride");
      return;
    }
    addRequest({ rideId: ride.id, passengerName: passengerName.trim(), passengerPhone: passengerPhone.trim() });
    toast.success("Ride request sent! The driver will approve/reject.");
    setRequestMode(false);
    setPassengerName("");
    setPassengerPhone("");
    forceUpdate(n => n + 1);
  };

  const handleApprove = (req: RideRequest) => {
    updateRequestStatus(req.id, "approved");
    toast.success(`${req.passengerName} approved`);
    forceUpdate(n => n + 1);
  };

  const handleReject = (req: RideRequest) => {
    if (!canRejectPassenger(ride)) {
      toast.error("Cannot reject within 15 minutes of ride start");
      return;
    }
    updateRequestStatus(req.id, "rejected");
    toast.success(`${req.passengerName} rejected`);
    forceUpdate(n => n + 1);
  };

  const handleCancelByPassenger = (req: RideRequest) => {
    if (!canCancelRequest(ride)) {
      toast.error("Cannot cancel within 30 minutes of ride start");
      return;
    }
    updateRequestStatus(req.id, "cancelled");
    toast.success("Request cancelled");
    forceUpdate(n => n + 1);
  };

  const handleShowRequests = () => {
    if (ownerPhone !== ride.phone) {
      toast.error("Enter your registered phone to view requests");
      return;
    }
    setOwnerVerified(true);
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");

  return (
    <Card className={`ride-card-shadow hover:ride-card-shadow-hover transition-shadow animate-slide-up ${isPast ? "opacity-60" : ""}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{ride.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              {availableSeats}/{ride.seats} seats
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {isToOffice ? <ArrowRight className="w-3 h-3 mr-1" /> : <ArrowLeft className="w-3 h-3 mr-1" />}
              {getDirectionShort(ride.direction)}
            </Badge>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {ride.date} · {ride.time}
          </span>
          <span className="flex items-center gap-1">
            <Car className="w-3.5 h-3.5" />
            {ride.vehicle || "Car"}
          </span>
        </div>

        {/* Time warning */}
        {!isPast && minutesUntil < 30 && (
          <div className="flex items-center gap-1.5 text-xs text-warning">
            <AlertCircle className="w-3.5 h-3.5" />
            Ride starts in {Math.round(minutesUntil)} min
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {showPhone ? (
            <a href={`tel:${ride.phone}`} className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Phone className="w-3.5 h-3.5" />
              {ride.phone}
            </a>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowPhone(true)} className="text-xs">
              <Phone className="w-3.5 h-3.5 mr-1" /> Contact
            </Button>
          )}

          {!isPast && availableSeats > 0 && (
            <Button variant="default" size="sm" onClick={() => setRequestMode(!requestMode)} className="text-xs">
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Request Seat
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => setShowRequests(!showRequests)} className="text-xs ml-auto">
            <Users className="w-3.5 h-3.5 mr-1" /> {pendingRequests.length > 0 ? `${pendingRequests.length} pending` : "Manage"}
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setDeleteMode(!deleteMode)} className="text-xs text-muted-foreground">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Request seat form */}
        {requestMode && (
          <div className="space-y-2 animate-slide-up border-t pt-3">
            <p className="text-xs font-medium text-foreground">Request a seat</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Your name" value={passengerName} onChange={e => setPassengerName(e.target.value)} className="text-sm h-8" />
              <Input placeholder="Phone (10 digits)" value={passengerPhone} onChange={e => setPassengerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="text-sm h-8" />
            </div>
            <Button size="sm" onClick={handleRequest} className="w-full text-xs">Send Request</Button>
          </div>
        )}

        {/* Manage requests (driver view - requires phone verification) */}
        {showRequests && !showRequestsList && (
          <div className="space-y-2 animate-slide-up border-t pt-3">
            <p className="text-xs text-muted-foreground">Enter your registered phone to manage requests</p>
            <div className="flex gap-2">
              <Input placeholder="Your phone" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="text-sm h-8" />
              <Button size="sm" onClick={handleShowRequests} className="text-xs shrink-0">View</Button>
            </div>
          </div>
        )}

        {showRequests && (
          <div className="space-y-2 animate-slide-up border-t pt-3">
            <p className="text-xs font-medium text-foreground">Ride Requests</p>
            {requests.length === 0 ? (
              <p className="text-xs text-muted-foreground">No requests yet</p>
            ) : (
              <div className="space-y-2">
                {requests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                    <div>
                      <span className="font-medium text-foreground">{req.passengerName}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{req.passengerPhone}</span>
                      <Badge variant={req.status === "approved" ? "default" : req.status === "rejected" ? "destructive" : "secondary"} className="ml-2 text-xs">
                        {req.status}
                      </Badge>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" onClick={() => handleApprove(req)} className="h-6 w-6 p-0">
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(req)} className="h-6 w-6 p-0">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {req.status === "approved" && (
                      <Button size="sm" variant="ghost" onClick={() => handleCancelByPassenger(req)} className="text-xs h-6">
                        Cancel
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete verification */}
        {deleteMode && (
          <div className="flex gap-2 items-center animate-slide-up border-t pt-3">
            <Input placeholder="Enter phone to verify" value={verifyPhone} onChange={e => setVerifyPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="text-sm h-8" />
            <Button variant="destructive" size="sm" onClick={handleDelete} className="text-xs shrink-0">Delete</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
