import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, nik, birthday, gender, email, phone, password } =
      await request.json();

    if (!name || !nik || !birthday || !gender || !email || !phone || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (!/^\d{16}$/.test(nik)) {
      return NextResponse.json({ error: 'NIK must be exactly 16 digits' }, { status: 400 });
    }
    if (!['male', 'female'].includes(gender)) {
      return NextResponse.json({ error: 'Invalid gender' }, { status: 400 });
    }
    if (!/^\+?\d{9,15}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO accounts (name, nik, birthday, gender, email, phone, password_hash)
      VALUES (${name}, ${nik}, ${birthday}, ${gender},
              ${email.toLowerCase()}, ${phone}, ${passwordHash})
    `;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: 'Email or NIK is already registered' },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
