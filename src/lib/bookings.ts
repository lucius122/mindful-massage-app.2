export type PackageId = "pijat-capek" | "pijat-bayi" | "paket-ibu-bayi";

export const PACKAGES: { id: PackageId; name: string; price: number; desc: string }[] = [
  { id: "pijat-capek", name: "Pijat Capek", price: 75000, desc: "Relaksasi tubuh setelah hari yang panjang" },
  { id: "pijat-bayi", name: "Pijat Bayi", price: 50000, desc: "Pijat lembut untuk tumbuh kembang si kecil" },
  { id: "paket-ibu-bayi", name: "Paket Ibu & Bayi", price: 1500000, desc: "Paket perawatan lengkap untuk ibu dan bayi" },
];

export const SERVICE_FEE_HOME = 15000;

export const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
];

export const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
