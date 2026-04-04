import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const { signUp, signIn } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [block, setBlock] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [phone, setPhone] = useState("");

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address first");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent! Check your email.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim() || !block.trim() || !flatNumber.trim() || phone.trim().length < 10) {
          toast.error("Please fill all fields with valid data");
          setLoading(false);
          return;
        }
        await signUp(email, password, {
          name: name.trim(),
          block: block.trim(),
          flat_number: flatNumber.trim(),
          phone: phone.trim(),
          vehicle_name: "",
          registration_number: "",
          office_location: "Nanakramguda – Sattva Knowledge City Main Gate",
        });
        toast.success("Registration successful! You're now logged in.");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Hero / branding panel — visible on larger screens */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground space-y-6">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="RVonWheelz logo" className="w-16 h-16 rounded-xl" />
            <span className="text-4xl font-bold tracking-tight">RVonWheelz</span>
          </div>
          <p className="text-lg leading-relaxed opacity-90">
            Share rides with your neighbours at Raheja Vistas Elite. Save money, reduce emissions, and build community — one ride at a time.
          </p>
          <div className="pt-4 space-y-2 text-sm opacity-75">
            <p>🌱 A strictly open-source & non-profit initiative</p>
            <p>by <span className="font-semibold opacity-100">Prashobh Paul</span> for Raheja Vistas Elite, Nacharam</p>
          </div>
        </div>
      </div>

      {/* Auth form panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <img src="/images/logo.png" alt="RVonWheelz logo" className="w-10 h-10 rounded-lg" />
              <span className="text-2xl font-bold">RVonWheelz</span>
            </div>
            <CardTitle className="text-lg">{isRegister ? "Create Account" : "Welcome Back"}</CardTitle>
            <CardDescription>
              {isRegister ? "Register to start sharing rides" : "Login to your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
              </div>

              {isRegister && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required maxLength={50} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="block">Block</Label>
                      <Input id="block" value={block} onChange={(e) => setBlock(e.target.value)} placeholder="e.g. A, B, C" required maxLength={10} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="flat">Flat Number</Label>
                      <Input id="flat" value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} placeholder="e.g. 301" required maxLength={10} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" required />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isRegister ? "Register" : "Login"}
              </Button>

              {!isRegister && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="w-full text-sm text-muted-foreground hover:text-primary hover:underline mt-2"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              )}
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm text-primary hover:underline"
              >
                {isRegister ? "Already have an account? Login" : "New here? Create an account"}
              </button>
            </div>

            <footer className="text-center pt-4 text-xs text-muted-foreground border-t mt-4 space-y-1 lg:hidden">
              <p>🌱 Share rides, reduce emissions, save money</p>
              <p>A strictly open-source & non-profit initiative</p>
              <p>by <span className="font-medium text-foreground">Prashobh Paul</span> for Raheja Vistas Elite, Nacharam</p>
            </footer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
