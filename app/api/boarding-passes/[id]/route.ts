import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const b = await request.json();
    if (!/^\d{16}$/.test(b.passenger_nik)) {
      return NextResponse.json({ error: 'NIK harus 16 digit' }, { status: 400 });
    }
    const rows = await sql`
      UPDATE boarding_passes SET
        booking_code = ${b.booking_code.toUpperCase()}, train_name = ${b.train_name},
        origin_code = ${b.origin_code.toUpperCase()}, origin_name = ${b.origin_name},
        dest_code = ${b.dest_code.toUpperCase()}, dest_name = ${b.dest_name},
        travel_date = ${b.travel_date}, depart_time = ${b.depart_time},
        arrive_time = ${b.arrive_time}, passenger_name = ${b.passenger_name},
        passenger_nik = ${b.passenger_nik}, passenger_type = ${b.passenger_type.toUpperCase()},
        seat = ${b.seat.toUpperCase()}, gate_code = ${b.gate_code}
      WHERE id = ${Number(id)} AND account_id = ${userId}
      RETURNING id
    `;
    if (rows.length === 0) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Kode booking sudah ada' }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Gagal memperbarui' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const rows = await sql`
    DELETE FROM boarding_passes WHERE id = ${Number(id)} AND account_id = ${userId} RETURNING id
  `;
  if (rows.length === 0) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ success: true });
}
