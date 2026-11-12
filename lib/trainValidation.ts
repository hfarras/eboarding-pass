const TYPES = ['Eksekutif', 'Bisnis', 'Ekonomi', 'Luxury', 'Panoramic'];
const TIME = /^\d{2}:\d{2}$/;

export type TrainInput = {
  name: string;
  train_type: string;
  departure_station_id: number;
  departure_time: string;
  total_seats: number;
  stops: { station_id: number; arrival_time: string }[];
};

// Returns an error message, or null if valid
export function validateTrain(b: any): string | null {
  if (!b?.name?.trim()) return 'Nama kereta wajib diisi';
  if (!TYPES.includes(b.train_type)) return 'Tipe kereta tidak valid';
  if (!Number.isInteger(b.departure_station_id)) return 'Stasiun keberangkatan wajib dipilih';
  if (typeof b.departure_time !== 'string' || !TIME.test(b.departure_time)) {
    return 'Jam berangkat tidak valid';
  }
  if (!Number.isInteger(b.total_seats) || b.total_seats < 4 || b.total_seats > 200) {
    return 'Jumlah kursi harus 4 sampai 200';
  }
  if (!Array.isArray(b.stops) || b.stops.length < 1) {
    return 'Minimal satu stasiun tujuan';
  }

  const seen = new Set<number>();
  for (const s of b.stops) {
    if (!Number.isInteger(s?.station_id)) return 'Stasiun tujuan wajib dipilih';
    if (s.station_id === b.departure_station_id) {
      return 'Stasiun tujuan tidak boleh sama dengan stasiun keberangkatan';
    }
    if (seen.has(s.station_id)) return 'Stasiun tujuan tidak boleh duplikat';
    seen.add(s.station_id);
    if (typeof s.arrival_time !== 'string' || !TIME.test(s.arrival_time)) {
      return 'Jam tiba tidak valid';
    }
    if (s.arrival_time <= b.departure_time) {
      return 'Jam tiba harus setelah jam berangkat';
    }
  }
  return null;
}
