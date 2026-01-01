'use client';

import { useTranslations } from 'next-intl';
import { Wallet, Loader2 } from 'lucide-react';

export default function OAuthLoadingPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        {/* Wallet.az Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">Wallet.az</span>
        </div>

        {/* Spinner */}
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />

        {/* Loading text */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('common.loading')}
        </p>
      </div>
    </div>
  );
}
