import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import PassForm from '../PassForm';

async function NewPassContent() {
  if (!(await getSession())) redirect('/');
  return <PassForm />;
}

export default function NewPassPage() {
  return (
    <Suspense fallback={<div className="container py-5 text-muted">Memuat...</div>}>
      <NewPassContent />
    </Suspense>
  );
}
