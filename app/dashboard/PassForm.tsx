'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export type PassData = {
  booking_code: string; train_name: string;
  origin_code: string; origin_name: string;
  dest_code: string; dest_name: string;
  travel_date: string; depart_time: string; arrive_time: string;
  passenger_name: string; passenger_nik: string; passenger_type: string;
  seat: string; gate_code: string;
};

const empty: PassData = {
  booking_code: '', train_name: '', origin_code: '', origin_name: '',
  dest_code: '', dest_name: '', travel_date: '', depart_time: '', arrive_time: '',
  passenger_name: '', passenger_nik: '', passenger_type: 'UMUM', seat: '', gate_code: '',
};

export default function PassForm({ id, initial }: { id?: number; initial?: PassData }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = id !== undefined;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(isEdit ? `/api/boarding-passes/${id}` : '/api/boarding-passes', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error);
      return;
    }
    router.push(`/dashboard?status=${isEdit ? 'updated' : 'created'}`);
    router.refresh();
  }

  const v = initial ?? empty;

  return (
    <main className="container py-4" style={{ maxWidth: 800 }}>
      <h1 className="h3 fw-bold mb-4">{isEdit ? 'Edit' : 'Tambah'} Boarding Pass</h1>

      <form onSubmit={handleSubmit} className="card border-0 shadow-sm rounded-4 p-4">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Kode Booking</label>
            <input name="booking_code" defaultValue={v.booking_code} className="form-control" required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Nama Kereta</label>
            <input name="train_name" defaultValue={v.train_name} className="form-control" required />
          </div>

          <div className="col-md-3">
            <label className="form-label">Kode Asal</label>
            <input name="origin_code" defaultValue={v.origin_code} maxLength={4} className="form-control" placeholder="PWT" required />
          </div>
          <div className="col-md-3">
            <label className="form-label">Stasiun Asal</label>
            <input name="origin_name" defaultValue={v.origin_name} className="form-control" placeholder="Purwokerto" required />
          </div>
          <div className="col-md-3">
            <label className="form-label">Kode Tujuan</label>
            <input name="dest_code" defaultValue={v.dest_code} maxLength={4} className="form-control" placeholder="GMR" required />
          </div>
          <div className="col-md-3">
            <label className="form-label">Stasiun Tujuan</label>
            <input name="dest_name" defaultValue={v.dest_name} className="form-control" placeholder="Gambir" required />
          </div>

          <div className="col-md-4">
            <label className="form-label">Tanggal</label>
            <input name="travel_date" type="date" defaultValue={v.travel_date} className="form-control" required />
          </div>
          <div className="col-md-4">
            <label className="form-label">Jam Berangkat</label>
            <input name="depart_time" type="time" defaultValue={v.depart_time} className="form-control" required />
          </div>
          <div className="col-md-4">
            <label className="form-label">Jam Tiba</label>
            <input name="arrive_time" type="time" defaultValue={v.arrive_time} className="form-control" required />
          </div>

          <div className="col-md-6">
            <label className="form-label">Nama Penumpang</label>
            <input name="passenger_name" defaultValue={v.passenger_name} className="form-control" required />
          </div>
          <div className="col-md-6">
            <label className="form-label">NIK (16 digit)</label>
            <input name="passenger_nik" defaultValue={v.passenger_nik} maxLength={16} inputMode="numeric" className="form-control" required />
          </div>

          <div className="col-md-4">
            <label className="form-label">Tipe Penumpang</label>
            <select name="passenger_type" defaultValue={v.passenger_type} className="form-select">
              <option value="UMUM">Umum</option>
              <option value="ANAK">Anak</option>
              <option value="LANSIA">Lansia</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Tempat Duduk</label>
            <input name="seat" defaultValue={v.seat} className="form-control" placeholder="10A" required />
          </div>
          <div className="col-md-4">
            <label className="form-label">Kode Akses Gate</label>
            <input name="gate_code" defaultValue={v.gate_code} className="form-control" placeholder="Kosongkan = otomatis" />
          </div>
        </div>

        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

        <div className="d-flex gap-2 mt-4">
          <button type="submit" disabled={loading} className="btn btn-kai">
            <i className="bi bi-check-circle me-1"></i>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <Link href="/dashboard" className="btn btn-secondary">Batal</Link>
        </div>
      </form>
    </main>
  );
}
