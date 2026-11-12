import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import Navbar from '../../../components/Navbar';
import BookingForm from './BookingForm';

async function BookContent({
  params,
  searchParams,
}: {
  params: Promise<{ trainId: string }>;
  searchParams: Promise<{ to?: string; date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (user.role === 'admin') redirect('/admin');

  const { trainId } = await params;
  const { to, date } = await searchParams;

  if (!/^\d+$/.test(trainId) || !to || !/^\d+$/.test(to) || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  const rows = await sql`
    SELECT t.id, t.name, t.train_type, t.total_seats, t.departure_station_id,
           to_char(t.departure_time, 'HH24:MI') AS departure_time,
           to_char(ts.arrival_time, 'HH24:MI') AS arrival_time,
           ds.code AS origin_code, ds.name AS origin_name,
           das.code AS dest_code, das.name AS dest_name,
           ((${date}::date + t.departure_time) > (now() AT TIME ZONE 'Asia/Jakarta')) AS bookable
    FROM trains t
    JOIN stations ds ON ds.id = t.departure_station_id
    JOIN train_stops ts ON ts.train_id = t.id
    JOIN stations das ON das.id = ts.station_id
    WHERE t.id = ${Number(trainId)} AND ts.station_id = ${Number(to)} AND t.is_active
  `;
  if (rows.length === 0) notFound();
  const t = rows[0];

  // Departure time already passed -> back to search
  if (!t.bookable) {
    redirect(`/dashboard/book?from=${t.departure_station_id}&to=${to}&date=${date}`);
  }

  const takenRows = await sql`
    SELECT seat FROM boarding_passes
    WHERE train_id = ${Number(trainId)} AND travel_date = ${date}::date
  `;

  return (
    <>
      <Navbar name={user.name} role={user.role} />
      <BookingForm
        trainId={t.id}
        destId={Number(to)}
        date={date}
        summary={{
          name: t.name,
          type: t.train_type,
          originCode: t.origin_code,
          originName: t.origin_name,
          destCode: t.dest_code,
          destName: t.dest_name,
          departure: t.departure_time,
          arrival: t.arrival_time,
        }}
        totalSeats={t.total_seats}
        taken={takenRows.map((r) => r.seat as string)}
        defaultName={user.name}
        defaultNik={String(user.nik).trim()}
      />
    </>
  );
}

export default function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ trainId: string }>;
  searchParams: Promise<{ to?: string; date?: string }>;
}) {
  return (
    <Suspense fallback={<div className="container py-5 text-muted">Memuat...</div>}>
      <BookContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
