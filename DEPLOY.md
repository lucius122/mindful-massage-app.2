# Deploy Pijat Bunda WIN

Panduan lengkap untuk deploy app ini dengan Supabase project sendiri (bukan bawaan Lovable).

---

## 1. Buat Project Supabase Baru

1. Buka [supabase.com](https://supabase.com) dan login / daftar (gratis)
2. Klik **New Project**
3. Isi:
   - **Name**: `pijat-bunda-win`
   - **Database Password**: (catat, simpan aman)
   - **Region**: pilih yang paling dekat (misal: Singapore)
4. Tunggu sampai project selesai dibuat (~1 menit)

## 2. Jalankan SQL Setup

1. Di dashboard Supabase, buka **SQL Editor** (menu kiri)
2. Klik **New Query**
3. Buka file `supabase/setup.sql` dari project ini
4. Copy **seluruh isi** file tersebut, paste ke SQL Editor
5. Klik **Run** (atau Ctrl+Enter)
6. Pastikan tidak ada error

## 3. Ambil URL dan API Key

1. Di dashboard Supabase, buka **Settings** → **API**
2. Catat:
   - **Project URL** → contoh: `https://abcdefghijk.supabase.co`
   - **anon public key** → string panjang yang dimulai `eyJ...`

## 4. Update File .env

Buka file `.env` di root project, ganti isinya:

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ_YOUR_ANON_KEY_HERE"
```

> **Penting**: Jangan pakai key `service_role`, selalu pakai `anon` key untuk frontend.

## 5. Buat Akun Admin

Admin dashboard (`/admin`) memerlukan login. Buat user admin:

1. Di dashboard Supabase, buka **Authentication** → **Users**
2. Klik **Add User** → **Create New User**
3. Isi email dan password untuk admin
4. Klik **Create User**
5. Sekarang bisa login di halaman `/admin` dengan email dan password tersebut

## 6. Aktifkan Realtime

Agar booking muncul secara real-time di halaman admin:

1. Di dashboard Supabase, buka **Database** → **Replication**
2. Klik **supabase_realtime** di bagian Publications
3. Centang tabel **bookings** dan **booking_logs**
4. Klik **Save**

## 7. Deploy ke Vercel (Gratis)

1. Push code ke GitHub repository
2. Buka [vercel.com](https://vercel.com) dan login
3. Klik **Add New** → **Project**
4. Import repository dari GitHub
5. Di bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL` = URL Supabase kamu
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = anon key kamu
6. Klik **Deploy**

### Alternatif: Netlify

1. Push code ke GitHub
2. Buka [netlify.com](https://netlify.com)
3. **Add new site** → **Import an existing project**
4. Pilih repository, set:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Tambahkan environment variables (sama seperti Vercel)
6. Klik **Deploy site**

---

## Struktur File

```
├── .env                  ← URL & key Supabase
├── index.html
├── package.json
├── vite.config.ts
├── supabase/
│   ├── setup.sql         ← SQL untuk setup database baru
│   └── migrations/       ← file migration asli (referensi)
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── styles.css
    ├── components/ui/sonner.tsx
    ├── integrations/supabase/
    │   ├── client.ts
    │   └── types.ts
    ├── lib/bookings.ts
    └── pages/
        ├── BookingPage.tsx
        ├── AdminPage.tsx
        └── NotFoundPage.tsx
```
