import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import Navbar from '../components/Navbar';
import AlertMessage from '../dashboard/AlertMessage';
import TrainActions from './TrainActions';

type Train = {
  id: number;
  name: string;
  train_type: string;
  total_seats: number;
  is_active: boolean;
  origin_code: string;
  origin_name: string;
  departure_time: string;
  stops: { code: string; name: string; time: string }[];
};

async function AdminContent({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (user.role !== 'admin') redirect('/dashboard');

  const { status } = await searchParams;

  const trains = (await sql`
    SELECT t.id, t.name, t.train_type, t.total_seats, t.is_active,
           ds.code AS origin_code, ds.name AS origin_name,
           to_char(t.departure_time, 'HH24:MI') AS departure_time,
           COALESCE((
             SELECT json_agg(
                      json_build_object(
                        'code', s.code,
                        'name', s.name,
                        'time', to_char(ts.arrival_time, 'HH24:MI')
                      ) ORDER BY ts.arrival_time)
             FROM train_stops ts JOIN stations s ON s.id = ts.station_id
             WHERE ts.train_id = t.id
           ), '[]'::json) AS stops
    FROM trains t
    JOIN stations ds ON ds.id = t.departure_station_id
    ORDER BY t.id DESC
  `) as Train[];

  const activeCount = trains.filter((t) => t.is_active).length;

  return (
    <>
      <Navbar name={user.name} role={user.role} />

      <div className="container py-5">
        <div className="row align-items-center mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <h3 className="fw-bold mb-1">Kelola Kereta</h3>
            <p className="text-muted mb-0">
              Atur kereta yang beroperasi, stasiun, dan jadwalnya.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <Link href="/admin/trains/new" className="btn btn-kai">
              <i className="bi bi-plus-circle me-2"></i>Tambah Kereta
            </Link>
          </div>
        </div>

        <AlertMessage status={status} />

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card card-custom p-3">
              <div className="text-muted small">Total Kereta</div>
              <div className="fs-4 fw-bold">{trains.length}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card card-custom p-3">
              <div className="text-muted small">Beroperasi</div>
              <div className="fs-4 fw-bold text-success">{activeCount}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card card-custom p-3">
              <div className="text-muted small">Tidak Beroperasi</div>
              <div className="fs-4 fw-bold text-secondary">{trains.length - activeCount}</div>
            </div>
          </div>
        </div>

        <div className="card card-custom">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-custom table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4">No</th>
                    <th>Kereta</th>
                    <th>Stasiun Berangkat</th>
                    <th>Stasiun Tujuan &amp; Jam Tiba</th>
                    <th>Kursi</th>
                    <th>Status</th>
                    <th className="text-center pe-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {trains.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                        Belum ada kereta. Klik &quot;Tambah Kereta&quot;.
                      </td>
                    </tr>
                  )}

                  {trains.map((t, i) => (
                    <tr key={t.id}>
                      <td className="ps-4 fw-semibold text-muted">{i + 1}</td>
                      <td>
                        <div className="fw-semibold">{t.name}</div>
                        <span className="badge badge-type mt-1">{t.train_type}</span>
                      </td>
                      <td>
                        <span className="badge badge-station">{t.origin_code}</span>
                        <div className="fw-semibold mt-1">
                          <i className="bi bi-clock me-1 text-muted"></i>
                          {t.departure_time}
                        </div>
                        <small className="text-muted">{t.origin_name}</small>
                      </td>
                      <td>
                        {t.stops.map((s) => (
                          <div key={s.code} className="d-flex align-items-center gap-2 mb-1">
                            <span className="badge badge-station">{s.code}</span>
                            <small className="text-muted">{s.name}</small>
                            <small className="fw-semibold">{s.time}</small>
                          </div>
                        ))}
                      </td>
                      <td>{t.total_seats}</td>
                      <td>
                        {t.is_active ? (
                          <span className="badge bg-success">Beroperasi</span>
                        ) : (
                          <span className="badge bg-secondary">Tidak beroperasi</span>
                        )}
                      </td>
                      <td className="text-center pe-4">
                        <TrainActions id={t.id} isActive={t.is_active} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <Suspense fallback={<div className="container py-5 text-muted">Memuat...</div>}>
      <AdminContent searchParams={searchParams} />
    </Suspense>
  );
}
