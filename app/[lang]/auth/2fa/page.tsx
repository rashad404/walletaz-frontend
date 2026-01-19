"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppLogo } from '@/components/ui/app-logo';

function TwoFactorContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get('user_id');
  const returnUrl = searchParams.get('return_url');
  const provider = searchParams.get('provider');

  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';

  // Translate error code from backend
  const translateErrorCode = (code: string): string => {
    const errorMessages: Record<string, string> = {
      'invalid_2fa_code': t('auth.errors.invalid2FACode'),
      'user_not_found': t('auth.errors.userNotFound'),
      '2fa_not_enabled': t('auth.errors.2faNotEnabled'),
      'invalid_credentials': t('auth.errors.invalidCredentials'),
    };
    return errorMessages[code] || t('auth.errors.loginFailed');
  };

  // Redirect if no user_id
  useEffect(() => {
    if (!userId) {
      router.push('/login');
    }
  }, [userId, router]);

  // 2FA verification handler
  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          code: twoFactorCode,
          user_id: parseInt(userId || '0', 10),
          provider: provider || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        const errorMessage = data.code ? translateErrorCode(data.code) : t('auth.errors.invalid2FACode');
        throw new Error(errorMessage);
      }

      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        if (returnUrl) {
          window.location.href = decodeURIComponent(returnUrl);
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error(t('auth.errors.noToken'));
      }
    } catch (err: any) {
      setError(err.message || t('auth.errors.invalid2FACode'));
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel and go back to login
  const handleCancel = () => {
    const loginUrl = returnUrl ? `/login?return_url=${encodeURIComponent(returnUrl)}` : '/login';
    router.push(loginUrl);
  };

  // Get provider display name
  const getProviderName = (p: string | null): string => {
    switch (p) {
      case 'google':
        return 'Google';
      case 'facebook':
        return 'Facebook';
      default:
        return '';
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      <div className="fixed inset-0 z-[-10]">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
      </div>

      <div className="w-full max-w-md px-6 py-12">
        <div className="text-center mb-8">
          <AppLogo size="md" className="mx-auto mb-6" />
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('auth.twoFactorTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('auth.twoFactorSubtitle')}
          </p>
          {provider && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('auth.signedInWith')} {getProviderName(provider)}
            </p>
          )}
        </div>

        <div className="card-glass rounded-3xl p-8">
          <form onSubmit={handle2FASubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 dark:bg-red-900/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="2fa-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.verificationCode')}
              </label>
              <input
                id="2fa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                required
                className="w-full px-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-center tracking-widest font-mono text-xl"
                placeholder="000000"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('auth.twoFactorHint')}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || twoFactorCode.length < 6}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-all group flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{t('auth.verify')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t('auth.backToLogin')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    }>
      <TwoFactorContent />
    </Suspense>
  );
}
