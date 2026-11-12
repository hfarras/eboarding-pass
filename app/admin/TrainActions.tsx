'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TrainActions({ id, isActive }: { id: number; isActive: boolean }) {
  const router = useRouter();

  async function toggle() {
    const res = await fetch(`/api/admin/trains/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    });
    if (res.ok) {
      router.push('/admin?status=saved');
      router.refresh();
    } else {
      alert('Gagal mengubah status');
    }
  }

  async function remove() {
    if (!confirm('Hapus kereta ini? Jadwalnya ikut terhapus (tiket yang sudah dipesan tetap ada).')) return;
    const res = await fetch(`/api/admin/trains/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin?status=removed');
      router.refresh();
    } else {
      alert('Gagal menghapus');
    }
  }

  return (
    <div className="d-flex justify-content-center gap-1">
      <button
        onClick={toggle}
        className={`btn btn-action ${isActive ? 'btn-outline-secondary' : 'btn-outline-success'}`}
        title={isActive ? 'Nonaktifkan' : 'Aktifkan'}
      >
        <i className={`bi ${isActive ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
      </button>
      <Link
        href={`/admin/trains/${id}/edit`}
        className="btn btn-outline-warning btn-action text-dark"
        title="Edit"
      >
        <i className="bi bi-pencil-square"></i>
      </Link>
      <button onClick={remove} className="btn btn-outline-danger btn-action" title="Hapus">
        <i className="bi bi-trash"></i>
      </button>
    </div>
  );
}
