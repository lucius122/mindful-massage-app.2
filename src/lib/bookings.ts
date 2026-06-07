export type PackageId = "pijat-capek" | "pijat-bayi" | "paket-ibu-bayi";

export const PACKAGES: { id: PackageId; name: string; price: number; desc: string }[] = [
  {
    id: "pijat-capek",
    name: "Pijat Capek",
    price: 50000,
    desc: "Meredakan pegal di punggung, bahu, dan kaki setelah seharian beraktivitas.",
  },
  {
    id: "pijat-bayi",
    name: "Pijat Bayi",
    price: 35000,
    desc: "Pijat lembut untuk mendukung tumbuh kembang dan kenyamanan si kecil.",
  },
  {
    id: "paket-ibu-bayi",
    name: "Paket Ibu & Bayi",
    price: 1500000,
    desc: "Perawatan lengkap untuk ibu dan bayi (seminggu 2x selama 1 bulan).",
  },
];

export const SERVICE_FEE_HOME = 15000;

/**
 * Mendapatkan slot waktu dinamis berdasarkan hari:
 * - Jarak antar jam: 2 jam (06, 08, 10, 12, 14, 16, 18, 20)
 * - Kamis (4): max jam 14:00 (slot: 06, 08, 10, 12, 14)
 * - Jumat (5): mulai jam 16:00 (slot: 16, 18, 20)
 */
export const getAvailableTimeSlots = (dateStr: string, _packageId?: PackageId): string[] => {
  const d = new Date(dateStr);
  const dayOfWeek = d.getDay(); // 0 (Sun) to 6 (Sat)
  
  const allSlots = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
  
  if (dayOfWeek === 4) { // Kamis
    return ["06:00", "08:00", "10:00", "12:00", "14:00"];
  } else if (dayOfWeek === 5) { // Jumat
    return ["16:00", "18:00", "20:00"];
  }
  
  return allSlots;
};

/**
 * Helper untuk menghitung 8 tanggal kunjungan selama 4 minggu ke depan
 * berdasarkan tanggal mulai dan 2 pilihan hari (0=Minggu, 1=Senin, ..., 6=Sabtu)
 */
export const calculateMonthlyDates = (startDateStr: string, day1: number, day2: number): string[] => {
  const dates: string[] = [];
  let currentDate = new Date(startDateStr);
  
  // Mencari ke depan sampai menemukan 8 hari yang cocok dengan day1 atau day2
  while (dates.length < 8) {
    const dow = currentDate.getDay();
    if (dow === day1 || dow === day2) {
      // Format as YYYY-MM-DD local
      const tzOffset = currentDate.getTimezoneOffset() * 60000;
      const localISOTime = new Date(currentDate.getTime() - tzOffset).toISOString().slice(0, 10);
      dates.push(localISOTime);
    }
    // Tambah 1 hari
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

export const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
