
-- Create ride_messages table for ride chat
CREATE TABLE public.ride_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_quick_action BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;

-- Only ride participants (driver or approved passenger) can view messages
CREATE POLICY "Ride participants can view messages"
ON public.ride_messages
FOR SELECT
TO authenticated
USING (
  ride_id IN (
    SELECT id FROM public.rides WHERE user_id = auth.uid()
  )
  OR
  ride_id IN (
    SELECT ride_id FROM public.ride_requests WHERE passenger_id = auth.uid() AND status = 'approved'
  )
);

-- Only ride participants can send messages
CREATE POLICY "Ride participants can send messages"
ON public.ride_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    ride_id IN (
      SELECT id FROM public.rides WHERE user_id = auth.uid()
    )
    OR
    ride_id IN (
      SELECT ride_id FROM public.ride_requests WHERE passenger_id = auth.uid() AND status = 'approved'
    )
  )
);

-- Enable realtime for ride_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;
