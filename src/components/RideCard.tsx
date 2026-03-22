import { useState } from "react";
import { Ride, getDirectionShort } from "@/lib/types";
import { deleteRide } from "@/lib/rides";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Users, Car, Phone, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface RideCardProps {
  ride: Ride;
  onDeleted: () => void;
}

export function RideCard({ ride, onDeleted }: RideCardProps) {
  const [showPhone, setShowPhone] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState("");

  const isToOffice = ride.direction === "to-office";

  const handleDelete = () => {
    if (verifyPhone === ride.phone) {
      deleteRide(ride.id);
      toast.success("Ride deleted");
      onDeleted();
    } else {
      toast.error("Phone number doesn't match");
    }
  };

  return (
    <Card className="ride-card-shadow hover:ride-card-shadow-hover transition-shadow animate-slide-up">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{ride.name}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {isToOffice ? <ArrowRight className="w-3 h-3 mr-1" /> : <ArrowLeft className="w-3 h-3 mr-1" />}
            {getDirectionShort(ride.direction)}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {ride.date} · {ride.time}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {ride.seats} seat{ride.seats !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Car className="w-3.5 h-3.5" />
            {ride.vehicle || "Car"}
          </span>
        </div>

        <div className="flex gap-2">
          {showPhone ? (
            <a href={`tel:${ride.phone}`} className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Phone className="w-3.5 h-3.5" />
              {ride.phone}
            </a>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowPhone(true)} className="text-xs">
              <Phone className="w-3.5 h-3.5 mr-1" /> Show Contact
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setDeleteMode(!deleteMode)} className="text-xs text-muted-foreground ml-auto">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {deleteMode && (
          <div className="flex gap-2 items-center animate-slide-up">
            <Input
              placeholder="Enter phone to verify"
              value={verifyPhone}
              onChange={(e) => setVerifyPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="text-sm h-8"
            />
            <Button variant="destructive" size="sm" onClick={handleDelete} className="text-xs shrink-0">
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
