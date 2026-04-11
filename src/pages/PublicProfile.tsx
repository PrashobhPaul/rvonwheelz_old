import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRides, useRequests, useProfile, useCompletionStats } from "@/hooks/useRides";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { getDirectionShort, HOME_LOCATION } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, TrendingUp, UserCheck, Clock, ArrowRight, Bike, Star, Globe } from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(userId);
  const { data: rides = [], isLoading: ridesLoading } = useRides();
  const { data: allRequests = [], isLoading: reqLoading } = useRequests();
  const { data: completionStats } = useCompletionStats(userId);
  const { data: favorites = [] } = useFavorites();
  const toggleFavMutation = useToggleFavorite();
  const isFavorite = userId ? favorites.includes(userId) : false;
  const isOwnProfile = user?.id === userId;
  const userRides = useMemo(
    () => rides.filter((r) => r.user_id === userId).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
    [rides, userId]
  );

  const now = new Date();
  const activePastGiven = userRides.filter((r) => {
    const isPast = new Date(`${r.date}T${r.time}`) < now;
    const hasApprovedPassenger = allRequests.some(
      (req) => req.ride_id === r.id && req.status === "approved"
    );
    return isPast && hasApprovedPassenger;
  }).length;
  const ridesGivenCount = (completionStats?.ridesGiven || 0) + activePastGiven;

  const ridesTakenCount = useMemo(() => {
    const activePastTaken = allRequests.filter((r) => r.passenger_id === userId && r.status === "approved").filter((r) => {
      const ride = rides.find((ri) => ri.id === r.ride_id);
      return ride && new Date(`${ride.date}T${ride.time}`) < now;
    }).length;
    return (completionStats?.ridesTaken || 0) + activePastTaken;
  }, [allRequests, rides, userId, completionStats, now]);

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

  const hasCarDetails = profile.car_name && profile.car_registration;
  const hasBikeDetails = profile.bike_name && profile.bike_registration;
  const profileLanguages: string[] = (profile as any).languages || [];

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
          <div className="flex justify-center mb-3">
            <UserAvatar name={profile.name} avatarUrl={(profile as any).avatar_url} size="lg" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
          <p className="text-sm text-muted-foreground">
            Block {profile.block}, Flat {profile.flat_number}
          </p>
          {isFavorite && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
              ⭐ Preferred
            </Badge>
          )}
          {!isOwnProfile && user && (
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              className="mt-2"
              onClick={() => userId && toggleFavMutation.mutate(userId, {
                onSuccess: (res) => toast.success(res.action === "added" ? "Added to favorites ⭐" : "Removed from favorites"),
              })}
            >
              <Star className={`w-4 h-4 mr-1 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
              {isFavorite ? "⭐ Preferred" : "Add to Favorites"}
            </Button>
          )}
        </div>

        {/* Languages */}
        {profileLanguages.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" /> Languages
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profileLanguages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-xs">{lang}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
        {(hasCarDetails || hasBikeDetails) && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" /> Vehicle Info
              </h3>
              {hasCarDetails && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Car className="w-4 h-4 shrink-0" />
                  <span>🚗 {profile.car_name}{(profile as any).car_color ? ` • ${(profile as any).car_color}` : ""} • {profile.car_registration}</span>
                </div>
              )}
              {hasBikeDetails && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bike className="w-4 h-4 shrink-0" />
                  <span>🏍️ {profile.bike_name}{(profile as any).bike_color ? ` • ${(profile as any).bike_color}` : ""} • {profile.bike_registration}</span>
                </div>
              )}
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
                      {ride.destination && (
                        <p className="text-xs text-muted-foreground truncate">
                          {ride.direction === "to-office"
                            ? `→ ${ride.destination}`
                            : `${ride.destination} →`}
                        </p>
                      )}
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
