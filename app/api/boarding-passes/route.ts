import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const b = await request.json();
    const required = ['booking_code', 'train_name', 'origin_code', 'origin_name',
      'dest_code', 'dest_name', 'travel_date', 'depart_time', 'arrive_time',
      'passenger_name', 'passenger_nik', 'passenger_type', 'seat'];
    if (required.some((k) => !b[k])) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi' }, { status: 400 });
    }
    if (!/^\d{16}$/.test(b.passenger_nik)) {
      return NextResponse.json({ error: 'NIK harus 16 digit' }, { status: 400 });
    }

    const gate = b.gate_code || 'ACCESS' + Math.random().toString(36).slice(2, 8).toUpperCase();

    await sql`
      INSERT INTO boarding_passes
        (account_id, booking_code, train_name, origin_code, origin_name, dest_code, dest_name,
         travel_date, depart_time, arrive_time, passenger_name, passenger_nik, passenger_type,
         seat, gate_code)
      VALUES
        (${userId}, ${b.booking_code.toUpperCase()}, ${b.train_name}, ${b.origin_code.toUpperCase()},
         ${b.origin_name}, ${b.dest_code.toUpperCase()}, ${b.dest_name}, ${b.travel_date},
         ${b.depart_time}, ${b.arrive_time}, ${b.passenger_name}, ${b.passenger_nik},
         ${b.passenger_type.toUpperCase()}, ${b.seat.toUpperCase()}, ${gate})
    `;
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Kode booking sudah ada' }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  }
}
