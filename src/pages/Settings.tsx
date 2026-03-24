import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  const [block, setBlock] = useState(profile?.block ?? "");
  const [flatNumber, setFlatNumber] = useState(profile?.flat_number ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");

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
      });
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
