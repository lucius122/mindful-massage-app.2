-- ============================================================
-- INSERT JADWAL BOOKING: 25 Mei – 8 Juni 2026
-- Semua data = Pijat Capek (dewasa, bukan bayi)
-- "(Datang ke rumah)" = Datang ke Tempat → Rp50.000
-- Ada alamat           = Panggilan ke Rumah → Rp65.000
-- Perum Kayon Asri     = Datang ke Tempat → Rp50.000 (rumah terapis)
-- Status: confirmed
-- ============================================================

-- =====================
-- 📅 SENIN, 25 Mei 2026
-- =====================
INSERT INTO bookings (customer_name, whatsapp_number, address, package_name, service_type, total_price, booking_date, booking_time, status)
VALUES
  ('Mbak Yuyun',  '628132826637',  'Pucang Asri No. 45',  'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-25', '10:00', 'confirmed'),
  ('Hesti Maharani', '6289584302081', 'Pucang Permai',       'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-25', '16:00', 'confirmed'),
  ('Bu Sarjono',  '6281225029958', 'Pucang Asri RT 5',    'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-25', '20:00', 'confirmed');

-- =====================
-- 📅 SELASA, 26 Mei 2026
-- =====================
INSERT INTO bookings (customer_name, whatsapp_number, address, package_name, service_type, total_price, booking_date, booking_time, status)
VALUES
  ('Bu Sigit',    '6285217185707', NULL, 'Pijat Capek', 'Datang ke Tempat', 50000, '2026-05-26', '09:00', 'confirmed'),
  ('Mami Dami',   '6289697528989', 'Perum Kebon Agung',             'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-26', '16:00', 'confirmed'),
  ('Bu Harti',    '6282136531699', NULL,                             'Pijat Capek', 'Datang ke Tempat',   50000, '2026-05-26', '19:00', 'confirmed');

-- =====================
-- 📅 RABU, 27 Mei 2026
-- 🛑 LIBUR (Idul Adha)
-- =====================

-- =====================
-- 📅 KAMIS, 28 Mei 2026
-- =====================
INSERT INTO bookings (customer_name, whatsapp_number, address, package_name, service_type, total_price, booking_date, booking_time, status)
VALUES
  ('Mbak Efin',   '6289535948676', 'Kebon Agung',  'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-28', '10:00', 'confirmed'),
  ('Dwi Yani',    '6285865120086', NULL,            'Pijat Capek', 'Datang ke Tempat',   50000, '2026-05-28', '11:00', 'confirmed');

-- =====================
-- 📅 JUMAT, 29 Mei 2026
-- 🛑 LIBUR
-- =====================

-- =====================
-- 📅 SABTU, 30 Mei 2026
-- =====================
INSERT INTO bookings (customer_name, whatsapp_number, address, package_name, service_type, total_price, booking_date, booking_time, status)
VALUES
  ('Bu Munir',    '6282135306919', 'Perum Pucang Asri Gg. 6',    'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-30', '09:00', 'confirmed'),
  ('Bu Yoko',     '6289854188688', 'Pucang Asri Gg. 8',          'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-30', '16:00', 'confirmed'),
  ('Vadia',       '6289532826550', 'Perum Pucang Anom Gg. 7',    'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-30', '19:00', 'confirmed');

-- =====================
-- 📅 MINGGU, 31 Mei 2026
-- =====================
INSERT INTO bookings (customer_name, whatsapp_number, address, package_name, service_type, total_price, booking_date, booking_time, status)
VALUES
  ('Bu Windya',   '6289896291577', 'Perum Pucang Asri Gg. 8 No. 2',    'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-31', '08:00', 'confirmed'),
  ('Mbak Akifa',  '6289668128194', 'Perum Sutan Residen',               'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-31', '09:00', 'confirmed'),
  ('Mbak Rena',   '6282221878626', 'Perum Pucang Asri',                 'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-31', '11:00', 'confirmed'),
  ('Bu Tri',      '6281328605112', 'Perum Pucang Asri Gg. 12',          'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-31', '12:00', 'confirmed'),
  ('Bu Padi',     '6281229733796', 'Perum Pucang Gede Raya',            'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-31', '13:00', 'confirmed'),
  ('Bu Dodok',    '6289538009981', NULL,     'Pijat Capek', 'Datang ke Tempat', 50000, '2026-05-31', '16:00', 'confirmed'),
  ('Mbak Herlin', '6281225732127', NULL,      'Pijat Capek', 'Datang ke Tempat', 50000, '2026-05-31', '19:00', 'confirmed'),
  ('Bu Musran',   '6282138571126', 'Perum Pucang Asri Gg. 12 RW 12 RT 4', 'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-05-31', '20:00', 'confirmed');

