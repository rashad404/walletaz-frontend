import { NextRequest, NextResponse } from 'next/server';
const API = process.env.KIMLIK_INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.kimlik.az/api';
export const dynamic = 'force-dynamic';
const cookieName = process.env.NODE_ENV === 'production' ? '__Host-kimlik_auth' : 'kimlik_auth';
function sameOrigin(request: NextRequest) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
function reply(status = 204) { return new NextResponse(null, {status, headers: {'Cache-Control': 'private, no-store'}}); }
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return reply(403);
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  if (!token || token.length > 3500 || /[\r\n]/.test(token)) return reply(400);
  try {
    const checked = await fetch(`${API}/user`, {headers: {Authorization: `Bearer ${token}`, Accept: 'application/json'}, cache: 'no-store', signal: AbortSignal.timeout(5000)});
    if (!checked.ok) return reply(checked.status === 401 ? 401 : 503);
    const response = reply();
    response.cookies.set(cookieName, token, {httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800});
    return response;
  } catch { return reply(503); }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return reply(403);
  const response = reply();
  response.cookies.set(cookieName, '', {httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0});
  return response;
}
