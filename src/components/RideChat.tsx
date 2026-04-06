import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useRideMessages, useSendMessage } from "@/hooks/useRideChat";
import { useRequests } from "@/hooks/useRides";
import { useAuth } from "@/hooks/useAuth";
import { isRideOngoing } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, X, Phone, Navigation, Clock, Users } from "lucide-react";

interface RideChatProps {
  ride: {
    id: string;
    user_id: string;
    name: string;
    phone: string;
    date: string;
    time: string;
  };
  onClose: () => void;
}

export function RideChat({ ride, onClose }: RideChatProps) {
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useRideMessages(ride.id);
  const { data: requests = [] } = useRequests(ride.id);
  const sendMutation = useSendMessage();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const rideStart = new Date(`${ride.date}T${ride.time}`);
  const rideEnd = new Date(rideStart.getTime() + 60 * 60000);
  const now = new Date();
  const chatActive = now < rideEnd;

  const participants = useMemo(() => {
    const approved = requests.filter((r) => r.status === "approved");
    return [
      { id: ride.user_id, name: ride.name, isDriver: true },
      ...approved.map((r) => ({ id: r.passenger_id, name: r.passenger_name, isDriver: false })),
    ];
  }, [requests, ride]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (msg?: string, isQuick = false) => {
    const message = msg || text.trim();
    if (!message || !chatActive) return;
    sendMutation.mutate({ rideId: ride.id, message, isQuickAction: isQuick });
    if (!msg) setText("");
  };

  const quickActions = [
    { label: "🚗 On my way", message: "On my way!" },
    { label: "⏰ Running late", message: "Running late, please wait!" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="w-5 h-5 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm font-bold truncate">Ride Chat</h2>
            <p className="text-xs opacity-80 truncate">{ride.date} · {ride.time}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:opacity-80">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Participants */}
      <div className="px-4 py-2 border-b bg-card flex items-center gap-2 overflow-x-auto shrink-0">
        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
        {participants.map((p) => (
          <Link
            key={p.id}
            to={`/profile/${p.id}`}
            onClick={onClose}
            className="shrink-0"
          >
            <Badge variant={p.isDriver ? "default" : "secondary"} className="text-xs whitespace-nowrap">
              {p.name} {p.isDriver ? "🚗" : ""}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hello! 👋</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  msg.is_quick_action
                    ? "bg-accent/20 border border-accent/30"
                    : isMe
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                }`}>
                  {!isMe && (
                    <Link to={`/profile/${msg.user_id}`} onClick={onClose} className="text-[10px] font-semibold text-primary block mb-0.5">
                      {msg.user_name}
                    </Link>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-[10px] mt-0.5 ${isMe && !msg.is_quick_action ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick actions + Input */}
      {chatActive ? (
        <div className="border-t bg-card px-4 py-2 space-y-2 shrink-0">
          <div className="flex gap-2">
            {quickActions.map((qa) => (
              <Button
                key={qa.label}
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={sendMutation.isPending}
                onClick={() => handleSend(qa.message, true)}
              >
                {qa.label}
              </Button>
            ))}
            <a href={`tel:${ride.phone}`} className="ml-auto">
              <Button variant="outline" size="sm" className="text-xs">
                <Phone className="w-3.5 h-3.5 mr-1" /> Call
              </Button>
            </a>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-sm"
              disabled={sendMutation.isPending}
            />
            <Button type="submit" size="sm" disabled={!text.trim() || sendMutation.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      ) : (
        <div className="border-t bg-muted px-4 py-3 text-center shrink-0">
          <p className="text-sm text-muted-foreground">This chat is no longer active.</p>
        </div>
      )}
    </div>
  );
}
