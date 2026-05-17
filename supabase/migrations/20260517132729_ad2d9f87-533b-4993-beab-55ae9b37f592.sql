
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  address TEXT,
  package_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  total_price INTEGER NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bookings_date_status_idx ON public.bookings (booking_date, status);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bookings"
  ON public.bookings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update bookings"
  ON public.bookings FOR UPDATE
  USING (true);
