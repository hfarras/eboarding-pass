import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdmin } from '@/lib/auth';
import { validateTrain } from '@/lib/trainValidation';

export async function POST(request: Request) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const b = await request.json();
    const problem = validateTrain(b);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    // One statement = the train and all its stops are saved together
    await sql`
      WITH new_train AS (
        INSERT INTO trains (name, train_type, departure_station_id, departure_time, total_seats)
        VALUES (${b.name.trim()}, ${b.train_type}, ${b.departure_station_id},
                ${b.departure_time}, ${b.total_seats})
        RETURNING id
      )
      INSERT INTO train_stops (train_id, station_id, arrival_time)
      SELECT new_train.id, (s->>'station_id')::int, (s->>'arrival_time')::time
      FROM new_train, jsonb_array_elements(${JSON.stringify(b.stops)}::jsonb) AS s
    `;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal menyimpan kereta' }, { status: 500 });
  }
}
