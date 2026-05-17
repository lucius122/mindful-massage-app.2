# Redesign + Admin Log History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ubah tampilan app dari "AI template" ke gaya Segar & Jujur, dan tambahkan tab Riwayat Log di admin dashboard.

**Architecture:** Redesign visual di BookingPage dan AdminPage mengikuti prinsip bahasa casual/langsung, layout tidak simetris sempurna, dan copy yang lebih jujur. Log history menggunakan tabel `booking_logs` baru di Supabase dengan trigger otomatis yang merekam setiap INSERT dan perubahan status, dibaca lewat tab "Riwayat" di AdminPage.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL + RLS + Triggers), Vite, lucide-react

---

## File Map

| File | Status | Tanggung jawab |
|------|--------|----------------|
| `supabase/migrations/20260517200000_booking_logs.sql` | Buat baru | Tabel `booking_logs` + trigger otomatis |
| `src/styles.css` | Modifikasi | Hangatkan background, kurangi shadow |
| `src/pages/BookingPage.tsx` | Modifikasi | Redesign semua section |
| `src/pages/AdminPage.tsx` | Modifikasi | Redesign + tab navigasi + LogFeed component |

---

## Task 1: Database — Tabel booking_logs + Trigger

**Files:**
- Create: `supabase/migrations/20260517200000_booking_logs.sql`

- [ ] **Step 1: Buat file migration**

Buat file `supabase/migrations/20260517200000_booking_logs.sql` dengan isi:

```sql
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
```

- [ ] **Step 2: Apply migration ke Supabase local (jika pakai local dev) atau push ke remote**

Jika pakai Supabase remote, jalankan SQL di atas via Supabase Dashboard → SQL Editor.
Jika pakai local dev:
```bash
cd mindful-massage-app
npx supabase db push
```

- [ ] **Step 3: Verifikasi trigger bekerja**

Di Supabase SQL Editor, jalankan:
```sql
-- Insert test booking
INSERT INTO public.bookings (customer_name, whatsapp_number, package_name, service_type, total_price, booking_date, booking_time)
VALUES ('Test User', '08123456789', 'Pijat Capek', 'Datang ke Tempat', 75000, CURRENT_DATE, '09:00');

-- Cek log terbentuk
SELECT * FROM public.booking_logs ORDER BY created_at DESC LIMIT 5;
-- Harus ada 1 row dengan action = 'booking_baru'

-- Update status ke confirmed
UPDATE public.bookings SET status = 'confirmed' WHERE customer_name = 'Test User';

-- Cek lagi
SELECT * FROM public.booking_logs ORDER BY created_at DESC LIMIT 5;
-- Harus ada row baru dengan action = 'dikonfirmasi'

-- Cleanup
DELETE FROM public.bookings WHERE customer_name = 'Test User';
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260517200000_booking_logs.sql
git commit -m "feat: add booking_logs table with auto-trigger"
```

---

## Task 2: CSS — Hangatkan Background & Kurangi Shadow

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Update CSS variables**

Di `src/styles.css`, ubah bagian `:root` berikut (ganti nilai lama dengan yang baru):

```css
:root {
  --radius: 0.75rem;
  --background: oklch(0.982 0.008 85);
  --foreground: oklch(0.25 0.04 160);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.25 0.04 160);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.25 0.04 160);
  --primary: oklch(0.48 0.1 160);
  --primary-foreground: oklch(0.98 0.008 85);
  --secondary: oklch(0.93 0.025 90);
  --secondary-foreground: oklch(0.35 0.06 160);
  --muted: oklch(0.94 0.012 95);
  --muted-foreground: oklch(0.52 0.025 150);
  --accent: oklch(0.88 0.06 60);
  --accent-foreground: oklch(0.3 0.06 60);
  --destructive: oklch(0.58 0.2 25);
  --destructive-foreground: oklch(0.985 0 0);
  --success: oklch(0.58 0.13 150);
  --success-foreground: oklch(0.985 0 0);
  --border: oklch(0.88 0.018 100);
  --input: oklch(0.88 0.018 100);
  --ring: oklch(0.48 0.1 160);
  --gradient-spa: linear-gradient(160deg, oklch(0.96 0.018 90), oklch(0.94 0.025 160));
  --shadow-soft: 0 2px 12px -4px oklch(0.48 0.1 160 / 0.12);
}
```

