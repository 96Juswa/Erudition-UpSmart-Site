import { serialize } from 'cookie';

export async function POST() {
  const cookie = serialize('token', '', {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });

  return new Response(JSON.stringify({ message: 'Logout successful.' }), {
    status: 200,
    headers: { 'Set-Cookie': cookie },
  });
}
