'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { VerificationRequest } from '@/lib/use-verification-return';
import type { User } from '@/lib/api/auth';

export function PartnerVerificationNotice({ context, user }: { context: VerificationRequest; user: User }) {
  const t = useTranslations('verification.partner');
  const complete = !!user[`${context.need}_verified_at` as keyof User];
  const [seconds, setSeconds] = useState(3);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    setSeconds(3);
    if (!complete || paused) return;
    const countdown = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    const redirect = window.setTimeout(() => window.location.assign(context.return_to), 3000);
    return () => { window.clearInterval(countdown); window.clearTimeout(redirect); };
  }, [complete, paused, context.return_to, context.need]);

  return (
    <section aria-label={t('requestLabel')} className="mb-6 border-l-4 border-emerald-600 bg-emerald-50 p-5 text-gray-900 dark:bg-gray-800 dark:text-white [overflow-wrap:anywhere]">
      <h2 className="text-lg font-semibold">{t(`request.${context.need}`, { client: context.client_name })}</h2>
      {complete && (
        <div className="mt-4" role="status">
          <p>{t('complete')}</p>
          <a href={context.return_to} className="mt-4 inline-block max-w-full min-h-11 rounded-xl bg-emerald-700 px-5 py-3 text-center font-semibold text-white hover:bg-emerald-800">
            {t('return', { client: context.client_name })}
          </a>
          {!paused && <p className="mt-3 text-sm">{t('countdown', { seconds })}</p>}
          {!paused && <button type="button" onClick={() => setPaused(true)} className="mt-1 min-h-11 text-sm underline">{t('stay')}</button>}
        </div>
      )}
    </section>
  );
}
