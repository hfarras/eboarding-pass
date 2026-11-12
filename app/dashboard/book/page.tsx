import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import Navbar from '../../components/Navbar';

type Station = { id: number; code: string; name: string };

type Result = {
  id: number;
  name: string;
  train_type: string;
  departure_time: string;
  arrival_time: string;
  origin_code: string;
  origin_name: string;
  dest_code: string;
  dest_name: string;
  dest_id: number;
  bookable: boolean;
  seats_left: number;
};

async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (user.role === 'admin') redirect('/admin');

  const { from, to, date } = await searchParams;

  // Only stations that are really used by active trains
  const origins = (await sql`
    SELECT DISTINCT s.id, s.code, s.name
    FROM trains t JOIN stations s ON s.id = t.departure_station_id
    WHERE t.is_active ORDER BY s.name
  `) as Station[];

  const destinations = (await sql`
    SELECT DISTINCT s.id, s.code, s.name
    FROM train_stops ts
    JOIN trains t ON t.id = ts.train_id
    JOIN stations s ON s.id = ts.station_id
    WHERE t.is_active ORDER BY s.name
  `) as Station[];

  const today = (
    await sql`SELECT to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS d`
  )[0].d as string;

  const searched =
    !!from && !!to && !!date && /^\d+$/.test(from) && /^\d+$/.test(to) &&
    /^\d{4}-\d{2}-\d{2}$/.test(date);

  let results: Result[] = [];
  if (searched) {
    results = (await sql`
      SELECT t.id, t.name, t.train_type,
             to_char(t.departure_time, 'HH24:MI') AS departure_time,
             to_char(ts.arrival_time, 'HH24:MI') AS arrival_time,
             ds.code AS origin_code, ds.name AS origin_name,
             das.code AS dest_code, das.name AS dest_name,
             ts.station_id AS dest_id,
             ((${date}::date + t.departure_time) > (now() AT TIME ZONE 'Asia/Jakarta')) AS bookable,
             (t.total_seats - (
               SELECT count(*) FROM boarding_passes bp
               WHERE bp.train_id = t.id AND bp.travel_date = ${date}::date
             ))::int AS seats_left
      FROM trains t
      JOIN stations ds ON ds.id = t.departure_station_id
      JOIN train_stops ts ON ts.train_id = t.id
      JOIN stations das ON das.id = ts.station_id
      WHERE t.is_active
        AND t.departure_station_id = ${Number(from)}
        AND ts.station_id = ${Number(to)}
      ORDER BY t.departure_time
    `) as Result[];
  }

  return (
    <>
      <Navbar name={user.name} role={user.role} />

      <div className="container py-5">
        <h3 className="fw-bold mb-1">Pesan Tiket</h3>
        <p className="text-muted mb-4">
          Pilih stasiun keberangkatan, stasiun tujuan, dan tanggal perjalanan.
        </p>

        <form method="get" action="/dashboard/book" className="card card-custom p-4 mb-4">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Stasiun Keberangkatan</label>
              <select name="from" defaultValue={from ?? ''} className="form-select" required>
                <option value="" disabled>Pilih stasiun</option>
                {origins.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Stasiun Tujuan</label>
              <select name="to" defaultValue={to ?? ''} className="form-select" required>
                <option value="" disabled>Pilih stasiun</option>
                {destinations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Tanggal</label>
              <input
                type="date"
                name="date"
                min={today}
                defaultValue={date ?? ''}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-3">
              <button type="submit" className="btn btn-kai w-100">
                <i className="bi bi-search me-1"></i> Cari Kereta
              </button>
            </div>
          </div>
        </form>

        {searched && (
          <div className="card card-custom">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-custom table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4">Kereta</th>
                      <th>Rute</th>
                      <th>Berangkat</th>
                      <th>Tiba</th>
                      <th>Sisa Kursi</th>
                      <th className="text-center pe-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted">
                          <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                          Tidak ada kereta untuk rute ini.
                        </td>
                      </tr>
                    )}
                    {results.map((t) => {
                      const full = t.seats_left <= 0;
                      const canBook = t.bookable && !full;
                      return (
                        <tr key={t.id}>
                          <td className="ps-4">
                            <div className="fw-semibold">{t.name}</div>
                            <span className="badge badge-type mt-1">{t.train_type}</span>
                          </td>
                          <td>
                            <span className="badge badge-station">{t.origin_code}</span>
                            <i className="bi bi-arrow-right text-muted mx-2"></i>
                            <span className="badge badge-station">{t.dest_code}</span>
                            <small className="text-muted d-block mt-1">
                              {t.origin_name} &rarr; {t.dest_name}
                            </small>
                          </td>
                          <td className="fw-semibold">{t.departure_time}</td>
                          <td className="fw-semibold">{t.arrival_time}</td>
                          <td>{Math.max(t.seats_left, 0)}</td>
                          <td className="text-center pe-4">
                            {canBook ? (
                              <Link
                                href={`/dashboard/book/${t.id}?to=${t.dest_id}&date=${date}`}
                                className="btn btn-kai btn-sm"
                              >
                                Pilih
                              </Link>
                            ) : (
                              <span className="badge bg-secondary">
                                {!t.bookable ? 'Sudah berangkat' : 'Penuh'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function BookSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; date?: string }>;
}) {
  return (
    <Suspense fallback={<div className="container py-5 text-muted">Memuat...</div>}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}
