import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import Navbar from '../components/Navbar';
import AlertMessage from './AlertMessage';
import DeleteButton from './DeleteButton';

type Pass = {
  id: number;
  booking_code: string;
  train_name: string;
  origin_code: string;
  origin_name: string;
  dest_code: string;
  dest_name: string;
  travel_date: string;
  depart_time: string;
  arrive_time: string;
  passenger_name: string;
  passenger_nik: string;
  passenger_type: string;
  seat: string;
  gate_code: string;
};

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (user.role === 'admin') redirect('/admin');

  const { status } = await searchParams;

  const passes = (await sql`
    SELECT id, booking_code, train_name, origin_code, origin_name, dest_code, dest_name,
           to_char(travel_date, 'YYYY-MM-DD') AS travel_date,
           to_char(depart_time, 'HH24:MI') AS depart_time,
           to_char(arrive_time, 'HH24:MI') AS arrive_time,
           passenger_name, passenger_nik, passenger_type, seat, gate_code
    FROM boarding_passes
    WHERE account_id = ${user.id}
    ORDER BY id DESC
  `) as Pass[];

  return (
    <>
      <Navbar name={user.name} role={user.role} />

      <div className="container py-5">
        <div className="row align-items-center mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <h3 className="fw-bold mb-1">Halo, {user.name}</h3>
            <p className="text-muted mb-0">
              Kelola dan pantau seluruh data tiket perjalanan kereta api Anda.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <Link href="/dashboard/book" className="btn btn-kai">
              <i className="bi bi-ticket-perforated-fill me-2"></i>Pesan Tiket
            </Link>
          </div>
        </div>

        <AlertMessage status={status} />

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card card-custom p-3">
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-4 fs-3">
                  <i className="bi bi-ticket-detailed-fill"></i>
                </div>
                <div>
                  <div className="text-muted small">Total Boarding Pass</div>
                  <div className="fs-4 fw-bold">{passes.length} Tiket</div>
                </div>
              </div>
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
                    <th>Kode Booking</th>
                    <th>Kereta</th>
                    <th>Rute Perjalanan</th>
                    <th>Tanggal &amp; Waktu</th>
                    <th>Penumpang</th>
                    <th>Tempat Duduk</th>
                    <th>Kode Akses Gate</th>
                    <th className="text-center pe-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {passes.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                        Belum ada tiket. Klik &quot;Pesan Tiket&quot; untuk memesan.
                      </td>
                    </tr>
                  )}

                  {passes.map((p, i) => (
                    <tr key={p.id}>
                      <td className="ps-4 fw-semibold text-muted">{i + 1}</td>
                      <td>
                        <span className="fw-bold text-primary">{p.booking_code}</span>
                      </td>
                      <td>
                        <div className="fw-semibold">{p.train_name}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge badge-station">{p.origin_code}</span>
                          <i className="bi bi-arrow-right text-muted fs-6"></i>
                          <span className="badge badge-station bg-warning bg-opacity-10 text-warning-emphasis">
                            {p.dest_code}
                          </span>
                        </div>
                        <small className="text-muted d-block mt-1">
                          {p.origin_name} &rarr; {p.dest_name}
                        </small>
                      </td>
                      <td>
                        <div className="fw-semibold">
                          <i className="bi bi-calendar3 me-1 text-muted"></i>
                          {formatDate(p.travel_date)}
                        </div>
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {p.depart_time} - {p.arrive_time}
                        </small>
                      </td>
                      <td>
                        <div className="fw-semibold">{p.passenger_name}</div>
                        <small className="text-muted d-block">NIK: {p.passenger_nik}</small>
                        <span className="badge badge-type mt-1">{p.passenger_type}</span>
                      </td>
                      <td>
                        <span className="badge bg-success bg-opacity-10 text-success fw-semibold px-2 py-1 rounded-3">
                          <i className="bi bi-person-seat me-1"></i>
                          {p.seat}
                        </span>
                      </td>
                      <td>
                        <span className="code-block">
                          <i className="bi bi-qr-code-scan me-1"></i>
                          {p.gate_code}
                        </span>
                      </td>
                      <td className="text-center pe-4">
                        <DeleteButton id={p.id} />
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

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <Suspense fallback={<div className="container py-5 text-muted">Memuat...</div>}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
