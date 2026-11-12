import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdmin } from '@/lib/auth';
import { validateTrain } from '@/lib/trainValidation';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const trainId = Number(id);

  try {
    const b = await request.json();
    const problem = validateTrain(b);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    await sql.transaction([
      sql`
        UPDATE trains SET
          name = ${b.name.trim()},
          train_type = ${b.train_type},
          departure_station_id = ${b.departure_station_id},
          departure_time = ${b.departure_time},
          total_seats = ${b.total_seats}
        WHERE id = ${trainId}
      `,
      sql`DELETE FROM train_stops WHERE train_id = ${trainId}`,
      sql`
        INSERT INTO train_stops (train_id, station_id, arrival_time)
        SELECT ${trainId}::int, (s->>'station_id')::int, (s->>'arrival_time')::time
        FROM jsonb_array_elements(${JSON.stringify(b.stops)}::jsonb) AS s
      `,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal memperbarui kereta' }, { status: 500 });
  }
}

// Turn a train on or off
export async function PATCH(request: Request, { params }: Context) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const { is_active } = await request.json();

  if (typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  }

  const rows = await sql`
    UPDATE trains SET is_active = ${is_active} WHERE id = ${Number(id)} RETURNING id
  `;
  if (rows.length === 0) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Context) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;

  const rows = await sql`DELETE FROM trains WHERE id = ${Number(id)} RETURNING id`;
  if (rows.length === 0) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ success: true });
}
