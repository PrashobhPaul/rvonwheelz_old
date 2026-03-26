ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vehicle_name text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_number text NOT NULL DEFAULT '';