- [ ] **Step 2: Jalankan dev server dan verifikasi warna berubah**

```bash
cd mindful-massage-app
npm run dev
```

Buka `http://localhost:5173`. Background seharusnya sedikit lebih krem/warm, shadow lebih subtle.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "style: warmer background, softer shadow tokens"
```

---

## Task 3: BookingPage — Hero, Header & Success Screen

**Files:**
- Modify: `src/pages/BookingPage.tsx`

- [ ] **Step 1: Update HeroSection**

Ganti fungsi `HeroSection` di `BookingPage.tsx` dengan:

```tsx
function HeroSection() {
  return (
    <section className="grid md:grid-cols-2 gap-8 items-center py-10 md:py-16">
      <div>
        <h1 className="font-display text-4xl md:text-5xl text-foreground leading-[1.1]">
          Pijat yang<br /><span className="text-primary italic">beneran enak.</span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-md leading-relaxed">
          Udah 14 tahun ngurusin punggung, bahu, sama kaki orang. Bisa datang ke tempat kami yang tenang, atau kami yang ke rumahmu.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#booking" className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
            Yuk, booking →
          </a>
          <a href="#paket" className="px-5 py-3 rounded-lg border border-border bg-card hover:border-primary/40 transition font-medium">
            Lihat paket
          </a>
        </div>
        <div className="mt-8 flex gap-8 text-sm">
          <div>
            <div className="font-display text-3xl text-foreground">14 thn</div>
            <div className="text-muted-foreground text-xs">pengalaman</div>
          </div>
          <div>
            <div className="font-display text-3xl text-foreground">2</div>
            <div className="text-muted-foreground text-xs">opsi lokasi</div>
          </div>
        </div>
      </div>
      <div className="relative">
        <img
          src={heroImage}
          alt="Terapi pijat dengan eucalyptus dan batu spa"
          width={1280}
          height={960}
          className="rounded-2xl w-full h-auto object-cover aspect-[4/3]"
        />
        <div className="hidden md:flex absolute -bottom-5 -left-5 bg-card rounded-xl px-4 py-3 items-center gap-3 border border-border">
          <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-success" />
          </div>
          <div className="text-xs">
            <div className="font-medium">Higienis &amp; Aman</div>
            <div className="text-muted-foreground">Standar profesional</div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update success screen**

Ganti blok `if (success)` (baris 87–108 di file asli) dengan:

```tsx
if (success) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-card rounded-xl p-8 text-center border border-border">
        <div className="mx-auto w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h2 className="font-display text-3xl text-foreground">Booking masuk!</h2>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          Oke, <span className="text-foreground font-medium">{name}</span>. Terapis kami akan kabarin kamu lewat WhatsApp buat konfirmasi jadwal.
        </p>
        <div className="mt-6 p-4 rounded-lg bg-muted text-left text-sm space-y-1.5">
          <div><span className="text-muted-foreground">Paket:</span> {pkg.name}</div>
          <div><span className="text-muted-foreground">Jadwal:</span> {date} • {time}</div>
          <div><span className="text-muted-foreground">Total:</span> {formatIDR(total)}</div>
        </div>
        <button
          onClick={reset}
          className="mt-6 w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
        >
          Booking lagi
        </button>
      </div>
      <Toaster />
    </div>
  );
}
```

- [ ] **Step 3: Verifikasi di browser**

Buka `http://localhost:5173`. Hero harus tampil dengan copy baru. Buka DevTools untuk cek tidak ada error.

- [ ] **Step 4: Commit**

```bash
git add src/pages/BookingPage.tsx
git commit -m "style: redesign hero and success screen — fresh & honest copy"
```

---

## Task 4: BookingPage — Packages, WhyUs, Testimonials

**Files:**
- Modify: `src/pages/BookingPage.tsx`

- [ ] **Step 1: Update PackagesSection**

Ganti fungsi `PackagesSection`:

```tsx
function PackagesSection({ packageId, setPackageId }: { packageId: PackageId; setPackageId: (id: PackageId) => void }) {
  return (
    <section id="paket" className="py-10">
      <h2 className="font-display text-3xl md:text-4xl mb-8">Pilih paketmu</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {PACKAGES.map((p, i) => {
          const Icon = [HandHeart, Baby, Flower2][i] ?? Sparkles;
          const isFeatured = p.id === "paket-ibu-bayi";
          return (
            <div
              key={p.id}
              className={`bg-card rounded-xl p-6 border-2 flex flex-col transition ${
                isFeatured ? "border-primary" : "border-border hover:border-primary/40"
              }`}
            >
              {isFeatured && (
                <span className="text-xs font-bold text-primary mb-3">✦ Terlaris</span>
              )}
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-xl">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 flex-1">{p.desc}</p>
              <div className="mt-4 flex items-end justify-between">
                <span className="font-display text-2xl text-primary">{formatIDR(p.price)}</span>
                <a
                  href="#booking"
                  onClick={() => setPackageId(p.id)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Pesan →
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update WhyUsSection**

Ganti fungsi `WhyUsSection`:

```tsx
function WhyUsSection() {
  return (
    <section className="py-10">
      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            stat: "14",
            unit: "tahun",
            desc: "Berpengalaman menangani berbagai kebutuhan — dari punggung pegal sampai pijat bayi newborn.",
          },
          {
            stat: "2",
            unit: "opsi lokasi",
            desc: "Datang ke tempat kami yang tenang, atau kami yang ke rumahmu. Biaya panggilan terjangkau.",
          },
          {
            stat: "WA",
            unit: "konfirmasi cepat",
            desc: "Jadwal fleksibel, konfirmasi langsung lewat WhatsApp. Tidak perlu download app apapun.",
          },
        ].map((f) => (
          <div key={f.stat} className="p-6 rounded-xl bg-card border border-border">
            <div className="font-display text-5xl text-primary leading-none">{f.stat}</div>
            <div className="text-xs font-semibold text-muted-foreground mt-1 mb-3 uppercase tracking-wide">
              {f.unit}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Update TestimonialsSection**

Ganti fungsi `TestimonialsSection`:

```tsx
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Ibu Rani",
      text: "Pijat bayi-nya luar biasa lembut. Si kecil langsung tidur nyenyak setelahnya. Terapisnya juga sabar banget jelasin cara pijat yang bener.",
      role: "Klien Pijat Bayi",
    },
    {
      name: "Pak Dimas",
      text: "Setelah duduk di depan laptop seharian, pijat capek ini benar-benar menyelamatkan punggung saya.",
      role: "Klien Pijat Capek",
    },
    {
      name: "Ibu Sari",
      text: "Paket ibu & bayi sangat lengkap. Terapisnya ramah dan sangat sabar.",
      role: "Klien Paket Ibu & Bayi",
    },
  ];

  return (
    <section className="py-10">
      <h2 className="font-display text-3xl md:text-4xl mb-8">Kata mereka</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <figure className="bg-card rounded-xl p-7 border border-border md:row-span-2 flex flex-col">
          <Quote className="w-7 h-7 text-primary/40" />
          <blockquote className="mt-4 font-display italic text-xl text-foreground/90 leading-relaxed flex-1">
            "{testimonials[0].text}"
          </blockquote>
          <figcaption className="mt-6 text-sm">
            <div className="font-medium">{testimonials[0].name}</div>
            <div className="text-muted-foreground text-xs mt-0.5">{testimonials[0].role}</div>
          </figcaption>
        </figure>
        {testimonials.slice(1).map((t) => (
          <figure key={t.name} className="bg-card rounded-xl p-5 border border-border">
            <blockquote className="text-sm text-foreground/90 leading-relaxed">"{t.text}"</blockquote>
            <figcaption className="mt-4 text-xs">
              <div className="font-medium">{t.name}</div>
              <div className="text-muted-foreground mt-0.5">{t.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verifikasi di browser**

Buka `http://localhost:5173`. Scroll ke bawah — packages harus ada badge "✦ Terlaris" pada Paket Ibu & Bayi. WhyUs tampil dengan angka besar. Testimonials asimetris (satu besar kiri, dua kecil kanan).

- [ ] **Step 5: Commit**

```bash
git add src/pages/BookingPage.tsx
git commit -m "style: redesign packages, why-us, testimonials sections"
```

---

## Task 5: BookingPage — Booking Form Labels & Section Header

**Files:**
- Modify: `src/pages/BookingPage.tsx`

- [ ] **Step 1: Update BookingFormSection**

Ganti fungsi `BookingFormSection` sepenuhnya:

```tsx
function BookingFormSection(props: BookingFormProps) {
  const {
    packageId, setPackageId, serviceType, setServiceType,
    name, setName, whatsapp, setWhatsapp, address, setAddress,
    date, setDate, time, setTime, takenSlots, total, submitting, submit,
  } = props;

  return (
    <section id="booking" className="pt-10">
      <h2 className="font-display text-3xl md:text-4xl mb-6">Yuk, booking sekarang</h2>
      <div className="bg-card rounded-xl p-6 md:p-8 space-y-8 max-w-3xl mx-auto border border-border">
        {/* Paket */}
        <section>
          <h3 className="font-semibold text-base mb-4">Paket apa?</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {PACKAGES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPackageId(p.id)}
                className={`text-left rounded-lg border-2 p-4 transition ${
                  packageId === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-1 min-h-8">{p.desc}</div>
                <div className="mt-3 text-primary font-semibold">{formatIDR(p.price)}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Lokasi */}
        <section>
          <h3 className="font-semibold text-base mb-4">Mau ke mana?</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { id: "tempat" as const, label: "Datang ke Tempat", sub: "Tidak ada biaya tambahan", icon: MapPin },
              { id: "rumah" as const, label: "Panggilan ke Rumah", sub: `+ ${formatIDR(SERVICE_FEE_HOME)}`, icon: Home },
            ]).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setServiceType(opt.id)}
                className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition ${
                  serviceType === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <opt.icon className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{opt.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Data */}
        <section>
          <h3 className="font-semibold text-base mb-4">Data kamu</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="Nama lengkap"
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/[^\d+]/g, ""))}
              maxLength={20}
              placeholder="Nomor WhatsApp (cth: 08123456789)"
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {serviceType === "rumah" && (
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Alamat lengkap (jalan, nomor rumah, patokan)"
              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </section>

        {/* Waktu */}
        <section>
          <h3 className="font-semibold text-base mb-4">Kapan?</h3>
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => { setDate(e.target.value); setTime(null); }}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {TIME_SLOTS.map((slot) => {
              const taken = takenSlots.includes(slot);
              const sel = time === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={taken}
                  onClick={() => setTime(slot)}
                  className={`py-2 rounded-lg text-sm font-medium transition border ${
                    taken
                      ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border line-through"
                      : sel
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </section>

        {/* Total */}
        <section className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Total</span>
            <span className="font-display text-2xl text-primary">{formatIDR(total)}</span>
          </div>
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {submitting ? "Memproses..." : "Pesan sekarang"}
          </button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Terapis akan kabarin kamu via WhatsApp untuk konfirmasi.
          </p>
        </section>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update main return — hapus gradient background, perbaiki header**

Ganti `return` utama di `BookingPage` (bagian `return (` sampai akhir fungsi):

```tsx
return (
  <div className="min-h-screen bg-background">
    <header className="px-6 pt-8 pb-4 max-w-3xl mx-auto">
      <div
        className="flex items-center gap-2 cursor-default select-none w-fit"
        onClick={handleLogoTap}
      >
        <Flower2 className="w-5 h-5 text-primary" />
        <span className="font-display text-xl text-foreground">Sentuhan Sejuk</span>
      </div>
    </header>
    <main className="max-w-5xl mx-auto px-6 pb-16">
      <HeroSection />
      <PackagesSection packageId={packageId} setPackageId={setPackageId} />
      <WhyUsSection />
      <TestimonialsSection />
      <BookingFormSection
        packageId={packageId} setPackageId={setPackageId}
        serviceType={serviceType} setServiceType={setServiceType}
        name={name} setName={setName} whatsapp={whatsapp} setWhatsapp={setWhatsapp}
        address={address} setAddress={setAddress} date={date} setDate={setDate}
        time={time} setTime={setTime} takenSlots={takenSlots}
        total={total} submitting={submitting} submit={submit}
      />
    </main>
    <Toaster />
  </div>
);
```

- [ ] **Step 3: Verifikasi full BookingPage**

Buka `http://localhost:5173`. Scroll dari atas ke bawah:
- Header: logo kecil, tidak ada gradient background
- Hero: copy casual, tidak ada badge chip di atas
- Packages: ada "✦ Terlaris"
- WhyUs: angka besar
- Testimonials: satu besar kiri, dua kecil kanan
- Form: section labels casual ("Paket apa?", "Mau ke mana?", "Data kamu", "Kapan?")
- Tidak ada error TypeScript di terminal vite

- [ ] **Step 4: Commit**

```bash
git add src/pages/BookingPage.tsx
git commit -m "style: redesign booking form labels and page structure"
```

---

## Task 6: AdminPage — Login & Header Redesign

**Files:**
- Modify: `src/pages/AdminPage.tsx`

- [ ] **Step 1: Update imports — tambahkan Flower2**

Ganti baris import di `AdminPage.tsx`:

```tsx
import { ArrowLeft, MessageCircle, Check, X, Clock, MapPin, Home as HomeIcon, LogOut, Flower2 } from "lucide-react";
```

- [ ] **Step 2: Ganti fungsi AdminLogin**

Ganti fungsi `AdminLogin`:

```tsx
function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error("Login gagal: " + error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flower2 className="w-5 h-5 text-primary" />
            <span className="font-display text-xl text-foreground">Sentuhan Sejuk</span>
          </div>
          <p className="text-muted-foreground text-sm">Masuk ke dashboard</p>
        </div>
        <div className="bg-card rounded-xl p-7 border border-border">
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="owner@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Memuat..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
```

- [ ] **Step 3: Verifikasi login page**

Buka `http://localhost:5173/admin`. Halaman login harus tampil dengan branding di atas form, bukan card terpusat.

- [ ] **Step 4: Commit**

```bash
git add src/pages/AdminPage.tsx
git commit -m "style: redesign admin login page with branding header"
```

---

## Task 7: AdminPage — Tab Navigasi + Booking Cards

**Files:**
- Modify: `src/pages/AdminPage.tsx`

- [ ] **Step 1: Update imports — tambah Flower2, hapus ArrowLeft & Link**

Ganti dua baris import di bagian atas `AdminPage.tsx`:

```tsx
// HAPUS baris ini:
// import { Link } from "react-router-dom";
// import { ArrowLeft, MessageCircle, ... } from "lucide-react";

// GANTI dengan:
import { MessageCircle, Check, X, Clock, MapPin, Home as HomeIcon, LogOut, Flower2 } from "lucide-react";
```

(Hapus `import { Link } from "react-router-dom"` sepenuhnya — tidak dipakai lagi di header baru.)

- [ ] **Step 2: Tambahkan tipe BookingLog + LogFilter dan state tab**

Tambahkan setelah definisi type `Filter` (sebelum `export default function AdminPage`):

```tsx
type BookingLog = {
  id: string;
  booking_id: string | null;
  customer_name: string;
  package_name: string;
  action: "booking_baru" | "dikonfirmasi" | "dibatalkan";
  created_at: string;
};

type LogFilter = "today" | "all";
```

Di dalam fungsi `AdminPage`, tambahkan state baru setelah `const [loading, setLoading] = useState(true);`:

```tsx
const [tab, setTab] = useState<"booking" | "riwayat">("booking");
```

- [ ] **Step 3: Tambahkan stub LogFeed agar TypeScript tidak error**

Tambahkan fungsi stub setelah `AdminLogin` (akan diganti di Task 8):

```tsx
function LogFeed() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center text-muted-foreground">
      Memuat riwayat...
    </div>
  );
}
```

- [ ] **Step 2: Ganti header dashboard**

Ganti blok `<header>` di dalam `return` `AdminPage` (yang dimulai `<header className="sticky top-0 ...">`) dengan:

```tsx
<header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
  <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Flower2 className="w-4 h-4 text-primary" />
      <span className="font-medium text-sm text-foreground">Sentuhan Sejuk</span>
    </div>
    <button
      onClick={() => supabase.auth.signOut()}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
    >
      <LogOut className="w-4 h-4" />
      Keluar
    </button>
  </div>
  <div className="max-w-3xl mx-auto px-4 pb-0 flex items-end gap-6">
    <button
      onClick={() => setTab("booking")}
      className={`pb-3 text-sm font-medium border-b-2 transition ${
        tab === "booking" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      Booking
    </button>
    <button
      onClick={() => setTab("riwayat")}
      className={`pb-3 text-sm font-medium border-b-2 transition ${
        tab === "riwayat" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      Riwayat
    </button>
  </div>
  {tab === "booking" && (
    <div className="max-w-3xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
      {(["pending", "confirmed", "cancelled", "all"] as Filter[]).map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-3 py-1 rounded-md text-xs font-medium capitalize whitespace-nowrap transition ${
            filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          {f === "all" ? "Semua" : f === "pending" ? "Menunggu" : f === "confirmed" ? "Dikonfirmasi" : "Dibatalkan"}
          {" "}({f === "all" ? bookings.length : bookings.filter((b) => b.status === f).length})
        </button>
      ))}
    </div>
  )}
</header>
```

- [ ] **Step 3: Update main content — kondisikan berdasarkan tab**

Ganti `<main>` di dalam `return` `AdminPage`:

```tsx
<main>
  {tab === "booking" ? (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-3">
      {loading ? (
        <p className="text-center text-muted-foreground py-12">Memuat...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Tidak ada booking.</p>
      ) : (
        filtered.map((b) => (
          <article key={b.id} className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium text-base">{b.customer_name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{b.whatsapp_number}</p>
              </div>
              <StatusPill status={b.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Paket</div>
                <div className="font-medium">{b.package_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="font-medium text-primary">{formatIDR(b.total_price)}</div>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Clock className="w-3.5 h-3.5" /> {b.booking_date} • {b.booking_time}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                {b.service_type.includes("Rumah") ? <HomeIcon className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                {b.service_type}
              </div>
            </div>
            {b.address && (
              <div className="mt-3 p-2.5 rounded-md bg-muted text-xs text-muted-foreground">
                <span className="text-foreground font-medium">Alamat: </span>{b.address}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={waLink(b.whatsapp_number)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-success text-success-foreground text-sm font-medium hover:opacity-90 transition"
              >
                <MessageCircle className="w-4 h-4" /> Hubungi
              </a>
              {b.status === "pending" && (
                <>
                  <button
                    onClick={() => updateStatus(b.id, "confirmed")}
                    className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
                  >
                    <Check className="w-4 h-4" /> Konfirmasi
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, "cancelled")}
                    className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition"
                  >
                    <X className="w-4 h-4" /> Batalkan
                  </button>
                </>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  ) : (
    <LogFeed />
  )}
</main>
```

- [ ] **Step 4: Verifikasi tab switching**

Buka `http://localhost:5173/admin` (login dulu). Klik tab "Riwayat" — harus tampil area kosong (LogFeed belum dibuat, akan error). Klik "Booking" — daftar booking muncul kembali. Tombol aksi sekarang bertulisan "Konfirmasi" / "Batalkan".

- [ ] **Step 5: Commit (partial — LogFeed menyusul)**

```bash
git add src/pages/AdminPage.tsx
git commit -m "style: redesign admin header with tab navigation"
```

---

## Task 8: AdminPage — LogFeed Component (Tab Riwayat)

**Files:**
- Modify: `src/pages/AdminPage.tsx`

- [ ] **Step 1: Ganti stub LogFeed dengan implementasi lengkap**

Ganti fungsi `LogFeed` yang ada (stub dari Task 7) dengan:

```tsx
function LogFeed() {
  const [logs, setLogs] = useState<BookingLog[]>([]);
  const [logFilter, setLogFilter] = useState<LogFilter>("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("booking_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (logFilter === "today") {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        query = query.gte("created_at", todayStart.toISOString());
      }

      const { data, error } = await query;
      if (!error) setLogs((data ?? []) as BookingLog[]);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel("admin-logs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "booking_logs" }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [logFilter]);

  const actionLabel: Record<BookingLog["action"], string> = {
    booking_baru: "Booking baru",
    dikonfirmasi: "Dikonfirmasi",
    dibatalkan: "Dibatalkan",
  };

  const actionStyle: Record<BookingLog["action"], string> = {
    booking_baru: "bg-blue-50 text-blue-700",
    dikonfirmasi: "bg-success/10 text-success",
    dibatalkan: "bg-destructive/10 text-destructive",
  };

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days} hari lalu`;
    if (hrs > 0) return `${hrs} jam lalu`;
    if (mins > 0) return `${mins} menit lalu`;
    return "Baru saja";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setLogFilter("today")}
          className={`px-3 py-1 rounded-md text-xs font-medium transition ${
            logFilter === "today" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          Hari ini
        </button>
        <button
          onClick={() => setLogFilter("all")}
          className={`px-3 py-1 rounded-md text-xs font-medium transition ${
            logFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          Semua
        </button>
      </div>
      {loading ? (
        <p className="text-center text-muted-foreground py-12">Memuat...</p>
      ) : logs.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {logFilter === "today" ? "Belum ada aktivitas hari ini." : "Belum ada riwayat."}
        </p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 border border-border"
            >
              <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${actionStyle[log.action]}`}>
                {actionLabel[log.action]}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{log.customer_name}</span>
                <span className="text-xs text-muted-foreground ml-2">{log.package_name}</span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {relativeTime(log.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verifikasi tab Riwayat**

Buka `http://localhost:5173/admin` dan login. Klik tab "Riwayat":
- Jika ada data di `booking_logs` → muncul daftar dengan badge warna
- Jika kosong → pesan "Belum ada aktivitas hari ini."
- Toggle "Hari ini" / "Semua" harus mengubah list
- Cek tidak ada error TypeScript di terminal

- [ ] **Step 3: Test real-time log**

Buka tab baru, buat booking di `http://localhost:5173`. Kembali ke admin `/admin`, buka tab Riwayat filter "Hari ini" — harus muncul entry baru "Booking baru" secara real-time.

- [ ] **Step 4: Commit final**

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: add Riwayat tab with real-time log feed in admin dashboard"
```

---

## Verifikasi Akhir

- [ ] `npm run build` berhasil tanpa error TypeScript
- [ ] BookingPage: tidak ada pola `uppercase tracking-widest` sebagai section label
- [ ] BookingPage: Paket Ibu & Bayi ada badge "✦ Terlaris"
- [ ] BookingPage: Testimonials layout asimetris (satu besar, dua kecil)
- [ ] AdminPage: Login punya branding Sentuhan Sejuk di atas form
- [ ] AdminPage: Tab "Booking" dan "Riwayat" berfungsi
- [ ] AdminPage: Filter pills hanya muncul di tab Booking
- [ ] AdminPage: Tombol aksi bertulisan "Konfirmasi" / "Batalkan"
- [ ] Log terbentuk otomatis saat booking baru masuk (trigger)
- [ ] Log terbentuk otomatis saat status diubah (trigger)
