import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Plus, Trash2, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getFrequentPatterns, FrequentPattern, recordHabit, deletePattern } from "@/lib/habitTracker";
import { HOME_LOCATION } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getRouteLabel(direction: "to-office" | "to-home", destination: string) {
  const short = destination.length > 30 ? destination.slice(0, 28) + "…" : destination;
  const homeShort = HOME_LOCATION.split(",")[0];
  if (direction === "to-office") return { from: homeShort, to: short };
  return { from: short, to: homeShort };
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function AddRoutineDialog({ onAdd, open, onOpenChange }: { onAdd: () => void; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [from, setFrom] = useState("Raheja Vistas Elite");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("08:00");
  const [direction, setDirection] = useState<"to-office" | "to-home">("to-office");
  const [action, setAction] = useState<"offered" | "booked">("offered");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    if (!from.trim() || !to.trim()) {
      toast.error("Please fill in both From and To fields");
      return;
    }
    const destination = direction === "to-office" ? to.trim() : from.trim();
    const today = new Date().toISOString().slice(0, 10);
    // Record twice to create a pattern (≥2 required)
    recordHabit({ time, direction, destination, action, date: today });
    recordHabit({ time, direction, destination, action, date: today });
    toast.success("Routine added! You'll get reminders 30 min before.");
    onOpenChange(false);
    setFrom("Raheja Vistas Elite");
    setTo("");
    setTime("08:00");
    setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    onAdd();
  };

  // Swap from/to when direction changes
  const handleDirectionChange = (v: string) => {
    const newDir = v as "to-office" | "to-home";
    if (newDir !== direction) {
      setFrom(to);
      setTo(from);
    }
    setDirection(newDir);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Commute Routine</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>From</Label>
            <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="e.g. Raheja Vistas Elite" />
          </div>
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g. HITEC City" />
          </div>
          <div className="space-y-1.5">
            <Label>Time</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={direction} onValueChange={handleDirectionChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="to-office">Going</SelectItem>
                <SelectItem value="to-home">Returning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Action</Label>
            <Select value={action} onValueChange={(v) => setAction(v as "offered" | "booked")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="offered">Offer Ride</SelectItem>
                <SelectItem value="booked">Book Ride</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Days <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedDays.includes(day)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:bg-accent"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Routine
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Settings() {
  const { profile, updateProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [block, setBlock] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [patterns, setPatterns] = useState<FrequentPattern[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBlock(profile.block);
      setFlatNumber(profile.flat_number);
      setPhone(profile.phone);
      setVehicleName(profile.vehicle_name || "");
      setRegistrationNumber(profile.registration_number || "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !block.trim() || !flatNumber.trim() || phone.trim().length < 10) {
      toast.error("Please fill all fields with valid data");
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        block: block.trim(),
        flat_number: flatNumber.trim(),
        phone: phone.trim(),
        vehicle_name: vehicleName.trim(),
        registration_number: registrationNumber.trim(),
      });
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHabits = () => {
    localStorage.removeItem("ride_habits");
    setPatterns([]);
    toast.success("All commute habits cleared");
  };

  if (authLoading && !profile) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">Profile Settings</CardTitle>
          <CardDescription>Loading your saved details...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading profile...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Profile Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Settings</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Full Name</Label>
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required maxLength={50} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-block">Block</Label>
                <Input id="s-block" value={block} onChange={(e) => setBlock(e.target.value)} placeholder="e.g. A, B, C" required maxLength={10} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-flat">Flat Number</Label>
                <Input id="s-flat" value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} placeholder="e.g. 301" required maxLength={10} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-phone">Mobile Number</Label>
              <Input id="s-phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-vehicle">Vehicle Name</Label>
              <Input id="s-vehicle" value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} placeholder="e.g. Hyundai i20, Honda Activa" maxLength={50} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-reg">Registration Number</Label>
              <Input id="s-reg" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())} placeholder="e.g. TS09EA1234" maxLength={15} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Commute Habits Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Commute Habits</CardTitle>
          <CardDescription>Your detected routines — get reminders 30 min before</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {patterns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No habits detected yet. Offer or book rides to build patterns, or add a routine manually.
            </p>
          ) : (
            <div className="space-y-2">
              {patterns.map((p, i) => {
                const route = getRouteLabel(p.direction, p.destination);
                return (
                  <div
                    key={`${p.time}-${p.direction}-${p.action}-${i}`}
                    className="rounded-lg border bg-muted/50 p-3 space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <span className="truncate">{route.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{route.to}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTime12h(p.time)}
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {p.direction === "to-office" ? "Going" : "Returning"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {p.action === "offered" ? "Offer" : "Book"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {p.count} times
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Routine
            </Button>
            {patterns.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleClearHabits}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AddRoutineDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={refreshPatterns}
      />
    </div>
  );
}
