'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateCoaches, LETTERS } from '@/lib/seats';

type Passenger = { name: string; nik: string; type: string; seat: string };

type Props = {
  trainId: number;
  destId: number;
  date: string;
  summary: {
    name: string;
    type: string;
    originCode: string;
    originName: string;
    destCode: string;
    destName: string;
    departure: string;
    arrival: string;
  };
  totalSeats: number;
  taken: string[];
  defaultName: string;
  defaultNik: string;
};

const MAX_PASSENGERS = 4;

export default function BookingForm({
  trainId,
  destId,
  date,
  summary,
  totalSeats,
  taken,
  defaultName,
  defaultNik,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passengers, setPassengers] = useState<Passenger[]>([
    { name: defaultName, nik: defaultNik, type: 'UMUM', seat: '' },
  ]);
  const [active, setActive] = useState(0); // passenger who gets the next clicked seat
  const [coachIndex, setCoachIndex] = useState(0);

  const coaches = generateCoaches(totalSeats);
  const coach = coaches[coachIndex];
  const takenSet = new Set(taken);

  function update(index: number, patch: Partial<Passenger>) {
    setPassengers((list) => list.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function addPassenger() {
    if (passengers.length >= MAX_PASSENGERS) return;
    setPassengers([...passengers, { name: '', nik: '', type: 'UMUM', seat: '' }]);
    setActive(passengers.length);
  }

  function removePassenger(index: number) {
    setPassengers(passengers.filter((_, i) => i !== index));
    setActive(0);
  }

  function pickSeat(code: string) {
    if (takenSet.has(code)) return;
    const owner = passengers.findIndex((p) => p.seat === code);

    if (owner === active) {
      update(active, { seat: '' }); // click again = unselect
      return;
    }
    if (owner !== -1) return; // already chosen by another passenger

    update(active, { seat: code });
    const next = passengers.findIndex((p, i) => i !== active && !p.seat);
    if (next !== -1) setActive(next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (passengers.some((p) => !p.seat)) {
      setError('Pilih kursi untuk semua penumpang.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          train_id: trainId,
          dest_station_id: destId,
          travel_date: date,
          passengers,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error);
        return;
      }
      router.push('/dashboard?status=booked');
      router.refresh();
    } catch {
      setError('Tidak bisa terhubung ke server');
    } finally {
      setLoading(false);
    }
  }

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="container py-5" style={{ maxWidth: 860 }}>
      <h3 className="fw-bold mb-4">Data Penumpang &amp; Kursi</h3>

      {/* Trip summary */}
      <div className="card card-custom p-3 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="fw-bold">{summary.name}</div>
            <span className="badge badge-type">{summary.type}</span>
          </div>
          <div>
            <span className="badge badge-station">{summary.originCode}</span>
            <i className="bi bi-arrow-right text-muted mx-2"></i>
            <span className="badge badge-station">{summary.destCode}</span>
            <small className="text-muted d-block mt-1">
              {summary.originName} &rarr; {summary.destName}
            </small>
          </div>
          <div>
            <div className="fw-semibold">
              <i className="bi bi-calendar3 me-1 text-muted"></i>
              {dateLabel}
            </div>
            <small className="text-muted">
              <i className="bi bi-clock me-1"></i>
              {summary.departure} - {summary.arrival}
            </small>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Passengers */}
        {passengers.map((p, i) => (
          <div key={i} className="card card-custom p-4 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h6 fw-bold mb-0">Penumpang {i + 1}</h2>
              {i > 0 && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removePassenger(i)}
                >
                  <i className="bi bi-trash"></i> Hapus
                </button>
              )}
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nama Penumpang</label>
                <input
                  className="form-control"
                  value={p.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">NIK (16 digit)</label>
                <input
                  className="form-control"
                  value={p.nik}
                  maxLength={16}
                  inputMode="numeric"
                  onChange={(e) => update(i, { nik: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Tipe Penumpang</label>
                <select
                  className="form-select"
                  value={p.type}
                  onChange={(e) => update(i, { type: e.target.value })}
                >
                  <option value="UMUM">Umum</option>
                  <option value="ANAK">Anak</option>
                  <option value="LANSIA">Lansia</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Tempat Duduk</label>
                <div className="form-control bg-light">
                  {p.seat ? (
                    <span className="fw-bold text-primary">{p.seat}</span>
                  ) : (
                    <span className="text-muted">Pilih di denah kursi di bawah</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn btn-outline-secondary mb-4"
          onClick={addPassenger}
          disabled={passengers.length >= MAX_PASSENGERS}
        >
          <i className="bi bi-person-plus me-1"></i>
          Tambah Penumpang ({passengers.length}/{MAX_PASSENGERS})
        </button>

        {/* Seat map */}
        <div className="card card-custom p-4 mb-3">
          <h2 className="h6 fw-bold mb-3">Pilih Kursi</h2>

          {/* Which passenger gets the next seat */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            {passengers.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`btn btn-sm ${active === i ? 'btn-kai' : 'btn-outline-secondary'}`}
              >
                Penumpang {i + 1}
                {p.seat && <span className="ms-1">&middot; {p.seat}</span>}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="d-flex justify-content-center gap-4 mb-4 small fw-semibold">
            <span>
              <span className="seat-legend" style={{ border: '2px solid #3b82f6', background: '#f8faff' }}></span>
              Aktif
            </span>
            <span>
              <span className="seat-legend" style={{ background: '#b4b7bd' }}></span>
              Terisi
            </span>
            <span>
              <span className="seat-legend" style={{ background: '#2563eb' }}></span>
              Dipilih
            </span>
          </div>

          <div className="overflow-auto pb-2">
            <div className="seat-grid">
              {/* Column labels */}
              <div></div>
              {LETTERS.slice(0, 3).map((l) => (
                <div key={l} className="seat-col-label">{l}</div>
              ))}
              <div></div>
              {LETTERS.slice(3).map((l) => (
                <div key={l} className="seat-col-label">{l}</div>
              ))}

              {/* Rows */}
              {coach.rows.map((r) => {
                const cells = LETTERS.map((letter) => {
                  const seat = r.seats.find((s) => s.letter === letter);
                  if (!seat) return <div key={letter}></div>;

                  const isTaken = takenSet.has(seat.code);
                  const owner = passengers.findIndex((p) => p.seat === seat.code);
                  const cls = isTaken ? 'seat-taken' : owner !== -1 ? 'seat-selected' : '';

                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={isTaken}
                      onClick={() => pickSeat(seat.code)}
                      className={`seat ${cls}`}
                      title={seat.code}
                    >
                      {owner !== -1 ? owner + 1 : ''}
                    </button>
                  );
                });

                return [
                  <div key={`l${r.row}`} className="seat-row-label">{r.row}</div>,
                  ...cells.slice(0, 3),
                  <div key={`a${r.row}`}></div>,
                  ...cells.slice(3),
                ];
              })}
            </div>
          </div>

          <small className="text-muted d-block text-center mt-3">
            Angka di dalam kursi adalah nomor penumpang. Klik kursi yang sama untuk membatalkan.
          </small>
        </div>

        {/* Coach tabs */}
        <div className="coach-tabs mb-4">
          {coaches.map((c, i) => (
            <button
              key={c.number}
              type="button"
              onClick={() => setCoachIndex(i)}
              className={`coach-tab ${i === coachIndex ? 'active' : ''}`}
            >
              {summary.type} {c.number}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <div className="d-flex gap-2">
          <button type="submit" disabled={loading} className="btn btn-kai">
            <i className="bi bi-check-circle me-1"></i>
            {loading ? 'Memproses...' : 'Pesan Tiket'}
          </button>
          <Link href="/dashboard/book" className="btn btn-secondary">
            Batal
          </Link>
        </div>
      </form>
    </main>
  );
}
