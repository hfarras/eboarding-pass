import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateSeats } from '@/lib/seats';

const TYPES = ['UMUM', 'ANAK', 'LANSIA'];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'passenger') {
    return NextResponse.json({ error: 'Hanya penumpang yang dapat memesan' }, { status: 403 });
  }

  try {
    const { train_id, dest_station_id, travel_date, passengers } = await request.json();

    if (
      !Number.isInteger(train_id) ||
      !Number.isInteger(dest_station_id) ||
      typeof travel_date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(travel_date)
    ) {
      return NextResponse.json({ error: 'Data pemesanan tidak valid' }, { status: 400 });
    }
    if (!Array.isArray(passengers) || passengers.length < 1 || passengers.length > 4) {
      return NextResponse.json({ error: 'Jumlah penumpang harus 1 sampai 4' }, { status: 400 });
    }

    for (const p of passengers) {
      if (!p?.name?.trim() || !p?.seat) {
        return NextResponse.json({ error: 'Nama dan kursi wajib diisi' }, { status: 400 });
      }
      if (!/^\d{16}$/.test(p.nik)) {
        return NextResponse.json({ error: 'NIK harus 16 digit' }, { status: 400 });
      }
      if (!TYPES.includes(p.type)) {
        return NextResponse.json({ error: 'Tipe penumpang tidak valid' }, { status: 400 });
      }
    }

    const seatList: string[] = passengers.map((p) => p.seat);
    if (new Set(seatList).size !== seatList.length) {
      return NextResponse.json({ error: 'Kursi tidak boleh sama antar penumpang' }, { status: 400 });
    }

    const rows = await sql`
      SELECT t.id, t.name, t.total_seats,
             to_char(t.departure_time, 'HH24:MI') AS dep,
             to_char(ts.arrival_time, 'HH24:MI') AS arr,
             ds.code AS origin_code, ds.name AS origin_name,
             das.code AS dest_code, das.name AS dest_name,
             ((${travel_date}::date + t.departure_time) > (now() AT TIME ZONE 'Asia/Jakarta')) AS bookable
      FROM trains t
      JOIN stations ds ON ds.id = t.departure_station_id
      JOIN train_stops ts ON ts.train_id = t.id
      JOIN stations das ON das.id = ts.station_id
      WHERE t.id = ${train_id} AND ts.station_id = ${dest_station_id} AND t.is_active
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Kereta tidak tersedia' }, { status: 404 });
    }
    const t = rows[0];

    // Rule: cannot book once the departure time has passed
    if (!t.bookable) {
      return NextResponse.json(
        { error: 'Tiket tidak dapat dipesan karena waktu keberangkatan sudah lewat' },
        { status: 400 }
      );
    }

    const validSeats = new Set(generateSeats(t.total_seats));
    if (seatList.some((s) => !validSeats.has(s))) {
      return NextResponse.json({ error: 'Kursi tidak valid' }, { status: 400 });
    }

    const bookingCode = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();

    const inserts = passengers.map((p) => {
      const gate = 'ACCESS' + crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
      return sql`
        INSERT INTO boarding_passes
          (account_id, train_id, booking_code, train_name, origin_code, origin_name,
           dest_code, dest_name, travel_date, depart_time, arrive_time,
           passenger_name, passenger_nik, passenger_type, seat, gate_code)
        VALUES
          (${user.id}, ${t.id}, ${bookingCode}, ${t.name}, ${t.origin_code}, ${t.origin_name},
           ${t.dest_code}, ${t.dest_name}, ${travel_date}, ${t.dep}, ${t.arr},
           ${p.name.trim()}, ${p.nik}, ${p.type}, ${p.seat}, ${gate})
      `;
    });

    // All passengers are saved together, or none at all
    await sql.transaction(inserts);

    return NextResponse.json({ success: true, booking_code: bookingCode }, { status: 201 });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: 'Salah satu kursi baru saja dipesan orang lain. Silakan pilih kursi lain.' },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ error: 'Gagal memesan tiket' }, { status: 500 });
  }
}
