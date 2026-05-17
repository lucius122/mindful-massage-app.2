import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PACKAGES, SERVICE_FEE_HOME, TIME_SLOTS, formatIDR, type PackageId } from "@/lib/bookings";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Flower2, CheckCircle2, MapPin, Home, Calendar as CalendarIcon, Sparkles, HandHeart, Baby, Quote, Star, ShieldCheck, Clock3 } from "lucide-react";
import heroImage from "@/assets/spa-hero.jpg";

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export default function BookingPage() {
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

  const navigate = useNavigate();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      navigate("/admin");
      return;
    }
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);
  };

  const pkg = PACKAGES.find((p) => p.id === packageId)!;
  const total = useMemo(() => pkg.price + (serviceType === "rumah" ? SERVICE_FEE_HOME : 0), [pkg, serviceType]);

  useEffect(() => { document.title = "Sentuhan Sejuk — Booking Pijat Profesional"; }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("bookings").select("booking_time,status")
        .eq("booking_date", date).in("status", ["pending", "confirmed"]);
      if (!active) return;
      if (error) return;
      setTakenSlots((data ?? []).map((r) => r.booking_time));
    };
    load();
    const channel = supabase.channel(`bookings-${date}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [date]);

  const reset = () => { setName(""); setWhatsapp(""); setAddress(""); setTime(null); setSuccess(false); };

  const submit = async () => {
    if (!name.trim() || !whatsapp.trim()) return toast.error("Nama dan nomor WhatsApp wajib diisi");
    if (serviceType === "rumah" && !address.trim()) return toast.error("Alamat wajib diisi untuk panggilan ke rumah");
    if (!time) return toast.error("Pilih waktu booking");
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      customer_name: name.trim(), whatsapp_number: whatsapp.trim(),
      address: serviceType === "rumah" ? address.trim() : null,
      package_name: pkg.name,
      service_type: serviceType === "rumah" ? "Panggilan ke Rumah" : "Datang ke Tempat",
      total_price: total, booking_date: date, booking_time: time, status: "pending",
    });
    setSubmitting(false);
    if (error) { toast.error("Gagal menyimpan booking: " + error.message); return; }
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
            Terima kasih, <span className="text-foreground font-medium">{name}</span>. Terapis kami akan menghubungi Anda melalui WhatsApp untuk konfirmasi jadwal dan alamat.
          </p>
          <div className="mt-6 p-4 rounded-lg bg-muted text-left text-sm space-y-1">
            <div><span className="text-muted-foreground">Paket:</span> {pkg.name}</div>
            <div><span className="text-muted-foreground">Jadwal:</span> {date} • {time}</div>
            <div><span className="text-muted-foreground">Total:</span> {formatIDR(total)}</div>
          </div>
          <button onClick={reset} className="mt-6 w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition">Buat Booking Lain</button>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-spa)" }}>
      <header className="px-6 pt-8 pb-4 max-w-3xl mx-auto">
        <div
          className="flex items-center gap-2 cursor-default select-none w-fit"
          onClick={handleLogoTap}
        >
          <Flower2 className="w-6 h-6 text-primary" />
          <span className="font-display text-2xl text-foreground">Sentuhan Sejuk</span>
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
}

function HeroSection() {
  return (
    <section className="grid md:grid-cols-2 gap-8 items-center py-10 md:py-16">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-card border border-border text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Terapis berpengalaman
        </span>
        <h1 className="mt-4 font-display text-4xl md:text-6xl text-foreground leading-[1.05]">
          Tenangkan tubuh,<br /><span className="text-primary italic">pulihkan harimu.</span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-md">
          Layanan pijat berpengalaman untuk Anda dan keluarga. Datang ke tempat kami yang tenang, atau biarkan kami datang ke rumah Anda.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#booking" className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition">Pesan Sekarang</a>
          <a href="#paket" className="px-5 py-3 rounded-lg border border-border bg-card hover:border-primary/40 transition font-medium">Lihat Paket</a>
        </div>
        <div className="mt-8 flex gap-6 text-sm">
          <div><div className="font-display text-2xl text-foreground">14 thn</div><div className="text-muted-foreground text-xs">Pengalaman</div></div>
        </div>
      </div>
      <div className="relative">
        <img src={heroImage} alt="Terapi pijat dengan eucalyptus dan batu spa" width={1280} height={960}
          className="rounded-3xl w-full h-auto object-cover aspect-[4/3]" style={{ boxShadow: "var(--shadow-soft)" }} />
        <div className="hidden md:flex absolute -bottom-5 -left-5 bg-card rounded-2xl px-4 py-3 items-center gap-3 border border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-success" /></div>
          <div className="text-xs"><div className="font-medium">Higienis &amp; Aman</div><div className="text-muted-foreground">Standar profesional</div></div>
        </div>
      </div>
    </section>
  );
}

function PackagesSection({ packageId, setPackageId }: { packageId: PackageId; setPackageId: (id: PackageId) => void }) {
  return (
    <section id="paket" className="py-10">
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-widest text-primary font-medium">Paket Kami</span>
        <h2 className="font-display text-3xl md:text-4xl mt-2">Pilih perawatan yang tepat</h2>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Setiap sentuhan dirancang untuk meredakan, memulihkan, dan menenangkan.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {PACKAGES.map((p, i) => {
          const Icon = [HandHeart, Baby, Flower2][i] ?? Sparkles;
          return (
            <div key={p.id} className="bg-card rounded-2xl p-6 border border-border hover:border-primary/40 transition flex flex-col" style={{ boxShadow: "var(--shadow-soft)" }}>
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><Icon className="w-5 h-5 text-primary" /></div>
              <h3 className="font-display text-xl">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 flex-1">{p.desc}</p>
              <div className="mt-4 flex items-end justify-between">
                <span className="font-display text-2xl text-primary">{formatIDR(p.price)}</span>
                <a href="#booking" onClick={() => setPackageId(p.id)} className="text-sm font-medium text-primary hover:underline">Pesan →</a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WhyUsSection() {
  return (
    <section className="py-10">
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: ShieldCheck, title: "Terapis Berpengalaman", desc: "Berpengalaman menangani berbagai kebutuhan." },
          { icon: Home, title: "Bisa ke Rumah", desc: "Nikmati pijat tanpa perlu keluar rumah, dengan biaya terjangkau." },
          { icon: Clock3, title: "Jadwal Fleksibel", desc: "Pilih waktu sesuai keinginan, konfirmasi cepat via WhatsApp." },
        ].map((f) => (
          <div key={f.title} className="p-5 rounded-xl bg-card/60 backdrop-blur border border-border">
            <f.icon className="w-6 h-6 text-primary" />
            <h3 className="font-medium mt-3">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-10">
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-widest text-primary font-medium">Cerita Klien</span>
        <h2 className="font-display text-3xl md:text-4xl mt-2">Apa kata mereka</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { name: "Ibu Rani", text: "Pijat bayi-nya luar biasa lembut. Si kecil langsung tidur nyenyak setelahnya.", role: "Klien Pijat Bayi" },
          { name: "Pak Dimas", text: "Setelah duduk di depan laptop seharian, pijat capek ini benar-benar menyelamatkan punggung saya.", role: "Klien Pijat Capek" },
          { name: "Ibu Sari", text: "Paket ibu & bayi sangat lengkap. Terapisnya ramah dan sangat sabar.", role: "Klien Paket Ibu & Bayi" },
        ].map((t) => (
          <figure key={t.name} className="bg-card rounded-2xl p-6 border border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
            <Quote className="w-6 h-6 text-accent" />
            <blockquote className="mt-3 text-sm text-foreground/90 leading-relaxed">"{t.text}"</blockquote>
            <figcaption className="mt-4 text-xs">
              <div className="font-medium">{t.name}</div>
              <div className="text-muted-foreground">{t.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

type BookingFormProps = {
  packageId: PackageId; setPackageId: (id: PackageId) => void;
  serviceType: "tempat" | "rumah"; setServiceType: (v: "tempat" | "rumah") => void;
  name: string; setName: (v: string) => void;
  whatsapp: string; setWhatsapp: (v: string) => void;
  address: string; setAddress: (v: string) => void;
  date: string; setDate: (v: string) => void;
  time: string | null; setTime: (v: string | null) => void;
  takenSlots: string[]; total: number; submitting: boolean; submit: () => void;
};

function BookingFormSection(props: BookingFormProps) {
  const { packageId, setPackageId, serviceType, setServiceType, name, setName, whatsapp, setWhatsapp, address, setAddress, date, setDate, time, setTime, takenSlots, total, submitting, submit } = props;
  return (
    <section id="booking" className="pt-10">
      <div className="text-center mb-6">
        <span className="text-xs uppercase tracking-widest text-primary font-medium">Booking</span>
        <h2 className="font-display text-3xl md:text-4xl mt-2">Mulai pesanan Anda</h2>
        <p className="text-muted-foreground mt-2">Hanya butuh 1 menit untuk menyelesaikan booking.</p>
      </div>
      <div className="bg-card rounded-2xl p-6 md:p-8 space-y-8 max-w-3xl mx-auto" style={{ boxShadow: "var(--shadow-soft)" }}>
        {/* 1. Pilih Paket */}
        <section>
          <h3 className="font-display text-xl mb-4">1. Pilih Paket</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {PACKAGES.map((p) => (
              <button key={p.id} type="button" onClick={() => setPackageId(p.id)}
                className={`text-left rounded-xl border-2 p-4 transition ${packageId === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-1 min-h-8">{p.desc}</div>
                <div className="mt-3 text-primary font-semibold">{formatIDR(p.price)}</div>
              </button>
            ))}
          </div>
        </section>
        {/* 2. Lokasi */}
        <section>
          <h3 className="font-display text-xl mb-4">2. Lokasi Layanan</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { id: "tempat" as const, label: "Datang ke Tempat", sub: "Tidak ada biaya tambahan", icon: MapPin },
              { id: "rumah" as const, label: "Panggilan ke Rumah", sub: `+ ${formatIDR(SERVICE_FEE_HOME)}`, icon: Home },
            ]).map((opt) => (
              <button key={opt.id} type="button" onClick={() => setServiceType(opt.id)}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${serviceType === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <opt.icon className="w-5 h-5 text-primary mt-0.5" />
                <div><div className="font-medium">{opt.label}</div><div className="text-xs text-muted-foreground mt-1">{opt.sub}</div></div>
              </button>
            ))}
          </div>
        </section>
        {/* 3. Data */}
        <section>
          <h3 className="font-display text-xl mb-4">3. Data Anda</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Nama lengkap"
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/[^\d+]/g, ""))} maxLength={20} placeholder="Nomor WhatsApp (cth: 08123456789)"
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {serviceType === "rumah" && (
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} rows={3} placeholder="Alamat lengkap (jalan, nomor rumah, patokan)"
              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          )}
        </section>
        {/* 4. Waktu */}
        <section>
          <h3 className="font-display text-xl mb-4">4. Tanggal &amp; Jam</h3>
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <input type="date" value={date} min={todayISO()} onChange={(e) => { setDate(e.target.value); setTime(null); }}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {TIME_SLOTS.map((slot) => {
              const taken = takenSlots.includes(slot);
              const sel = time === slot;
              return (
                <button key={slot} type="button" disabled={taken} onClick={() => setTime(slot)}
                  className={`py-2 rounded-lg text-sm font-medium transition border ${taken ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border line-through" : sel ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary"}`}>
                  {slot}
                </button>
              );
            })}
          </div>
        </section>
        {/* Total */}
        <section className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Total Pembayaran</span>
            <span className="font-display text-2xl text-primary">{formatIDR(total)}</span>
          </div>
          <button onClick={submit} disabled={submitting}
            className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-60">
            {submitting ? "Memproses..." : "Pesan Sekarang"}
          </button>
          <p className="text-xs text-muted-foreground text-center mt-3">Terapis akan menghubungi Anda via WhatsApp untuk konfirmasi.</p>
        </section>
      </div>
    </section>
  );
}
