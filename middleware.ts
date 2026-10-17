import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from './i18n-config';

const LOCALE_COOKIE = 'NEXT_LOCALE';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.includes('_next') ||
    pathname.includes('/api/') ||
    pathname.includes('.') // has file extension
  ) {
    return NextResponse.next();
  }

  // Check if pathname starts with a non-default locale (en or ru)
  const nonDefaultLocales = i18n.locales.filter(locale => locale !== 'az');
  const hasNonDefaultLocale = nonDefaultLocales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Check if pathname starts with /az (which we want to redirect)
  const hasAzPrefix = pathname.startsWith('/az/') || pathname === '/az';

  // If URL has /az prefix, redirect to URL without it
  if (hasAzPrefix) {
    const newPathname = pathname.replace(/^\/az(\/|$)/, '/');
    const url = new URL(newPathname || '/', request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  // Language for a URL that does not name one, in order of precedence:
  // 1. the language the user chose here, saved in NEXT_LOCALE;
  // 2. ?hl=, which partner sites pass with the language of the page the user
  //    came from, so a visitor from an English site who never chose a
  //    language gets English rather than the default;
  // 3. az, the default.
  // A URL with a language prefix is left alone, so an explicit link wins.
  const isLocale = (value?: string | null): value is string =>
    !!value && i18n.locales.includes(value as any);
  const savedLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const hintLocale = request.nextUrl.searchParams.get('hl');
  const preferred = isLocale(savedLocale) ? savedLocale : isLocale(hintLocale) ? hintLocale : null;

  if (!hasNonDefaultLocale && preferred && preferred !== 'az') {
    const newPathname = `/${preferred}${pathname === '/' ? '' : pathname}`;
    const url = new URL(newPathname, request.url);
    url.search = request.nextUrl.search;
    // The prefix now carries the language; the hint has done its job.
    url.searchParams.delete('hl');
    return NextResponse.redirect(url);
  }

  // If no locale prefix, treat as 'az' locale (rewrite internally)
  if (!hasNonDefaultLocale) {
    const newUrl = `/az${pathname === '/' ? '' : pathname}`;
    const url = new URL(newUrl, request.url);
    url.search = request.nextUrl.search;
    const response = NextResponse.rewrite(url);
    response.headers.set('x-pathname', pathname);
    response.headers.set('x-url', request.url);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  response.headers.set('x-url', request.url);

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Cache-Control', 's-maxage=1, stale-while-revalidate');
    response.headers.set('X-Build-Version', Date.now().toString());
  }

  return response;
}

export const config = {
  // Matcher ignoring `/_next/`, `/api/`, and static files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};