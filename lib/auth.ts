import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export type CurrentUser = {
  id: number;
  name: string;
  nik: string;
  role: 'passenger' | 'admin';
};

export async function createSession(userId: number) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<number | null> {
  const token = (await cookies()).get('session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as number;
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete('session');
}

// Logged-in user with name and role (read fresh from the database)
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const id = await getSession();
  if (!id) return null;
  const rows = await sql`SELECT id, name, nik, role FROM accounts WHERE id = ${id}`;
  return rows.length > 0 ? (rows[0] as CurrentUser) : null;
}

export async function getAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user && user.role === 'admin' ? user : null;
}
