'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Navbar({
  name,
  role,
}: {
  name: string;
  role: 'passenger' | 'admin';
}) {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
  }

  const isAdmin = role === 'admin';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-kai-gradient shadow-sm py-3">
      <div className="container">
        <Link
          className="navbar-brand d-flex align-items-center gap-2"
          href={isAdmin ? '/admin' : '/dashboard'}
        >
          <i className="bi bi-train-front-fill text-warning fs-4"></i>
          <span>
            KAI <span className="kai-orange">E-Boarding</span> Pass
          </span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item">
              <Link className="nav-link" href={isAdmin ? '/admin' : '/dashboard'}>
                <i className="bi bi-speedometer2 me-1"></i>
                {isAdmin ? 'Kelola Kereta' : 'Dashboard'}
              </Link>
            </li>
            <li className="nav-item ms-lg-2">
            </li>
            <li className="nav-item ms-lg-3 text-white d-flex align-items-center">
              <i className="bi bi-person-circle me-2 fs-5"></i>
              <span className="fw-semibold">{name}</span>
              {isAdmin && <span className="badge bg-warning text-dark ms-2">Admin</span>}
            </li>
            <li className="nav-item ms-lg-3">
              <button className="btn btn-outline-light btn-sm" onClick={logout}>
                <i className="bi bi-box-arrow-right me-1"></i> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
