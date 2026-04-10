
ALTER TABLE public.profiles
  ADD COLUMN car_name text NOT NULL DEFAULT '',
  ADD COLUMN car_registration text NOT NULL DEFAULT '',
  ADD COLUMN bike_name text NOT NULL DEFAULT '',
  ADD COLUMN bike_registration text NOT NULL DEFAULT '';
