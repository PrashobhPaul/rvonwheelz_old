import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Leaf className="w-8 h-8" />
            <span className="text-2xl font-bold">RideShare</span>
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

          <footer className="text-center pt-4 text-xs text-muted-foreground border-t mt-4">
            <p>🌱 Share rides, reduce emissions, save money</p>
          </footer>
        </CardContent>
      </Card>
    </div>
  );
}
