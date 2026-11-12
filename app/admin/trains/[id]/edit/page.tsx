import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import Navbar from '../../../../components/Navbar';
import TrainForm, { Station } from '../../TrainForm';

async function EditTrainContent({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (user.role !== 'admin') redirect('/dashboard');

  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const trains = await sql`
    SELECT name, train_type, departure_station_id, total_seats,
           to_char(departure_time, 'HH24:MI') AS departure_time
    FROM trains WHERE id = ${Number(id)}
  `;
  if (trains.length === 0) notFound();

  const stops = await sql`
    SELECT station_id, to_char(arrival_time, 'HH24:MI') AS arrival_time
    FROM train_stops WHERE train_id = ${Number(id)} ORDER BY arrival_time
  `;
  const stations = (await sql`SELECT id, code, name FROM stations ORDER BY name`) as Station[];

  const t = trains[0];

  return (
    <>
      <Navbar name={user.name} role={user.role} />
      <TrainForm
        id={Number(id)}
        stations={stations}
        initial={{
          name: t.name,
          train_type: t.train_type,
          departure_station_id: String(t.departure_station_id),
          departure_time: t.departure_time,
          total_seats: String(t.total_seats),
          stops: stops.map((s) => ({
            station_id: String(s.station_id),
            arrival_time: s.arrival_time,
          })),
        }}
      />
    </>
  );
}

export default function EditTrainPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="container py-5 text-muted">Memuat...</div>}>
      <EditTrainContent params={params} />
    </Suspense>
  );
}
