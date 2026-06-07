import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PACKAGES, SERVICE_FEE_HOME, getAvailableTimeSlots, calculateMonthlyDates, formatIDR, type PackageId } from "@/lib/bookings";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { CheckCircle2, MapPin, Home, Calendar as CalendarIcon, Clock } from "lucide-react";

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
  const [day1, setDay1] = useState<number>(1);
  const [day2, setDay2] = useState<number>(4);
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

  useEffect(() => { document.title = "Pijat Bunda WIN — Booking"; }, []);

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
    
    const submitTime = time;
    
    if (!submitTime) return toast.error("Pilih waktu booking");

    setSubmitting(true);

    let bookingsToInsert: any[] = [];
    const baseAddress = serviceType === "rumah" ? address.trim() : null;
    const baseServiceType = serviceType === "rumah" ? "Panggilan ke Rumah" : "Datang ke Tempat";

    if (packageId === "paket-ibu-bayi") {
      const dates = calculateMonthlyDates(date, day1, day2);
      bookingsToInsert = dates.map((d, i) => ({
        customer_name: name.trim(),
        whatsapp_number: whatsapp.trim(),
        address: baseAddress,
        package_name: `${pkg.name} (Kunjungan ${i + 1}/8)`,
        service_type: baseServiceType,
        total_price: i === 0 ? total : 0,
        booking_date: d,
        booking_time: submitTime,
        status: "pending",
      }));
    } else {
      bookingsToInsert = [{
        customer_name: name.trim(),
        whatsapp_number: whatsapp.trim(),
        address: baseAddress,
        package_name: pkg.name,
        service_type: baseServiceType,
        total_price: total,
        booking_date: date,
        booking_time: submitTime,
        status: "pending",
      }];
    }

    const { error } = await supabase.from("bookings").insert(bookingsToInsert);
    
    setSubmitting(false);
    if (error) { toast.error("Gagal menyimpan booking: " + error.message); return; }
    
    if (packageId !== "paket-ibu-bayi" && date === bookingsToInsert[0].booking_date) {
        setTakenSlots((s) => [...s, submitTime!]);
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-card rounded-xl p-8 text-center border border-border">
          <div className="mx-auto w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="font-semibold text-2xl text-foreground">Booking berhasil dikirim</h2>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
            Terima kasih, <span className="text-foreground font-medium">{name}</span>. Terapis kami akan menghubungi Anda lewat WhatsApp untuk konfirmasi jadwal.
          </p>
          <div className="mt-6 p-4 rounded-lg bg-muted text-left text-sm space-y-1.5">
            <div><span className="text-muted-foreground">Paket:</span> {pkg.name}</div>
            <div><span className="text-muted-foreground">Jadwal:</span> {packageId === "paket-ibu-bayi" ? `Mulai ${date} • ${time} (8 Kunjungan)` : `${date} • ${time}`}</div>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header — logo di kiri */}
      <header className="px-5 py-4 max-w-3xl mx-auto">
        <span
          className="font-semibold text-lg text-foreground cursor-default select-none"
          onClick={handleLogoTap}
        >
          Pijat Bunda WIN
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-5 pb-16">
        {/* Hero — text only, ringkas */}
        <section className="py-8 border-b border-border">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <MapPin className="w-3 h-3" />
            Melayani area Semarang Timur, Batursari &amp; sekitarnya
          </div>
          <h1 className="font-bold text-3xl md:text-4xl text-foreground leading-tight">
            Layanan pijat khusus<br />perempuan &amp; bayi
          </h1>
          <p className="mt-3 text-muted-foreground max-w-lg leading-relaxed">
            Berpengalaman 14 tahun melayani pijat untuk ibu dan bayi. Bisa datang ke tempat kami di Batursari, Mranggen, atau kami yang ke rumah Anda.
          </p>
          <a
            href="#booking"
            className="inline-block mt-5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition"
          >
            Booking sekarang
          </a>
        </section>

        {/* Paket */}
        <section id="paket" className="py-8 border-b border-border">
          <h2 className="font-semibold text-xl mb-5">Pilih paket</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {PACKAGES.map((p) => {
              const isFeatured = p.id === "paket-ibu-bayi";
              return (
                <div
                  key={p.id}
                  className={`bg-card rounded-lg p-5 border-2 flex flex-col transition ${
                    isFeatured ? "border-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  {isFeatured && (
                    <span className="text-xs font-semibold text-primary mb-2">Terlaris</span>
                  )}
                  <h3 className="font-semibold text-base">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 flex-1">{p.desc}</p>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="font-semibold text-lg text-primary">{formatIDR(p.price)}</span>
                    <a
                      href="#booking"
                      onClick={() => setPackageId(p.id)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Pesan
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Kenapa Kami */}
        <section className="py-8 border-b border-border">
          <h2 className="font-semibold text-xl mb-5">Kenapa pilih kami</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              {
                title: "14 tahun pengalaman",
                desc: "Menangani berbagai kebutuhan pijat — dari ibu pasca melahirkan sampai pijat bayi newborn.",
              },
              {
                title: "2 opsi lokasi",
                desc: "Datang ke tempat kami atau kami yang ke rumah Anda. Biaya panggilan terjangkau.",
              },
              {
                title: "Konfirmasi via WhatsApp",
                desc: "Jadwal fleksibel, konfirmasi langsung lewat WhatsApp. Tidak perlu download aplikasi.",
              },
            ].map((f) => (
              <div key={f.title} className="p-5 rounded-lg bg-card border border-border">
                <div className="font-semibold text-sm text-foreground">{f.title}</div>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimoni */}
        <section className="py-8 border-b border-border">
          <h2 className="font-semibold text-xl mb-5">Kata pelanggan</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              {
                name: "Ibu Rani",
                text: "Pijat bayinya sangat lembut. Anak saya langsung tidur nyenyak setelahnya. Terapisnya juga sabar menjelaskan cara pijat yang benar.",
                role: "Pijat Bayi",
              },
              {
                name: "Ibu Sari",
                text: "Paket ibu & bayi sangat lengkap dan terapisnya ramah. Sudah berlangganan 3 bulan, selalu puas.",
                role: "Paket Ibu & Bayi",
              },
              {
                name: "Ibu Dina",
                text: "Punggung dan bahu terasa lebih ringan setelah pijat capek. Pelayanannya profesional dan tepat waktu.",
                role: "Pijat Capek",
              },
            ].map((t) => (
              <figure key={t.name} className="bg-card rounded-lg p-5 border border-border">
                <blockquote className="text-sm text-foreground/90 leading-relaxed">"{t.text}"</blockquote>
                <figcaption className="mt-3 text-xs">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-muted-foreground mt-0.5">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Lokasi Kami */}
        <section className="py-8 border-b border-border">
          <h2 className="font-semibold text-xl mb-2">Lokasi kami</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Perum Kayon Asri 2, Blk. B No.8, Batursari, Kec. Mranggen, Kab. Demak
          </p>
          {/* Map embed */}
          <div className="rounded-xl overflow-hidden border border-border" style={{ height: 260 }}>
            <iframe
              title="Lokasi Pijat Bunda WIN"
              src="https://maps.google.com/maps?q=Perum+Kayon+Asri+2+Blok+B+No+8+Batursari+Mranggen+Demak&output=embed&z=16"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href="https://maps.app.goo.gl/5tthPAxTssqc9Lwe9"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary hover:underline"
          >
            <MapPin className="w-4 h-4" />
            Buka di Google Maps
          </a>
        </section>

        {/* Form Booking */}
        <section id="booking" className="pt-8">
          <h2 className="font-semibold text-xl mb-5">Form Booking</h2>
          <div className="bg-card rounded-lg p-5 md:p-7 space-y-7 border border-border">
            {/* Paket */}
            <div>
              <h3 className="font-medium text-sm mb-3">Pilih paket</h3>
              <div className="grid gap-2 md:grid-cols-3">
                {PACKAGES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPackageId(p.id)}
                    className={`text-left rounded-lg border-2 p-3 transition ${
                      packageId === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
                    <div className="mt-2 text-primary font-semibold text-sm">{formatIDR(p.price)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lokasi */}
            <div>
              <h3 className="font-medium text-sm mb-3">Lokasi layanan</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  { id: "tempat" as const, label: "Datang ke Tempat", sub: "Tidak ada biaya tambahan · Batursari, Mranggen", icon: MapPin },
                  { id: "rumah" as const, label: "Panggilan ke Rumah", sub: `+ ${formatIDR(SERVICE_FEE_HOME)} · Semarang Timur & sekitarnya`, icon: Home },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setServiceType(opt.id)}
                    className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition ${
                      serviceType === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <opt.icon className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{opt.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Data */}
            <div>
              <h3 className="font-medium text-sm mb-3">Data Anda</h3>
              <div className="grid gap-2 sm:grid-cols-2">
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
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>

            {/* Waktu */}
            {packageId === "paket-ibu-bayi" && (
              <div>
                <h3 className="font-medium text-sm mb-3">Pilih jadwal rutinan</h3>
                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Hari Kunjungan 1</label>
                    <select value={day1} onChange={(e) => setDay1(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((d, i) => (
                        <option key={i} value={i}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Hari Kunjungan 2</label>
                    <select value={day2} onChange={(e) => setDay2(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((d, i) => (
                        <option key={i} value={i}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground block mb-1">Tanggal Mulai (Kunjungan Pertama)</label>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="date"
                      value={date}
                      min={todayISO()}
                      onChange={(e) => { setDate(e.target.value); setTime(null); }}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-primary/90 flex gap-2 items-start mb-4">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>Sistem akan menjadwalkan 8 kunjungan ke depan. Pilih jam kunjungan di bawah.</div>
                </div>
              </div>
            )}

            {packageId !== "paket-ibu-bayi" && (
              <div>
                <h3 className="font-medium text-sm mb-3">Pilih jadwal</h3>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={date}
                    min={todayISO()}
                    onChange={(e) => { setDate(e.target.value); setTime(null); }}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium text-sm mb-3">Pilih waktu</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {getAvailableTimeSlots(date, packageId).map((slot) => {
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
            </div>

            {/* Total */}
            <div className="border-t border-border pt-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground text-sm">Total</span>
                <span className="font-semibold text-xl text-primary">{formatIDR(total)}</span>
              </div>
              <button
                onClick={submit}
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-60"
              >
                {submitting ? "Memproses..." : "Kirim Booking"}
              </button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Terapis akan menghubungi Anda via WhatsApp untuk konfirmasi.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Toaster />
    </div>
  );
}
