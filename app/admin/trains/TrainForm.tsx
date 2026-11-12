'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export type Station = { id: number; code: string; name: string };
type Stop = { station_id: string; arrival_time: string };

export type TrainData = {
  name: string;
  train_type: string;
  departure_station_id: string;
  departure_time: string;
  total_seats: string;
  stops: Stop[];
};

const TYPES = ['Eksekutif', 'Bisnis', 'Ekonomi', 'Luxury', 'Panoramic'];

const empty: TrainData = {
  name: '',
  train_type: 'Eksekutif',
  departure_station_id: '',
  departure_time: '',
  total_seats: '40',
  stops: [{ station_id: '', arrival_time: '' }],
};

export default function TrainForm({
  id,
  stations,
  initial,
}: {
  id?: number;
  stations: Station[];
  initial?: TrainData;
}) {
  const router = useRouter();
  const isEdit = id !== undefined;
  const [data, setData] = useState<TrainData>(initial ?? empty);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof TrainData>(key: K, value: TrainData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function updateStop(index: number, patch: Partial<Stop>) {
    setData((d) => ({
      ...d,
      stops: d.stops.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  function addStop() {
    setData((d) => ({ ...d, stops: [...d.stops, { station_id: '', arrival_time: '' }] }));
  }

  function removeStop(index: number) {
    setData((d) => ({ ...d, stops: d.stops.filter((_, i) => i !== index) }));
  }

  // A stop's dropdown hides the departure station and stations already used by other stops
  function stopOptions(index: number) {
    const used = data.stops.filter((_, i) => i !== index).map((s) => s.station_id);
    return stations.filter(
      (s) => String(s.id) !== data.departure_station_id && !used.includes(String(s.id))
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const payload = {
      name: data.name,
      train_type: data.train_type,
      departure_station_id: Number(data.departure_station_id),
      departure_time: data.departure_time,
      total_seats: Number(data.total_seats),
      stops: data.stops.map((s) => ({
        station_id: Number(s.station_id),
        arrival_time: s.arrival_time,
      })),
    };

    const res = await fetch(isEdit ? `/api/admin/trains/${id}` : '/api/admin/trains', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let result: any = {};
    try {
      result = JSON.parse(text);
    } catch {
      setError(`Server error (${res.status}). Cek terminal npm run dev.`);
      return;
    }

    if (!res.ok) {
      setError(result.error || 'Gagal menyimpan');
      return;
    }
    router.push('/admin?status=saved');
    router.refresh();
  } catch (err) {
    setError('Tidak bisa terhubung ke server');
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="container py-5" style={{ maxWidth: 860 }}>
      <h3 className="fw-bold mb-4">{isEdit ? 'Edit' : 'Tambah'} Kereta</h3>

      <form onSubmit={handleSubmit}>
        <div className="card card-custom p-4 mb-3">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nama Kereta</label>
              <input
                className="form-control"
                value={data.name}
                onChange={(e) => setField('name', e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Tipe Kereta</label>
              <select
                className="form-select"
                value={data.train_type}
                onChange={(e) => setField('train_type', e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="col-md-5">
              <label className="form-label">Stasiun Keberangkatan</label>
              <select
                className="form-select"
                value={data.departure_station_id}
                onChange={(e) => setField('departure_station_id', e.target.value)}
                required
              >
                <option value="" disabled>Pilih stasiun</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Jam Berangkat</label>
              <input
                type="time"
                className="form-control"
                value={data.departure_time}
                onChange={(e) => setField('departure_time', e.target.value)}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Jumlah Kursi</label>
              <input
                type="number"
                min={4}
                max={200}
                className="form-control"
                value={data.total_seats}
                onChange={(e) => setField('total_seats', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="card card-custom p-4 mb-3">
          <h2 className="h6 fw-bold mb-3">Stasiun Tujuan &amp; Jam Tiba</h2>

          {data.stops.map((s, i) => (
            <div key={i} className="row g-2 align-items-end mb-2">
              <div className="col-md-6">
                {i === 0 && <label className="form-label">Stasiun Tujuan</label>}
                <select
                  className="form-select"
                  value={s.station_id}
                  onChange={(e) => updateStop(i, { station_id: e.target.value })}
                  required
                >
                  <option value="" disabled>Pilih stasiun</option>
                  {stopOptions(i).map((st) => (
                    <option key={st.id} value={st.id}>{st.name} ({st.code})</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                {i === 0 && <label className="form-label">Jam Tiba</label>}
                <input
                  type="time"
                  className="form-control"
                  value={s.arrival_time}
                  onChange={(e) => updateStop(i, { arrival_time: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-2">
                <button
                  type="button"
                  className="btn btn-outline-danger w-100"
                  onClick={() => removeStop(i)}
                  disabled={data.stops.length === 1}
                  title="Hapus stasiun"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
          ))}

          <div>
            <button type="button" className="btn btn-outline-secondary mt-2" onClick={addStop}>
              <i className="bi bi-plus-circle me-1"></i> Tambah Stasiun Tujuan
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <div className="d-flex gap-2">
          <button type="submit" disabled={loading} className="btn btn-kai">
            <i className="bi bi-check-circle me-1"></i>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <Link href="/admin" className="btn btn-secondary">Batal</Link>
        </div>
      </form>
    </main>
  );
}
