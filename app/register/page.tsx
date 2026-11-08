'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error);
      return;
    }
    router.push('/?registered=1');
  }

  return (
    <main className="container py-5" style={{ maxWidth: 720 }}>
      <div className="text-center mb-4">
        <i className="bi bi-train-front-fill text-warning fs-1"></i>
        <h1 className="h3 fw-bold mt-2 mb-1">
          KAI <span className="kai-orange">E-Boarding</span> Pass
        </h1>
        <p className="text-muted mb-0">Buat akun baru untuk mulai menggunakan aplikasi.</p>
      </div>

      <form onSubmit={handleSubmit} className="card card-custom p-4">
        <h2 className="h5 fw-bold mb-3">Daftar Akun</h2>

        <div className="row g-3">
          <div className="col-12">
            <label className="form-label">Nama Lengkap</label>
            <input name="name" className="form-control" required />
          </div>

          <div className="col-md-6">
            <label className="form-label">NIK (16 digit)</label>
            <input
              name="nik"
              maxLength={16}
              inputMode="numeric"
              className="form-control"
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Tanggal Lahir</label>
            <input name="birthday" type="date" className="form-control" required />
          </div>

          <div className="col-md-6">
            <label className="form-label">Jenis Kelamin</label>
            <select name="gender" defaultValue="" className="form-select" required>
              <option value="" disabled>Pilih jenis kelamin</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">No. Telepon</label>
            <input
              name="phone"
              type="tel"
              className="form-control"
              placeholder="08123456789"
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-control" required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              minLength={8}
              className="form-control"
              placeholder="Minimal 8 karakter"
              required
            />
          </div>
        </div>

        {error && <div className="alert alert-danger mt-3 mb-0 py-2 small">{error}</div>}

        <div className="d-flex gap-2 mt-4">
          <button type="submit" disabled={loading} className="btn btn-kai">
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
          <Link href="/" className="btn btn-outline-secondary">Batal</Link>
        </div>
      </form>

      <p className="text-center text-muted small mt-3 mb-0">
        Sudah punya akun?{' '}
        <Link href="/" className="fw-semibold kai-orange text-decoration-none">
          Login
        </Link>
      </p>
    </main>
  );
}
