'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisteredNotice() {
  const params = useSearchParams();
  if (!params.get('registered')) return null;

  return (
    <div className="alert alert-success border-0 rounded-3 py-2 small">
      <i className="bi bi-check-circle-fill me-2"></i>
      Registrasi berhasil. Silakan login.
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch('/api/login', {
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
    router.push('/dashboard');
  }

  return (
    <main className="container py-5" style={{ maxWidth: 460 }}>
      <div className="text-center mb-4">
        <i className="bi bi-train-front-fill text-warning fs-1"></i>
        <h1 className="h3 fw-bold mt-2 mb-1">
          KAI <span className="kai-orange">E-Boarding</span> Pass
        </h1>
        <p className="text-muted mb-0">Masuk untuk mengelola tiket Anda.</p>
      </div>

      <div className="card card-custom p-4">
        <h2 className="h5 fw-bold mb-3">Login</h2>

        <Suspense fallback={null}>
          <RegisteredNotice />
        </Suspense>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-control" required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input name="password" type="password" className="form-control" required />
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <button type="submit" disabled={loading} className="btn btn-kai w-100">
            {loading ? 'Masuk...' : 'Login'}
          </button>
        </form>
      </div>

      <p className="text-center text-muted small mt-3 mb-0">
        Belum punya akun?{' '}
        <Link href="/register" className="fw-semibold kai-orange text-decoration-none">
          Daftar
        </Link>
      </p>
    </main>
  );
}
