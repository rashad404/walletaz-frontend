'use client';

import {useEffect, useRef, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import authService from '@/lib/api/auth';
import {APPLE_API, APPLE_SESSION_KEY} from '@/lib/auth/apple';

export default function AppleCallback() {
  const t = useTranslations('appleAuth');
  const locale = useLocale();
  const started = useRef(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [needsCode, setNeedsCode] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const flow = useRef<{code: string; verifier: string} | null>(null);
  const complete = async (otp?: string) => {
    setBusy(true); setError('');
    try {
      if (!flow.current) throw new Error('failed');
      const response = await fetch(`${APPLE_API}/auth/apple/exchange`, {
        method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body: JSON.stringify({...flow.current, code_verifier: flow.current.verifier, two_factor_code: otp}),
      });
      const result = await response.json();
      if (!response.ok) {setError(otp ? 'invalidCode' : 'failed'); return;}
      if (result.status === 'requires_2fa') {setNeedsCode(true); return;}
      if (!result.data?.token) throw new Error('failed');
      const target = new URL(result.data.return_url, window.location.origin);
      if (target.origin !== window.location.origin) throw new Error('failed');
      authService.setToken(result.data.token);
      sessionStorage.removeItem(APPLE_SESSION_KEY);
      window.location.replace(target.href);
    } catch {setError('failed');}
    finally {setBusy(false);}
  };
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    // Keep the one-use code out of history, referrers and page analytics.
    window.history.replaceState(null, '', window.location.pathname);
    const failure = params.get('error');
    if (failure) {setError(['cancelled', 'account_exists', 'email_required'].includes(failure) ? failure : 'failed'); setBusy(false); return;}
    try {
      const stored = JSON.parse(sessionStorage.getItem(APPLE_SESSION_KEY) || 'null');
      const code = params.get('code');
      if (!code || !stored?.verifier || stored.expires < Date.now()) throw new Error();
      flow.current = {code, verifier: stored.verifier};
      void complete();
    } catch {setError('failed'); setBusy(false);}
  }, []);
  return <main className="flex min-h-screen items-center justify-center bg-white p-6 text-gray-900 dark:bg-gray-950 dark:text-white">
    <div className="w-full max-w-sm space-y-5">
      <h1 className="text-2xl font-semibold">{t('continue')}</h1>
      {busy && <p role="status">{t('loading')}</p>}
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{t(error)}</p>}
      {needsCode && <form onSubmit={event => {event.preventDefault(); void complete(twoFactorCode);}} className="space-y-4">
        <label className="block text-sm" htmlFor="apple-otp">{t('twoFactor')}</label>
        <input id="apple-otp" value={twoFactorCode} onChange={e => setTwoFactorCode(e.target.value)} autoComplete="one-time-code" maxLength={16} autoFocus className="w-full rounded-lg border border-gray-400 bg-transparent p-3"/>
        <button disabled={busy || !twoFactorCode.trim()} className="w-full rounded-lg bg-black p-3 text-white disabled:opacity-50 dark:bg-white dark:text-black">{t('verify')}</button>
      </form>}
      {!busy && <a href={`/${locale}/login`} className="inline-block text-sm underline">{t('back')}</a>}
    </div>
  </main>;
}
