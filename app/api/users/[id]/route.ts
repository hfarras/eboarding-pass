import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Context) {
  const { id } = await params;
  const rows = await sql`SELECT * FROM users WHERE id = ${Number(id)}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const { name, email } = await request.json();
  const rows = await sql`
    UPDATE users SET name = ${name}, email = ${email}
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: Context) {
  const { id } = await params;
  const rows = await sql`DELETE FROM users WHERE id = ${Number(id)} RETURNING id`;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