-- =====================
-- 📅 SENIN, 1 Juni 2026
-- (Tidak ada jadwal)
-- =====================

-- =====================
-- 📅 SELASA, 2 Juni 2026
-- =====================
INSERT INTO bookings (customer_name, whatsapp_number, address, package_name, service_type, total_price, booking_date, booking_time, status)
VALUES
  ('Bu Dibyo',    '6285862827810', 'Pucang Peni Raya No. 8',      'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-02', '09:00', 'confirmed'),
  ('Mbak Eka',    '6285255679804', 'Perum Batursari',              'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-02', '12:30', 'confirmed'),
  ('Mbak Tina',   '6285747975663', 'Perum Ivory Blok H No. 10',   'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-02', '16:00', 'confirmed');

-- =====================
-- 📅 RABU, 3 Juni 2026
-- =====================
INSERT INTO bookings (customer_name, whatsapp_number, address, package_name, service_type, total_price, booking_date, booking_time, status)
VALUES
  ('Bu Teguh',     '6281228269966', 'Perum Pucang Gading',    'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-03', '09:00', 'confirmed'),
  ('Bu Abidilah',  '6288215123418', 'Kayon Gg. 7',            'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-03', '11:00', 'confirmed'),
  ('Mbak Ayuni',   '6281230837002', NULL,                      'Pijat Capek', 'Datang ke Tempat',   50000, '2026-06-03', '18:30', 'confirmed'),
  ('Mbak Selvina', '6289535948676', 'Perum Kebon Agung',       'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-03', '20:00', 'confirmed');

-- =====================
-- 📅 KAMIS, 4 Juni 2026
-- =====================
INSERT INTO bookings (customer_name, whatsapp_number, address, package_name, service_type, total_price, booking_date, booking_time, status)
VALUES
  ('Bu Diro',      '628387554',     'Pucang Adi Gg. 7',  'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-04', '08:00', 'confirmed');

-- =====================
-- 📅 JUMAT, 5 Juni 2026
-- 🛑 LIBUR
-- =====================

-- =====================
-- 📅 SABTU, 6 Juni 2026
-- =====================
INSERT INTO bookings (customer_name, whatsapp_number, address, package_name, service_type, total_price, booking_date, booking_time, status)
VALUES
  ('Mbak Rena',    '6282221872626', 'Perum Pucang Asri Gg. 13 No. 1', 'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-06', '09:00', 'confirmed'),
  ('Bu Tutik',     '6282221878626', 'Pucang Jajar Raya No. 7',        'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-06', '16:00', 'confirmed'),
  ('Bu Dodok',     '6280538009981', NULL,          'Pijat Capek', 'Datang ke Tempat', 50000, '2026-06-06', '18:00', 'confirmed');

-- =====================
-- 📅 MINGGU, 7 Juni 2026
-- =====================
INSERT INTO bookings (customer_name, whatsapp_number, address, package_name, service_type, total_price, booking_date, booking_time, status)
VALUES
  ('Bu Shofian',   '6281390495511', 'Perum Pucang Asri Gg. 8',   'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-07', '09:00', 'confirmed'),
  ('Dik Rasdan',   '6285228009312', 'Perum Pucang Asri No. 13',  'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-07', '16:00', 'confirmed'),
  ('Bu Yaroh',     '6281328779696', 'Perum Pucang Asri Gg. 4',   'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-07', '18:00', 'confirmed');

-- =====================
-- 📅 SENIN, 8 Juni 2026
-- =====================
INSERT INTO bookings (customer_name, whatsapp_number, address, package_name, service_type, total_price, booking_date, booking_time, status)
VALUES
  ('Bu Toni Hasibuan', '6285654237704', NULL,          'Pijat Capek', 'Datang ke Tempat', 50000, '2026-06-08', '08:00', 'confirmed'),
  ('Bu Dwi',           '6281933181899', 'Pucang Asri No. 5',               'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-08', '10:00', 'confirmed'),
  ('Bu Hari',          '6287825645231', 'Perum Pucang Asri Gg. 6',          'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-08', '11:00', 'confirmed'),
  ('Mbak Ayu',         '6289647575333', 'Perum Kebon Agung',                'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-08', '16:00', 'confirmed'),
  ('Mbak Ika',         '6281333779971', 'Perum Batur Sari Indah No. 1',     'Pijat Capek', 'Panggilan ke Rumah', 65000, '2026-06-08', '18:00', 'confirmed');

-- ============================================================
-- Verifikasi: cek semua data yang baru dimasukkan
-- ============================================================
SELECT booking_date, booking_time, customer_name, service_type, total_price, status
FROM bookings
WHERE booking_date BETWEEN '2026-05-25' AND '2026-06-08'
ORDER BY booking_date, booking_time;
