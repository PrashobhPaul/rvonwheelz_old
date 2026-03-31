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
import { Car, X } from "lucide-react";
import { toast } from "sonner";
import { useCreateRide, useRides, useRequests } from "@/hooks/useRides";

interface OfferRideFormProps {
  onClose: () => void;
}

export function OfferRideForm({ onClose }: OfferRideFormProps) {
  const { user, profile } = useAuth();
  const [direction, setDirection] = useState<Ride["direction"]>("to-office");
  const [destination, setDestination] = useState(DEFAULT_DESTINATION);
  const [date, setDate] = useState(getLocalToday());
  const [time, setTime] = useState("08:30");
  const [vehicleType, setVehicleType] = useState<"car" | "bike">("car");
  const [seats, setSeats] = useState(3);
  const [vehicle, setVehicle] = useState("");
  const mutation = useCreateRide();
  const { data: allRides = [] } = useRides();
  const { data: allRequests = [] } = useRequests();

  // Check if user has an ongoing ride (as driver or approved passenger)
  const hasOngoingRide = allRides.some((r) => {
    if (!isRideOngoing(r)) return false;
    // User is the driver
    if (r.user_id === user?.id) return true;
    // User is an approved passenger
    return allRequests.some(
      (req) => req.ride_id === r.id && req.passenger_id === user?.id && req.status === "approved"
    );
  });

  useEffect(() => {
    if (profile?.vehicle_name && !vehicle) {
      setVehicle(profile.vehicle_name);
    }
  }, [profile]);

  const handleVehicleTypeChange = (type: "car" | "bike") => {
    setVehicleType(type);
    setSeats(type === "car" ? 3 : 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasOngoingRide) {
      toast.error("You have an ongoing ride. You cannot offer a new ride until it ends.");
      return;
    }
    if (!canCreateRide(date, time)) {
      toast.error("Ride must start at least 30 minutes from now");
      return;
    }
    mutation.mutate(
      { direction, destination, date, time, seats, vehicle: vehicle.trim() || "Car" },
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
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seats">Seats</Label>
              <Input id="seats" type="number" min={1} max={vehicleType === "car" ? 6 : 2} value={seats} onChange={(e) => setSeats(Number(e.target.value))} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vehicle">Vehicle Name (optional)</Label>
            <Input id="vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder={vehicleType === "car" ? "e.g. Hyundai i20" : "e.g. Honda Activa"} maxLength={50} />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Offer Ride"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
