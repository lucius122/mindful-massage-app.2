import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PACKAGES, SERVICE_FEE_HOME, TIME_SLOTS, formatIDR, type PackageId } from "@/lib/bookings";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Flower2, CheckCircle2, MapPin, Home, Calendar as CalendarIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentuhan Sejuk — Booking Pijat Profesional" },
      { name: "description", content: "Pesan layanan pijat capek, pijat bayi, atau paket ibu & bayi. Datang ke tempat atau panggilan ke rumah." },
      { property: "og:title", content: "Sentuhan Sejuk — Booking Pijat" },
      { property: "og:description", content: "Layanan pijat profesional dengan booking online yang mudah." },
    ],
  }),
  component: BookingPage,
});

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function BookingPage() {
  const [packageId, setPackageId] = useState<PackageId>("pijat-capek");
  const [serviceType, setServiceType] = useState<"tempat" | "rumah">("tempat");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState<string | null>(null);
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const pkg = PACKAGES.find((p) => p.id === packageId)!;
  const total = useMemo(() => pkg.price + (serviceType === "rumah" ? SERVICE_FEE_HOME : 0), [pkg, serviceType]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_time,status")
        .eq("booking_date", date)
        .in("status", ["pending", "confirmed"]);
      if (!active) return;
      if (error) return;
      setTakenSlots((data ?? []).map((r) => r.booking_time));
    };
    load();

    const channel = supabase
      .channel(`bookings-${date}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [date]);

  const reset = () => {
    setName(""); setWhatsapp(""); setAddress(""); setTime(null); setSuccess(false);
  };

  const submit = async () => {
    if (!name.trim() || !whatsapp.trim()) return toast.error("Nama dan nomor WhatsApp wajib diisi");
    if (serviceType === "rumah" && !address.trim()) return toast.error("Alamat wajib diisi untuk panggilan ke rumah");
    if (!time) return toast.error("Pilih waktu booking");

    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      customer_name: name.trim(),
      whatsapp_number: whatsapp.trim(),
      address: serviceType === "rumah" ? address.trim() : null,
      package_name: pkg.name,
      service_type: serviceType === "rumah" ? "Panggilan ke Rumah" : "Datang ke Tempat",
      total_price: total,
      booking_date: date,
      booking_time: time,
      status: "pending",
    });
    setSubmitting(false);

    if (error) {
      toast.error("Gagal menyimpan booking: " + error.message);
      return;
    }
    setTakenSlots((s) => [...s, time]);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--gradient-spa)" }}>
        <div className="max-w-md w-full bg-card rounded-2xl p-8 text-center" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-9 h-9 text-success" />
          </div>
          <h2 className="font-display text-3xl text-foreground">Booking diterima</h2>
          <p className="mt-3 text-muted-foreground">
            Terima kasih, <span className="text-foreground font-medium">{name}</span>. Terapis kami akan menghubungi Anda
            melalui WhatsApp untuk konfirmasi jadwal dan alamat.
          </p>
          <div className="mt-6 p-4 rounded-lg bg-muted text-left text-sm space-y-1">
            <div><span className="text-muted-foreground">Paket:</span> {pkg.name}</div>
            <div><span className="text-muted-foreground">Jadwal:</span> {date} • {time}</div>
            <div><span className="text-muted-foreground">Total:</span> {formatIDR(total)}</div>
          </div>
          <button onClick={reset} className="mt-6 w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
            Buat Booking Lain
          </button>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-spa)" }}>
      <header className="px-6 pt-8 pb-4 max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flower2 className="w-6 h-6 text-primary" />
          <span className="font-display text-2xl text-foreground">Sentuhan Sejuk</span>
        </div>
        <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition">Admin</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 pb-16">
        <div className="text-center py-6">
          <h1 className="font-display text-4xl md:text-5xl text-foreground leading-tight">
            Tenangkan tubuh,<br />pesan dalam hitungan menit.
          </h1>
          <p className="mt-3 text-muted-foreground">Layanan pijat profesional. Datang ke tempat atau panggilan ke rumah.</p>
        </div>

        <div className="bg-card rounded-2xl p-6 md:p-8 space-y-8" style={{ boxShadow: "var(--shadow-soft)" }}>
          {/* Package */}
          <section>
            <h3 className="font-display text-xl mb-4">1. Pilih Paket</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {PACKAGES.map((p) => {
                const selected = packageId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPackageId(p.id)}
                    className={`text-left rounded-xl border-2 p-4 transition ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 min-h-8">{p.desc}</div>
                    <div className="mt-3 text-primary font-semibold">{formatIDR(p.price)}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Service type */}
          <section>
            <h3 className="font-display text-xl mb-4">2. Lokasi Layanan</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { id: "tempat" as const, label: "Datang ke Tempat", sub: "Tidak ada biaya tambahan", icon: MapPin },
                { id: "rumah" as const, label: "Panggilan ke Rumah", sub: `+ ${formatIDR(SERVICE_FEE_HOME)}`, icon: Home },
              ].map((opt) => {
                const selected = serviceType === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setServiceType(opt.id)}
                    className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  >
                    <Icon className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{opt.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Customer info */}
          <section>
            <h3 className="font-display text-xl mb-4">3. Data Anda</h3>
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

          {/* Date & Time */}
          <section>
            <h3 className="font-display text-xl mb-4">4. Tanggal & Jam</h3>
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
                const selected = time === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={taken}
                    onClick={() => setTime(slot)}
                    className={`py-2 rounded-lg text-sm font-medium transition border ${
                      taken
                        ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border line-through"
                        : selected
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

          {/* Total + submit */}
          <section className="border-t border-border pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground">Total Pembayaran</span>
              <span className="font-display text-2xl text-primary">{formatIDR(total)}</span>
            </div>
            <button
              onClick={submit}
              disabled={submitting}
              className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {submitting ? "Memproses..." : "Pesan Sekarang"}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Terapis akan menghubungi Anda via WhatsApp untuk konfirmasi.
            </p>
          </section>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
