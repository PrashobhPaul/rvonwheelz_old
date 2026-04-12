import { useState, useMemo, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Ride, DESTINATIONS, DEFAULT_DESTINATION, getLocalToday, getMinutesUntilRide, isRideOngoing } from "@/lib/types";
import { DirectionToggle } from "@/components/DirectionToggle";
import { OfferRideForm } from "@/components/OfferRideForm";
import { RideCard } from "@/components/RideCard";
import { SmartRideBanner } from "@/components/SmartRideBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, LogOut, Loader2, Home, CarFront, Settings, Moon, Sun } from "lucide-react";
import { useRides, useDriverBlocks, useRequests } from "@/hooks/useRides";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { scoreRide, BEST_MATCH_THRESHOLD } from "@/lib/rideScoring";
import MyRides from "@/pages/MyRides";
import SettingsPage from "@/pages/Settings";
import { RideCancelledSuggestions } from "@/components/RideCancelledSuggestions";
import { useCancelledRide } from "@/hooks/useCancelledRide";

export default function Index() {
  const { data: rides = [], isLoading } = useRides();
  const { data: allRequests = [] } = useRequests();
  const { profile, signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: favorites = [] } = useFavorites();
  const [filterDirection, setFilterDirection] = useState<Ride["direction"]>("to-office");
  const [filterDestination, setFilterDestination] = useState<string>("all");
  const [filterDate, setFilterDate] = useState(getLocalToday());
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "my-rides" | "settings">("home");
  const { cancelledRide, dismiss: dismissCancelled } = useCancelledRide();
  const userChangedDestination = useRef(false);

  // Collect unique driver IDs for block lookup
  const driverIds = useMemo(() => [...new Set(rides.map((r) => r.user_id).filter((id) => id !== user?.id))], [rides, user?.id]);
  const { data: driverBlocks = {} } = useDriverBlocks(driverIds);

  // Auto-select office location from profile, but don't override manual changes
  useEffect(() => {
    if (profile?.office_location && !userChangedDestination.current) {
      setFilterDestination(profile.office_location);
    }
  }, [profile?.office_location]);

  // Detect if user has an ongoing ride (as driver or approved passenger)
  const hasOngoingRide = useMemo(() => {
    return rides.some((r) => {
      if (!isRideOngoing(r)) return false;
      if (r.user_id === user?.id) return true;
      return allRequests.some(
        (req) => req.ride_id === r.id && req.passenger_id === user?.id && req.status === "approved"
      );
    });
  }, [rides, allRequests, user?.id]);

  const handleDestinationChange = (value: string) => {
    userChangedDestination.current = true;
    setFilterDestination(value);
  };

  // Resolve the effective destination for the direction toggle display
  const effectiveDestination = filterDestination !== "all"
    ? filterDestination
    : (profile?.office_location || DEFAULT_DESTINATION);

  const scoringCtx = useMemo(() => ({
    userOfficeLocation: profile?.office_location,
    userBlock: profile?.block,
    favorites,
    driverBlocks,
  }), [profile?.office_location, profile?.block, favorites, driverBlocks]);

  const filtered = useMemo(() => {
    const filterArea = filterDestination !== "all"
      ? filterDestination.split("–")[0].trim()
      : null;

    return rides
      .filter((r) => r.direction === filterDirection)
      .filter((r) => !filterDate || r.date === filterDate)
      .filter((r) => {
        if (!filterArea) return true;
        const rideArea = (r.destination || "").split("–")[0].trim();
        return rideArea === filterArea;
      })
      .filter((r) => getMinutesUntilRide(r as any) >= 15)
      .map((r) => ({ ...r, _score: r.user_id === user?.id ? -1 : scoreRide(r, scoringCtx) }))
      .sort((a, b) => {
        if (a._score !== b._score) return b._score - a._score;
        return a.time.localeCompare(b.time);
      });
  }, [rides, filterDirection, filterDate, filterDestination, scoringCtx, user?.id]);

  // Track which ride IDs are "best match"
  const bestMatchIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of filtered) {
      if ((r as any)._score >= BEST_MATCH_THRESHOLD) ids.add(r.id);
    }
    return ids;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-10 bg-primary px-4 py-4 text-primary-foreground">
        <div className="container max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="RVonWheelz logo" className="w-7 h-7 rounded" />
            <h1 className="text-lg font-bold tracking-tight">RVonWheelz</h1>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <span className="text-xs sm:text-sm opacity-80">{profile.name}</span>
            )}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="opacity-80 hover:opacity-100"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={signOut} className="opacity-80 hover:opacity-100">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-5 space-y-5">
        {activeTab === "home" ? (
          <>
            <SmartRideBanner onOfferRide={() => setShowForm(true)} />
            <DirectionToggle
              direction={filterDirection}
              onChange={setFilterDirection}
              destination={effectiveDestination}
            />

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Filter by Destination</label>
                <Select value={filterDestination} onValueChange={handleDestinationChange}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All destinations" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">All Destinations</SelectItem>
                    {DESTINATIONS.map((d) => (
                      <SelectItem key={d} value={d} className="text-sm">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="pl-9 text-sm" />
                </div>
                <Button
                  onClick={() => setShowForm(!showForm)}
                  className="shrink-0"
                  disabled={hasOngoingRide}
                  title={hasOngoingRide ? "You have an ongoing ride" : undefined}
                >
                  <Plus className="w-4 h-4 mr-1" /> Offer Ride
                </Button>
              </div>
            </div>

            {hasOngoingRide && (
              <p className="text-xs text-destructive font-medium flex items-center gap-1">
                ⚠️ You have an ongoing ride. Offering new rides is disabled until it ends.
              </p>
            )}

            {showForm && !hasOngoingRide && <OfferRideForm onClose={() => setShowForm(false)} />}

            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading rides...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CarIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No rides found for this date & direction.</p>
                  <p className="text-xs mt-1">Be the first to offer a ride!</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{filtered.length} ride{filtered.length !== 1 ? "s" : ""} available</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filtered.map((ride) => (
                      <RideCard key={ride.id} ride={ride} bestMatch={bestMatchIds.has(ride.id)} />
                    ))}
                  </div>
                </>
              )}
            </div>

            <footer className="text-center pt-6 pb-4 text-muted-foreground border-t space-y-1.5">
              <p className="text-sm font-semibold">🌱 Share rides, reduce emissions, save together</p>
              <p className="text-xs">A community initiative for Raheja Vistas Elite, Nacharam</p>
              <p className="text-[11px] opacity-60">Built with ❤️ by Prashobh Paul</p>
            </footer>
          </>
        ) : activeTab === "my-rides" ? (
          <MyRides onSwitchToHome={() => setActiveTab("home")} />
        ) : (
          <SettingsPage />
        )}
      </main>

      {/* Cancelled ride alternatives overlay */}
      {cancelledRide && (
        <RideCancelledSuggestions cancelledRide={cancelledRide} onDismiss={dismissCancelled} />
      )}

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-card border-t border-border">
        <div className="container max-w-3xl mx-auto flex">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
              activeTab === "home" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home className="w-5 h-5" />
            All Rides
          </button>
          <button
            onClick={() => setActiveTab("my-rides")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
              activeTab === "my-rides" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <CarFront className="w-5 h-5" />
            My Rides
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
              activeTab === "settings" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>
      </nav>
    </div>
  );
}

function CarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-2-2.2-3.3C13 5.6 12 5 11 5H5c-1 0-2 .5-2.8 1.3L0 9h3c.6 0 1 .4 1 1v7" />
      <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
    </svg>
  );
}
