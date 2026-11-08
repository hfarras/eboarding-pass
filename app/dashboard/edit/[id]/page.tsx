import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/db';
import PassForm, { PassData } from '../../PassForm';

async function EditContent({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getSession();
  if (!userId) redirect('/');

  const { id } = await params;
  const rows = await sql`
    SELECT booking_code, train_name, origin_code, origin_name, dest_code, dest_name,
           to_char(travel_date, 'YYYY-MM-DD') AS travel_date,
           to_char(depart_time, 'HH24:MI') AS depart_time,
           to_char(arrive_time, 'HH24:MI') AS arrive_time,
           passenger_name, passenger_nik, passenger_type, seat, gate_code
    FROM boarding_passes
    WHERE id = ${Number(id)} AND account_id = ${userId}
  `;
  if (rows.length === 0) notFound();

  return <PassForm id={Number(id)} initial={rows[0] as PassData} />;
}

export default function EditPassPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="container py-5 text-muted">Memuat...</div>}>
      <EditContent params={params} />
    </Suspense>
  );
}
