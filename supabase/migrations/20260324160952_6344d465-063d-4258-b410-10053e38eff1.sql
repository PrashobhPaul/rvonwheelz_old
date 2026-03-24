
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  block TEXT NOT NULL,
  flat_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create rides table
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('to-office', 'to-home')),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  seats INTEGER NOT NULL CHECK (seats >= 1 AND seats <= 6),
  vehicle TEXT NOT NULL DEFAULT 'Car',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rides are viewable by authenticated users" ON public.rides FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create their own rides" ON public.rides FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own rides" ON public.rides FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create ride_requests table
CREATE TABLE public.ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant requests" ON public.ride_requests FOR SELECT TO authenticated USING (
  passenger_id = auth.uid() OR 
  ride_id IN (SELECT id FROM public.rides WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create requests" ON public.ride_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "Ride owners can update request status" ON public.ride_requests FOR UPDATE TO authenticated USING (
  ride_id IN (SELECT id FROM public.rides WHERE user_id = auth.uid()) OR passenger_id = auth.uid()
);

-- Indexes for performance
CREATE INDEX idx_rides_date_direction ON public.rides(date, direction);
CREATE INDEX idx_ride_requests_ride_id ON public.ride_requests(ride_id);
CREATE INDEX idx_ride_requests_passenger_id ON public.ride_requests(passenger_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
