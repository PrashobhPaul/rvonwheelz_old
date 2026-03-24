import { useState, useMemo } from "react";
import { Ride } from "@/lib/types";
import { DirectionToggle } from "@/components/DirectionToggle";
import { OfferRideForm } from "@/components/OfferRideForm";
import { RideCard } from "@/components/RideCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Leaf, LogOut, Loader2, Home, CarFront, Settings } from "lucide-react";
import { useRides } from "@/hooks/useRides";
import { useAuth } from "@/hooks/useAuth";
import MyRides from "@/pages/MyRides";
import SettingsPage from "@/pages/Settings";

export default function Index() {
  const { data: rides = [], isLoading } = useRides();
  const { profile, signOut } = useAuth();
  const [filterDirection, setFilterDirection] = useState<Ride["direction"]>("to-office");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "my-rides" | "settings">("home");

  const filtered = useMemo(() => {
    return rides
      .filter((r) => r.direction === filterDirection)
      .filter((r) => !filterDate || r.date === filterDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [rides, filterDirection, filterDate]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-10 bg-primary px-4 py-4 text-primary-foreground">
        <div className="container max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6" />
            <h1 className="text-lg font-bold tracking-tight">RideShare</h1>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <span className="text-xs opacity-80">{profile.name}</span>
            )}
            <button onClick={signOut} className="opacity-80 hover:opacity-100">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-5 space-y-5">
        {activeTab === "home" ? (
          <>
            <DirectionToggle direction={filterDirection} onChange={setFilterDirection} />

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="pl-9 text-sm" />
              </div>
              <Button onClick={() => setShowForm(!showForm)} className="shrink-0">
                <Plus className="w-4 h-4 mr-1" /> Offer Ride
              </Button>
            </div>

            {showForm && <OfferRideForm onClose={() => setShowForm(false)} />}

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
                  {filtered.map((ride) => (
                    <RideCard key={ride.id} ride={ride} />
                  ))}
                </>
              )}
            </div>

            <footer className="text-center pt-6 pb-4 text-xs text-muted-foreground border-t space-y-1">
              <p>🌱 Share rides, reduce emissions, save money</p>
              <p>A strictly open-source & non-profit initiative</p>
              <p>by <span className="font-medium text-foreground">Prashobh Paul</span> for Raheja Vistas Elite, Nacharam</p>
            </footer>
          </>
        ) : activeTab === "my-rides" ? (
          <MyRides />
        ) : (
          <SettingsPage />
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-card border-t border-border">
        <div className="container max-w-lg mx-auto flex">
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
