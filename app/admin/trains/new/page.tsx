import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import Navbar from '../../../components/Navbar';
import TrainForm, { Station } from '../TrainForm';

async function NewTrainContent() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (user.role !== 'admin') redirect('/dashboard');

  const stations = (await sql`SELECT id, code, name FROM stations ORDER BY name`) as Station[];

  return (
    <>
      <Navbar name={user.name} role={user.role} />
      <TrainForm stations={stations} />
    </>
  );
}

export default function NewTrainPage() {
  return (
    <Suspense fallback={<div className="container py-5 text-muted">Memuat...</div>}>
      <NewTrainContent />
    </Suspense>
  );
}
