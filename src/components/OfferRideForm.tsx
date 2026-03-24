import { useState } from "react";
import { Ride, canCreateRide } from "@/lib/types";
import { DirectionToggle } from "./DirectionToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, X } from "lucide-react";
import { toast } from "sonner";
import { useCreateRide } from "@/hooks/useRides";

interface OfferRideFormProps {
  onClose: () => void;
}

export function OfferRideForm({ onClose }: OfferRideFormProps) {
  const [direction, setDirection] = useState<Ride["direction"]>("to-office");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("08:30");
  const [seats, setSeats] = useState(2);
  const [vehicle, setVehicle] = useState("");
  const mutation = useCreateRide();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateRide(date, time)) {
      toast.error("Cannot create a ride that starts within 30 minutes");
      return;
    }
    mutation.mutate(
      { direction, date, time, seats, vehicle: vehicle.trim() || "Car" },
      {
        onSuccess: () => {
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
          <DirectionToggle direction={direction} onChange={setDirection} />
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
              <Input id="seats" type="number" min={1} max={6} value={seats} onChange={(e) => setSeats(Number(e.target.value))} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vehicle">Vehicle (optional)</Label>
            <Input id="vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="e.g. Car - Hyundai i20" maxLength={50} />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Offer Ride"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
