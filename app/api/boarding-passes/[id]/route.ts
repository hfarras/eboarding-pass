import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Context) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const rows = await sql`
    DELETE FROM boarding_passes WHERE id = ${Number(id)} AND account_id = ${userId} RETURNING id
  `;
  if (rows.length === 0) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ success: true });
}
