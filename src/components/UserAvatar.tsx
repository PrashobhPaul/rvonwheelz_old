import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-2xl",
  xl: "w-20 h-20 text-3xl",
};

export function UserAvatar({ name, avatarUrl, className, size = "md" }: UserAvatarProps) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name || "User"} />}
      <AvatarFallback className="bg-primary/10 text-primary font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
