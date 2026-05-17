# Redesign + Admin Log History — Sentuhan Sejuk

**Date:** 2026-05-17  
**Status:** Approved

---

## Goal

Ubah tampilan aplikasi agar tidak terkesan AI-template. Gunakan gaya "Segar & Jujur" — bahasa santai, layout tidak simetris sempurna, terasa seperti bisnis nyata yang dikelola manusia. Tambahkan fitur log history untuk admin.

---

## 1. BookingPage Redesign

### Prinsip desain
- Tidak ada lagi pola `text-xs uppercase tracking-widest` sebagai label section — terlalu template
- Hapus numbering step "1. Pilih Paket / 2. Lokasi / 3. Data" — ganti label casual
- Copy lebih jujur dan langsung: *"Pijat yang beneran enak."* bukan *"Tenangkan tubuh, pulihkan harimu."*
- Tiga kolom identik dihindari — selalu ada variasi ukuran/berat

### Warna & tipografi
- Pertahankan palet hijau, tapi `--background` dihangatkan sedikit ke arah krem
- Hilangkan transisi warna yang terlalu "polished" — lebih flat dan kontras
- `--shadow-soft` dikurangi — shadow terlalu template
- Font display (Playfair) tetap dipakai untuk heading utama saja, bukan setiap section title

### Hero section
- Copy utama: *"Pijat yang beneran enak."* (bold, besar)
- Subtext: *"Udah 14 tahun urus punggung, bahu, sama kaki orang. Bisa datang ke tempat, bisa ke rumahmu."*
- Tidak ada badge chip "Terapis berpengalaman" yang terlalu template
- Stat "14 thn" tetap ada tapi embedded di teks, bukan standalone counter card
- CTA dua tombol: "Yuk, booking →" (primary) dan "Lihat paket" (secondary)

### Packages section
- Hapus label "Paket Kami" + subtitle panjang
- Judul section langsung: *"Pilih paketmu"*
- Paket Ibu & Bayi ditandai sebagai "Terlaris" dengan visual berbeda (border lebih tebal / background accent)
- Dua paket lain tetap equal tapi lebih compact

### WhyUs section
- Bukan 3 icon-grid identik
- Layout horizontal dengan angka/fakta besar sebagai elemen visual:
  - `14` → *tahun pengalaman*
  - `2` → *opsi lokasi (tempat / rumah)*
  - `WA` → *konfirmasi cepat*
- Tidak ada icon, pakai angka sebagai focal point

### Testimonials section
- Hapus label "Cerita Klien" yang generik
- Judul: *"Kata mereka"*
- Layout: satu quote besar (spanning 2 kolom pada desktop), dua quote kecil di bawah/samping
- Tidak semua kartu sama ukuran

### Booking form section
- Hapus header "Mulai pesanan Anda" + subtitle panjang
- Label step diubah ke bahasa casual:
  - "Paket apa?" (bukan "1. Pilih Paket")
  - "Mau ke mana?" (bukan "2. Lokasi Layanan")
  - "Data kamu" (bukan "3. Data Anda")
  - "Kapan?" (bukan "4. Tanggal & Jam")

---

## 2. AdminPage Redesign

### Login page
- Bukan card terpusat generic
- Layout: area branding kecil di atas (logo + nama bisnis), form di bawah
- Copy login lebih personal: *"Masuk ke dashboard"* bukan hanya *"Masuk"*

### Dashboard header
- Greeting sederhana: nama bisnis + "Selamat datang"
- Filter pill pakai `rounded-md` bukan `rounded-full` — lebih natural, kurang "polished app"

### Tab navigasi
Dua tab di bawah header:
1. **Booking** — daftar booking aktif (existing behavior)
2. **Riwayat** — log semua aktivitas

### Booking cards
- Tampilan tetap sama secara fungsional
- Hapus `rounded-xl` yang terlalu clean — pakai `rounded-lg`
- Tombol aksi lebih direct: "Konfirmasi" / "Batalkan" (bukan "Setujui" / "Batal")

---

## 3. Admin Log History

### Tabel database: `booking_logs`

```sql
CREATE TABLE public.booking_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  package_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('booking_baru', 'dikonfirmasi', 'dibatalkan')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Trigger otomatis

- **INSERT** pada `bookings` → insert log dengan `action = 'booking_baru'`
- **UPDATE** pada `bookings` WHERE `status` berubah ke `confirmed` → insert log `action = 'dikonfirmasi'`
- **UPDATE** pada `bookings` WHERE `status` berubah ke `cancelled` → insert log `action = 'dibatalkan'`

RLS: SELECT diizinkan untuk semua (admin butuh baca); INSERT hanya via trigger (service role).

### Tampilan tab Riwayat

- Diurutkan terbaru di atas (`ORDER BY created_at DESC`)
- Filter toggle: "Hari ini" / "Semua"
- Setiap baris: badge aksi (warna hijau/merah/biru) + nama pelanggan + paket + waktu relatif ("2 jam lalu")
- Load 50 entry terbaru, ada tombol "Muat lebih banyak"
- Real-time: subscribe ke channel `booking_logs` sama seperti `bookings`

---

## File yang diubah

| File | Perubahan |
|------|-----------|
| `src/styles.css` | Sesuaikan warna background lebih warm, kurangi shadow |
| `src/pages/BookingPage.tsx` | Redesign semua section sesuai prinsip Segar & Jujur |
| `src/pages/AdminPage.tsx` | Redesign + tambah tab Riwayat + komponen LogFeed |
| `supabase/migrations/NEW.sql` | Tabel `booking_logs` + trigger |

---

## Out of scope

- Dark mode (tidak diubah)
- Logika booking (tidak diubah)
- Auth flow (tidak diubah)
- Mobile-specific breakpoints baru (tetap responsive, tidak ada breakpoint baru)
