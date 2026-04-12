import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";

export function NetworkStatus({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [appReady, setAppReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      window.location.reload();
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setTimedOut(true);
      return;
    }
    const timer = setTimeout(() => {
      if (!appReady) setTimedOut(true);
    }, 3000);
    setAppReady(true);
    return () => clearTimeout(timer);
  }, [isOnline]);

  const handleRetry = useCallback(() => window.location.reload(), []);

  if (!isOnline || (timedOut && !appReady)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center gap-6">
        <img src="/images/logo.png" alt="RVonWheelz" className="w-16 h-16 rounded-xl" />
        <div className="space-y-2">
          <WifiOff className="w-12 h-12 mx-auto text-muted-foreground/60" />
          <h2 className="text-xl font-bold text-foreground">No Internet Connection</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Please check your connection to continue using RVonWheelZ
          </p>
        </div>
        <Button onClick={handleRetry} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
