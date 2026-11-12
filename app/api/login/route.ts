import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, password_hash, role FROM accounts WHERE email = ${email.toLowerCase()}
    `;

    const valid =
      rows.length > 0 && (await bcrypt.compare(password, rows[0].password_hash));

    if (!valid) {
      return NextResponse.json({ error: 'Wrong email or password' }, { status: 401 });
    }

    await createSession(rows[0].id);
    return NextResponse.json({ success: true, role: rows[0].role });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
