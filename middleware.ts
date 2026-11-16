import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from './i18n-config';

export async function middleware(request: NextRequest) {
  // Next's middleware URL may use its listen address behind a reverse proxy.
  // nginx overwrites Host and X-Forwarded-Proto with the public request values.
  const host = request.headers.get('host') || request.nextUrl.host;
  const protocol = request.headers.get('x-forwarded-proto')?.split(',')[0] || request.nextUrl.protocol.replace(':', '');
  const publicUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, `${protocol}://${host}`);
  const pathname = publicUrl.pathname;
  if (pathname.includes('_next') || pathname.includes('/api/') || pathname.includes('.')) return NextResponse.next();

  if (pathname.startsWith('/login-shell/')) {
    if (!request.nextUrl.search) return NextResponse.next();
    const clean = request.nextUrl.clone(); clean.search = '';
    const response = NextResponse.redirect(clean);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  const explicit = i18n.locales.find(locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  const isLocale = (value?: string | null) => !!value && i18n.locales.includes(value as any);
  const saved = request.cookies.get('NEXT_LOCALE')?.value;
  const hint = request.nextUrl.searchParams.get('hl');
  const locale = explicit || (isLocale(saved) ? saved : isLocale(hint) ? hint : 'az');
  const path = explicit ? pathname.slice(explicit.length + 1) || '/' : pathname;

  // Public shell cache keys omit per-flow state and PKCE. The browser reads those
  // from its own address after paint; only validated client branding is rendered.
  if (path === '/login') {
    try {
      const returned = new URL(request.nextUrl.searchParams.get('return_url') || '', publicUrl);
      if (returned.origin === publicUrl.origin && /^\/(?:az\/|en\/|ru\/)?oauth\/authorize$/.test(returned.pathname)) {
        const client = returned.searchParams.get('client_id') || '';
        const target = returned.searchParams.get('redirect_uri') || '';
        if (/^[a-f0-9-]{36}$/i.test(client) && /^https?:\/\//.test(target) && target.length <= 2048) {
          const url = request.nextUrl.clone();
          const encoded = btoa(unescape(encodeURIComponent(target))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          url.pathname = `/login-shell/${locale}/${client}/${encoded}`;
          url.search = '';
          // Fetch the canonical public URL without the user's query. A rewrite
          // alone lets Next serialize the original state into its router payload.
          const origin = process.env.KIMLIK_FRONTEND_ORIGIN || `http://localhost:${request.nextUrl.port || '3033'}`;
          const shell = await fetch(new URL(url.pathname, origin), {signal: AbortSignal.timeout(5000)});
          if (shell.ok) return new NextResponse(shell.body, {headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=0, s-maxage=5',
            'X-Kimlik-Public-Shell': '1',
          }});
          return new NextResponse('Invalid OAuth client', {status: 400, headers: {'Cache-Control': 'private, no-store'}});
        }
      }
    } catch { /* Malformed requests use the ordinary login page. */ }
  }

  const authCookie = process.env.NODE_ENV === 'production' ? '__Host-kimlik_auth' : 'kimlik_auth';
  if (path === '/oauth/authorize' && request.cookies.get('kimlik_session')?.value && request.cookies.get(authCookie)?.value) {
    try {
      const api = process.env.KIMLIK_INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.kimlik.az/api';
      const result = await fetch(`${api}/oauth/authorize/fast`, {
        method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(2500),
        headers: {Authorization: `Bearer ${request.cookies.get(authCookie)!.value}`, 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': request.headers.get('user-agent') || ''},
        body: JSON.stringify(Object.fromEntries(request.nextUrl.searchParams)),
      });
      if (result.ok) {
        const data = await result.json();
        const expected = new URL(request.nextUrl.searchParams.get('redirect_uri') || '');
        const target = new URL(data.redirect_uri);
        if (['https:', 'http:'].includes(target.protocol) && target.origin === expected.origin && target.pathname === expected.pathname && target.searchParams.get('state') === request.nextUrl.searchParams.get('state') && target.searchParams.get('code')) {
          const response = NextResponse.redirect(target, 302);
          response.headers.set('Cache-Control', 'private, no-store');
          response.headers.set('Referrer-Policy', 'no-referrer');
          return response;
        }
      }
      // Denied, new scopes, unavailable API: keep the existing authenticated
      // consent flow. A cookie is never sufficient to grant authorization.
    } catch { /* The normal consent screen remains available. */ }
  }

  // This cookie is only a routing hint, never proof of authentication.
  // The authorize API still checks the bearer token before showing consent.
  if (path === '/oauth/authorize' && !request.cookies.get('kimlik_session')?.value) {
    const url = request.nextUrl.clone();
    url.pathname = `${locale === 'az' ? '' : `/${locale}`}/login`;
    url.search = '';
    url.searchParams.set('return_url', publicUrl.href);
    const response = NextResponse.redirect(url);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  if (!explicit && locale !== 'az') {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${path === '/' ? '' : path}`;
    url.searchParams.delete('hl');
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  requestHeaders.set('x-url', request.url);
  // Forward to server layouts, rather than setting response-only headers.
  if (explicit) return NextResponse.next({ request: { headers: requestHeaders } });
  const url = request.nextUrl.clone();
  url.pathname = `/az${path === '/' ? '' : path}`;
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
