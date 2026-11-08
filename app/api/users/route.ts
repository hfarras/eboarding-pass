import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

type User = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

export async function GET() {
  try {
    const users = (await sql`
      SELECT id, name, email, created_at FROM users ORDER BY id DESC
    `) as User[];
    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'name and email are required' },
        { status: 400 }
      );
    }

    const [user] = (await sql`
      INSERT INTO users (name, email)
      VALUES (${name}, ${email})
      RETURNING id, name, email, created_at
    `) as User[];

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
