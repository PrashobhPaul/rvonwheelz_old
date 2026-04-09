
CREATE OR REPLACE FUNCTION public.log_pending_completions(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log driver completions for past rides with at least one approved passenger
  INSERT INTO ride_completion_log (user_id, role, ride_date, destination, direction)
  SELECT r.user_id, 'driver', r.date, r.destination, r.direction
  FROM rides r
  WHERE r.user_id = _user_id
    AND (r.date < CURRENT_DATE OR (r.date = CURRENT_DATE AND r.time::time < CURRENT_TIME))
    AND EXISTS (
      SELECT 1 FROM ride_requests rr
      WHERE rr.ride_id = r.id AND rr.status = 'approved'
    )
    AND NOT EXISTS (
      SELECT 1 FROM ride_completion_log cl
      WHERE cl.user_id = r.user_id AND cl.role = 'driver' AND cl.ride_date = r.date
        AND cl.destination IS NOT DISTINCT FROM r.destination
        AND cl.direction IS NOT DISTINCT FROM r.direction
    );

  -- Log passenger completions for past approved rides
  INSERT INTO ride_completion_log (user_id, role, ride_date, destination, direction)
  SELECT rr.passenger_id, 'passenger', r.date, r.destination, r.direction
  FROM ride_requests rr
  JOIN rides r ON r.id = rr.ride_id
  WHERE rr.passenger_id = _user_id
    AND rr.status = 'approved'
    AND (r.date < CURRENT_DATE OR (r.date = CURRENT_DATE AND r.time::time < CURRENT_TIME))
    AND NOT EXISTS (
      SELECT 1 FROM ride_completion_log cl
      WHERE cl.user_id = rr.passenger_id AND cl.role = 'passenger' AND cl.ride_date = r.date
        AND cl.destination IS NOT DISTINCT FROM r.destination
        AND cl.direction IS NOT DISTINCT FROM r.direction
    );
END;
$$;
