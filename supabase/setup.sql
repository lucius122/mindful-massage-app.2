-- ============================================================
-- Pijat Bunda WIN — Setup Database
-- Jalankan SQL ini di Supabase SQL Editor untuk membuat semua
-- tabel, enum, index, RLS, trigger, dan fungsi yang diperlukan.
-- ============================================================

-- 1. Enum status booking
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- 2. Tabel bookings
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

-- 3. RLS untuk bookings
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

-- 4. Tabel booking_logs (riwayat aktivitas)
CREATE TABLE public.booking_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  package_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('booking_baru', 'dikonfirmasi', 'dibatalkan')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX booking_logs_created_at_idx ON public.booking_logs (created_at DESC);

-- 5. RLS untuk booking_logs
ALTER TABLE public.booking_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view logs"
  ON public.booking_logs FOR SELECT
  USING (true);

-- INSERT diblokir untuk client; trigger SECURITY DEFINER yang insert
CREATE POLICY "Trigger can insert logs"
  ON public.booking_logs FOR INSERT
  WITH CHECK (false);

-- 6. Trigger auto-log perubahan booking
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
