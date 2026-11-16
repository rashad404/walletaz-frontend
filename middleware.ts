import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from './i18n-config';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.includes('_next') || pathname.includes('/api/') || pathname.includes('.')) return NextResponse.next();

  const explicit = i18n.locales.find(locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  const isLocale = (value?: string | null) => !!value && i18n.locales.includes(value as any);
  const saved = request.cookies.get('NEXT_LOCALE')?.value;
  const hint = request.nextUrl.searchParams.get('hl');
  const locale = explicit || (isLocale(saved) ? saved : isLocale(hint) ? hint : 'az');
  const path = explicit ? pathname.slice(explicit.length + 1) || '/' : pathname;

  // This cookie is only a routing hint, never proof of authentication.
  // The authorize API still checks the bearer token before showing consent.
  if (path === '/oauth/authorize' && !request.cookies.get('kimlik_session')?.value) {
    const url = request.nextUrl.clone();
    url.pathname = `${locale === 'az' ? '' : `/${locale}`}/login`;
    url.search = '';
    url.searchParams.set('return_url', request.nextUrl.href);
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
