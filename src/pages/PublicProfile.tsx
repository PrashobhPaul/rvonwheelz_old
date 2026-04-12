import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRides, useRequests, useProfile, useCompletionStats } from "@/hooks/useRides";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, TrendingUp, UserCheck, Star, Globe, Briefcase, Activity } from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { Bike } from "lucide-react";

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

  const now = new Date();

  // Lifetime stats
  const userRides = useMemo(
    () => rides.filter((r) => r.user_id === userId),
    [rides, userId]
  );

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

  // Recent activity (last 10 days)
  const recentActivity = useMemo(() => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const recentGiven = userRides.filter((r) => {
      const rideDate = new Date(`${r.date}T${r.time}`);
      return rideDate >= tenDaysAgo && rideDate < now && allRequests.some(
        (req) => req.ride_id === r.id && req.status === "approved"
      );
    }).length;

    const recentTaken = allRequests.filter((r) => r.passenger_id === userId && r.status === "approved").filter((r) => {
      const ride = rides.find((ri) => ri.id === r.ride_id);
      if (!ride) return false;
      const rideDate = new Date(`${ride.date}T${ride.time}`);
      return rideDate >= tenDaysAgo && rideDate < now;
    }).length;

    return { given: recentGiven, taken: recentTaken, total: recentGiven + recentTaken };
  }, [userRides, allRequests, rides, userId, now]);

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
  const officeLocation = (profile as any).office_location || "";

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

      <main className="container max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Avatar + Name + Info */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
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
          {officeLocation && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Works at: {officeLocation}
            </p>
          )}
          {!isOwnProfile && user && (
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              className="mt-1"
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
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {profileLanguages.join(" • ")}
              </span>
            </div>
          </div>
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

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Recent Activity
              <span className="text-xs font-normal text-muted-foreground">(last 10 days)</span>
            </h3>
            <p className="text-lg font-bold text-foreground">
              📊 {recentActivity.total} total ride{recentActivity.total !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{recentActivity.given} given</span>
              <span>{recentActivity.taken} taken</span>
            </div>
          </CardContent>
        </Card>

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
      </main>
    </div>
  );
}
