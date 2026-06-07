-- ============================================================
-- UPDATE HARGA SEMUA BOOKING (termasuk yang sudah dikonfirmasi)
-- Pijat Capek: 75.000 → 50.000
-- Pijat Bayi:  50.000 → 35.000
-- Biaya panggilan rumah tetap +15.000
-- ============================================================

-- 1. Update Pijat Capek — Datang ke Tempat (75.000 → 50.000)
UPDATE bookings
SET total_price = 50000
WHERE package_name = 'Pijat Capek'
  AND service_type = 'Datang ke Tempat'
  AND total_price = 75000;

-- 2. Update Pijat Capek — Panggilan ke Rumah (90.000 → 65.000)
UPDATE bookings
SET total_price = 65000
WHERE package_name = 'Pijat Capek'
  AND service_type = 'Panggilan ke Rumah'
  AND total_price = 90000;

-- 3. Update Pijat Bayi — Datang ke Tempat (50.000 → 35.000)
UPDATE bookings
SET total_price = 35000
WHERE package_name = 'Pijat Bayi'
  AND service_type = 'Datang ke Tempat'
  AND total_price = 50000;

-- 4. Update Pijat Bayi — Panggilan ke Rumah (65.000 → 50.000)
UPDATE bookings
SET total_price = 50000
WHERE package_name = 'Pijat Bayi'
  AND service_type = 'Panggilan ke Rumah'
  AND total_price = 65000;

-- Cek hasil update
SELECT id, customer_name, package_name, service_type, total_price, status
FROM bookings
WHERE package_name IN ('Pijat Capek', 'Pijat Bayi')
ORDER BY created_at DESC;
