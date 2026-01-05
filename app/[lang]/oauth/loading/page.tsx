'use client';

import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { AppLogo } from '@/components/ui/app-logo';

export default function OAuthLoadingPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        {/* App Logo */}
        <div className="flex justify-center mb-6">
          <AppLogo size="md" />
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
