CREATE TABLE public.booking_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  package_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('booking_baru', 'dikonfirmasi', 'dibatalkan')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX booking_logs_created_at_idx ON public.booking_logs (created_at DESC);

ALTER TABLE public.booking_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view logs"
  ON public.booking_logs FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.log_booking_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.booking_logs (booking_id, customer_name, package_name, action)
    VALUES (NEW.id, NEW.customer_name, NEW.package_name, 'booking_baru');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'confirmed' THEN
      INSERT INTO public.booking_logs (booking_id, customer_name, package_name, action)
      VALUES (NEW.id, NEW.customer_name, NEW.package_name, 'dikonfirmasi');
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.booking_logs (booking_id, customer_name, package_name, action)
      VALUES (NEW.id, NEW.customer_name, NEW.package_name, 'dibatalkan');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_log_trigger
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.log_booking_change();

-- INSERT is blocked for all clients; the SECURITY DEFINER trigger bypasses RLS.
CREATE POLICY "Trigger can insert logs"
  ON public.booking_logs FOR INSERT
  WITH CHECK (false);

COMMENT ON FUNCTION public.log_booking_change() IS 'Auto-logs booking events: booking_baru on insert, dikonfirmasi/dibatalkan on status change.';
