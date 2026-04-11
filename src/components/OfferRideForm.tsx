import { useState, useEffect } from "react";
import { Ride, canCreateRide, isRideOngoing, getLocalToday, DESTINATIONS, DEFAULT_DESTINATION } from "@/lib/types";
import { recordHabit } from "@/lib/habitTracker";
import { DirectionToggle } from "./DirectionToggle";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useCreateRide, useRides, useRequests } from "@/hooks/useRides";

interface OfferRideFormProps {
  onClose: () => void;
}

export function OfferRideForm({ onClose }: OfferRideFormProps) {
  const { user, profile } = useAuth();
  const [direction, setDirection] = useState<Ride["direction"]>("to-office");
  const [destination, setDestination] = useState(profile?.office_location || DEFAULT_DESTINATION);
  const [date, setDate] = useState(getLocalToday());
  const [time, setTime] = useState("08:30");
  const [vehicleType, setVehicleType] = useState<"car" | "bike">("car");
  const [seats, setSeats] = useState(3);
  const mutation = useCreateRide();
  const { data: allRides = [] } = useRides();
  const { data: allRequests = [] } = useRequests();

  const hasOngoingRide = allRides.some((r) => {
    if (!isRideOngoing(r)) return false;
    if (r.user_id === user?.id) return true;
    return allRequests.some(
      (req) => req.ride_id === r.id && req.passenger_id === user?.id && req.status === "approved"
    );
  });

  useEffect(() => {
    if (profile?.office_location) {
      setDestination(profile.office_location);
    }
  }, [profile?.office_location]);

  const handleVehicleTypeChange = (type: "car" | "bike") => {
    setVehicleType(type);
    setSeats(type === "car" ? 3 : 1);
  };

  // Derive vehicle info from profile based on selected type
  const vehicleName = vehicleType === "car" ? (profile?.car_name || "") : (profile?.bike_name || "");
  const vehicleReg = vehicleType === "car" ? (profile?.car_registration || "") : (profile?.bike_registration || "");
  const vehicleColor = vehicleType === "car" ? (profile?.car_color || "") : (profile?.bike_color || "");
  const hasVehicleDetails = vehicleName.trim() !== "" && vehicleReg.trim() !== "";
  const colorPart = vehicleColor.trim() ? ` • ${vehicleColor.trim()}` : "";
  const vehicleDisplay = hasVehicleDetails
    ? `${vehicleType === "car" ? "🚗" : "🏍️"} ${vehicleName}${colorPart} • ${vehicleReg}`
    : "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasOngoingRide) {
      toast.error("You have an ongoing ride. You cannot offer a new ride until it ends.");
      return;
    }
    if (!hasVehicleDetails) {
      toast.error("Please complete vehicle details in Profile");
      return;
    }
    if (!canCreateRide(date, time)) {
      toast.error("Ride must start at least 30 minutes from now");
      return;
    }
    const vehicleLabel = `${vehicleName}${vehicleColor.trim() ? ` (${vehicleColor.trim()})` : ""} (${vehicleReg})`;
    mutation.mutate(
      { direction, destination, date, time, seats, vehicle: vehicleLabel },
      {
        onSuccess: () => {
          recordHabit({ time, direction, destination, action: "offered", date });
          toast.success("Ride offered successfully!");
          onClose();
        },
        onError: (err) => toast.error(err.message || "Failed to create ride"),
      }
    );
  };

  return (
    <Card className="animate-slide-up border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="w-5 h-5 text-primary" />
          Offer a Ride
        </CardTitle>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Destination</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {DESTINATIONS.map((d) => (
                  <SelectItem key={d} value={d} className="text-sm">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DirectionToggle direction={direction} onChange={setDirection} destination={destination} />

          <div className="space-y-1.5">
            <Label>Vehicle Type</Label>
            <div className="flex gap-2">
              <Button type="button" variant={vehicleType === "car" ? "default" : "outline"} size="sm" onClick={() => handleVehicleTypeChange("car")} className="flex-1">🚗 Car</Button>
              <Button type="button" variant={vehicleType === "bike" ? "default" : "outline"} size="sm" onClick={() => handleVehicleTypeChange("bike")} className="flex-1">🏍️ Bike</Button>
            </div>
          </div>

          {/* Vehicle details display */}
          {hasVehicleDetails ? (
            <div className="rounded-lg border bg-muted/50 px-3 py-2.5 text-sm font-medium text-foreground">
              {vehicleDisplay}
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Please add {vehicleType} details in Profile
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>
          {vehicleType === "car" && (
            <div className="space-y-1.5">
              <Label htmlFor="seats">Seats</Label>
              <Input id="seats" type="number" min={1} max={6} value={seats} onChange={(e) => setSeats(Number(e.target.value))} required />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={mutation.isPending || !hasVehicleDetails}>
            {mutation.isPending ? "Creating..." : "Offer Ride"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
