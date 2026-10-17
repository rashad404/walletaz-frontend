'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {APPLE_API, startAppleSignIn} from '@/lib/auth/apple';

export function AppleSignInButton({returnUrl, link = false}: {returnUrl?: string | null; link?: boolean}) {
  const t = useTranslations('appleAuth');
  const locale = useLocale();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${APPLE_API}/auth/apple/availability`, {signal: controller.signal})
      .then(r => r.ok ? r.json() : null).then(r => setEnabled(r?.data?.enabled === true)).catch(() => {});
    return () => controller.abort();
  }, []);
  if (!enabled) return null;
  return <div>
    <button type="button" disabled={busy} onClick={async () => {
      setBusy(true); setError(false);
      try { await startAppleSignIn(locale, returnUrl, link ? localStorage.getItem('token') : null); }
      catch { setError(true); setBusy(false); }
    }} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-60 dark:border-gray-600">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M17.05 12.54c.03 3.2 2.81 4.27 2.84 4.29-.02.08-.45 1.52-1.47 3.01-.88 1.29-1.79 2.57-3.23 2.6-1.41.03-1.87-.84-3.48-.84-1.6 0-2.11.81-3.44.87-1.39.05-2.45-1.4-3.34-2.68-1.81-2.63-3.2-7.43-1.34-10.67.93-1.61 2.59-2.63 4.39-2.66 1.37-.03 2.67.93 3.51.93.84 0 2.42-1.15 4.08-.98.7.03 2.64.28 3.88 2.1-.1.06-2.32 1.35-2.4 4.03zM14.4 4.66c.73-.89 1.23-2.13 1.09-3.36-1.05.04-2.32.7-3.07 1.59-.67.77-1.25 2.01-1.1 3.2 1.17.09 2.35-.59 3.08-1.43z"/></svg>
      {busy ? t('loading') : t(link ? 'link' : 'continue')}
    </button>
    {error && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{t('failed')}</p>}
  </div>;
}
