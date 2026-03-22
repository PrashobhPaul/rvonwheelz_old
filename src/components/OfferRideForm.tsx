import { useState } from "react";
import { Ride, canCreateRide } from "@/lib/types";
import { addRide } from "@/lib/rides";
import { DirectionToggle } from "./DirectionToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, X } from "lucide-react";
import { toast } from "sonner";

interface OfferRideFormProps {
  onClose: () => void;
  onRideAdded: () => void;
}

export function OfferRideForm({ onClose, onRideAdded }: OfferRideFormProps) {
  const [direction, setDirection] = useState<Ride["direction"]>("to-office");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("08:30");
  const [seats, setSeats] = useState(2);
  const [vehicle, setVehicle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || phone.trim().length < 10) {
      toast.error("Please enter a valid name and 10-digit phone number");
      return;
    }
    if (!canCreateRide(date, time)) {
      toast.error("Cannot create a ride that starts within 30 minutes");
      return;
    }
    addRide({ name: name.trim(), phone: phone.trim(), direction, date, time, seats, vehicle: vehicle.trim() || "Car" });
    toast.success("Ride offered successfully!");
    onRideAdded();
    onClose();
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required maxLength={50} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" required />
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
              <Input id="seats" type="number" min={1} max={6} value={seats} onChange={(e) => setSeats(Number(e.target.value))} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vehicle">Vehicle (optional)</Label>
            <Input id="vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="e.g. Car - Hyundai i20" maxLength={50} />
          </div>
          <Button type="submit" className="w-full">Offer Ride</Button>
        </form>
      </CardContent>
    </Card>
  );
}
