
-- Ride completion log for persistent stats (survives ride deletion)
CREATE TABLE public.ride_completion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  ride_date date NOT NULL,
  destination text,
  direction text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ride_completion_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all completion logs"
  ON public.ride_completion_log FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "System can insert completion logs"
  ON public.ride_completion_log FOR INSERT
  TO authenticated WITH CHECK (true);

-- Trigger: before deleting a ride, log completions if ride date/time has passed
CREATE OR REPLACE FUNCTION public.log_ride_completions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.date < CURRENT_DATE OR (OLD.date = CURRENT_DATE AND OLD.time::time < CURRENT_TIME) THEN
    INSERT INTO ride_completion_log (user_id, role, ride_date, destination, direction)
    VALUES (OLD.user_id, 'driver', OLD.date, OLD.destination, OLD.direction);

    INSERT INTO ride_completion_log (user_id, role, ride_date, destination, direction)
    SELECT passenger_id, 'passenger', OLD.date, OLD.destination, OLD.direction
    FROM ride_requests
    WHERE ride_id = OLD.id AND status = 'approved';
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER before_ride_delete_log
  BEFORE DELETE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ride_completions();

-- Enable realtime on ride_completion_log is not needed, just on rides for DELETE
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_completion_log;
