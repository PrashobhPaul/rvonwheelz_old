import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRides, useRequests, useProfile } from "@/hooks/useRides";
import { getDirectionShort } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, TrendingUp, UserCheck, Clock, ArrowRight, Bike } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile(userId);
  const { data: rides = [], isLoading: ridesLoading } = useRides();
  const { data: allRequests = [], isLoading: reqLoading } = useRequests();

  const userRides = useMemo(
    () => rides.filter((r) => r.user_id === userId).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
    [rides, userId]
  );

  const ridesGivenCount = userRides.length;

  const ridesTakenCount = useMemo(
    () => allRequests.filter((r) => r.passenger_id === userId && r.status === "approved").length,
    [allRequests, userId]
  );

  const isLoading = profileLoading || ridesLoading || reqLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Profile not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-primary px-4 py-4 text-primary-foreground">
        <div className="container max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="opacity-80 hover:opacity-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Profile</h1>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* Name & Block */}
        <div className="text-center space-y-1">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-primary">
              {profile.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
          <p className="text-sm text-muted-foreground">
            Block {profile.block}, Flat {profile.flat_number}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{ridesGivenCount}</p>
                <p className="text-xs text-muted-foreground">Rides Given</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{ridesTakenCount}</p>
                <p className="text-xs text-muted-foreground">Rides Taken</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Info */}
        {(profile.vehicle_name || profile.registration_number) && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" /> Vehicle Info
              </h3>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {profile.vehicle_name && (
                  <span>{profile.vehicle_name}</span>
                )}
                {profile.registration_number && (
                  <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{profile.registration_number}</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ride History */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Ride History
            <Badge variant="secondary" className="text-xs">{userRides.length}</Badge>
          </h3>

          {userRides.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No rides offered yet.</p>
          ) : (
            <div className="space-y-2">
              {userRides.map((ride) => (
                <Card key={ride.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span>{ride.date}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{ride.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {ride.vehicle?.toLowerCase().includes("bike") ? (
                          <Bike className="w-3 h-3" />
                        ) : (
                          <Car className="w-3 h-3" />
                        )}
                        <span>{ride.vehicle || "Car"}</span>
                        <span>· {ride.seats} seat{ride.seats !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <ArrowRight className="w-3 h-3 mr-1" />
                      {getDirectionShort(ride.direction as "to-office" | "to-home")}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
