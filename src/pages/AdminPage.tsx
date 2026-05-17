import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { formatIDR } from "@/lib/bookings";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ArrowLeft, MessageCircle, Check, X, Clock, MapPin, Home as HomeIcon, LogOut, Flower2 } from "lucide-react";

type Booking = {
  id: string;
  customer_name: string;
  whatsapp_number: string;
  address: string | null;
  package_name: string;
  service_type: string;
  total_price: number;
  booking_date: string;
  booking_time: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
};

type Filter = "all" | "pending" | "confirmed" | "cancelled";

export default function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { document.title = "Admin — Sentuhan Sejuk"; }, []);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("bookings").select("*")
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });
      if (!error) setBookings((data ?? []) as Booking[]);
      setLoading(false);
    };
    load();
    const channel = supabase.channel("admin-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: "confirmed" | "cancelled") => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast.error("Gagal memperbarui status");
    else toast.success(status === "confirmed" ? "Booking dikonfirmasi" : "Booking dibatalkan");
  };

  const waLink = (num: string) => {
    const clean = num.replace(/\D/g, "").replace(/^0/, "62");
    return `https://wa.me/${clean}`;
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Memuat...</p>
      </div>
    );
  }

  if (session === null) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <h1 className="font-display text-xl">Dashboard Terapis</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {(["pending", "confirmed", "cancelled", "all"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"}`}>
              {f === "all" ? "Semua" : f === "pending" ? "Menunggu" : f === "confirmed" ? "Dikonfirmasi" : "Dibatalkan"}
              {" "}({f === "all" ? bookings.length : bookings.filter((b) => b.status === f).length})
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Memuat...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Tidak ada booking.</p>
        ) : (
          filtered.map((b) => (
            <article key={b.id} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-base">{b.customer_name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.whatsapp_number}</p>
                </div>
                <StatusPill status={b.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div><div className="text-xs text-muted-foreground">Paket</div><div className="font-medium">{b.package_name}</div></div>
                <div><div className="text-xs text-muted-foreground">Total</div><div className="font-medium text-primary">{formatIDR(b.total_price)}</div></div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Clock className="w-3.5 h-3.5" /> {b.booking_date} • {b.booking_time}</div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  {b.service_type.includes("Rumah") ? <HomeIcon className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}{b.service_type}
                </div>
              </div>
              {b.address && (
                <div className="mt-3 p-2.5 rounded-md bg-muted text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">Alamat: </span>{b.address}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={waLink(b.whatsapp_number)} target="_blank" rel="noreferrer"
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-success text-success-foreground text-sm font-medium hover:opacity-90 transition">
                  <MessageCircle className="w-4 h-4" /> Hubungi Pelanggan
                </a>
                {b.status === "pending" && (
                  <>
                    <button onClick={() => updateStatus(b.id, "confirmed")}
                      className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
                      <Check className="w-4 h-4" /> Setujui
                    </button>
                    <button onClick={() => updateStatus(b.id, "cancelled")}
                      className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition">
                      <X className="w-4 h-4" /> Batal
                    </button>
                  </>
                )}
              </div>
            </article>
          ))
        )}
      </main>
      <Toaster />
    </div>
  );
}

function StatusPill({ status }: { status: Booking["status"] }) {
  const styles = {
    pending: "bg-accent text-accent-foreground",
    confirmed: "bg-success/15 text-success",
    cancelled: "bg-destructive/15 text-destructive",
  }[status];
  const label = { pending: "Menunggu", confirmed: "Dikonfirmasi", cancelled: "Dibatalkan" }[status];
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles}`}>{label}</span>;
}

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
