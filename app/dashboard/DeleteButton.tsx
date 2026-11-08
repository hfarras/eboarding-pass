'use client';

import { useRouter } from 'next/navigation';

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Apakah Anda yakin ingin menghapus data boarding pass ini?')) return;
    const res = await fetch(`/api/boarding-passes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/dashboard?status=deleted');
      router.refresh();
    } else {
      alert('Gagal menghapus');
    }
  }

  return (
    <button onClick={handleDelete} className="btn btn-outline-danger btn-action" title="Hapus Data">
      <i className="bi bi-trash"></i>
    </button>
  );
}
