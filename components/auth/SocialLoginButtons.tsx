'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SocialLoginButtonsProps {
  returnUrl?: string | null;
  variant?: 'default' | 'compact';
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Telegram bot username from env
const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '';

export function SocialLoginButtons({ returnUrl, variant = 'default' }: SocialLoginButtonsProps) {
  const t = useTranslations();
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [error, setError] = useState('');
  const telegramRef = useRef<HTMLDivElement>(null);

  const handleOAuthRedirect = (provider: 'google' | 'facebook') => {
    const params = returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : '';
    window.location.href = `${API_BASE_URL}/auth/${provider}${params}`;
  };

  // Handle Telegram auth callback
  const handleTelegramAuth = useCallback(async (user: TelegramUser) => {
    console.log('Telegram auth callback received:', user);
    setTelegramLoading(true);
    setError('');

    try {
      // Build payload with only defined values (Telegram hash is computed from present fields only)
      const payload: Record<string, any> = {
        id: String(user.id),
        first_name: user.first_name,
        auth_date: user.auth_date,
        hash: user.hash,
        return_url: returnUrl || '/dashboard'
      };

      // Only add optional fields if they exist
      if (user.last_name) payload.last_name = user.last_name;
      if (user.username) payload.username = user.username;
      if (user.photo_url) payload.photo_url = user.photo_url;

      console.log('Sending to backend:', payload);

      const response = await fetch(`${API_BASE_URL}/auth/telegram/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Backend response:', data);

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Telegram authentication failed');
      }

      // Check if 2FA is required
      if (data.status === 'requires_2fa' && data.user_id) {
        const locale = document.documentElement.lang || 'az';
        router.push(`/${locale}/auth/2fa?user_id=${data.user_id}&return_url=${encodeURIComponent(returnUrl || '/dashboard')}&provider=telegram`);
        return;
      }

      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        if (returnUrl) {
          window.location.href = returnUrl;
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Telegram authentication failed');
      console.error('Telegram auth error:', err);
    } finally {
      setTelegramLoading(false);
    }
  }, [API_BASE_URL, returnUrl, router]);

  // Set up Telegram callback globally
  useEffect(() => {
    if (!TELEGRAM_BOT_USERNAME) return;

    // Set up global callback for Telegram widget
    (window as any).onTelegramAuth = handleTelegramAuth;

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [handleTelegramAuth]);

  // Load Telegram widget script
  useEffect(() => {
    if (!TELEGRAM_BOT_USERNAME || !telegramRef.current) return;

    // Clear any existing content
    telegramRef.current.innerHTML = '';

    // Create the Telegram login script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME);
    script.setAttribute('data-size', variant === 'compact' ? 'medium' : 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    telegramRef.current.appendChild(script);

    return () => {
      if (telegramRef.current) {
        telegramRef.current.innerHTML = '';
      }
    };
  }, [variant]);

  const isCompact = variant === 'compact';

  return (
    <div className="space-y-3">
      {/* Google and Facebook row */}
      <div className={`grid grid-cols-2 ${isCompact ? 'gap-2' : 'gap-3'}`}>
        {/* Google Button */}
        <button
          type="button"
          onClick={() => handleOAuthRedirect('google')}
          className={`flex items-center justify-center gap-2 ${
            isCompact
              ? 'px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700'
              : 'px-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800'
          } transition-all`}
        >
          <svg className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className={`font-medium text-gray-700 dark:text-gray-300 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {t('login.google')}
          </span>
        </button>

        {/* Facebook Button */}
        <button
          type="button"
          onClick={() => handleOAuthRedirect('facebook')}
          className={`flex items-center justify-center gap-2 ${
            isCompact
              ? 'px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700'
              : 'px-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800'
          } transition-all`}
        >
          <svg className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} fill="#1877F2" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span className={`font-medium text-gray-700 dark:text-gray-300 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {t('login.facebook')}
          </span>
        </button>
      </div>

      {/* Telegram Widget - Full width row */}
      {TELEGRAM_BOT_USERNAME && (
        <div
          ref={telegramRef}
          className={`flex items-center justify-center w-full ${
            isCompact
              ? 'py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              : 'py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700'
          }`}
        />
      )}

      {error && (
        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {telegramLoading && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {t('common.loading')}
        </div>
      )}
    </div>
  );
}

interface SocialLoginDividerProps {
  variant?: 'default' | 'compact';
}

export function SocialLoginDivider({ variant = 'default' }: SocialLoginDividerProps) {
  const t = useTranslations();
  const isCompact = variant === 'compact';

  return (
    <div className={`relative ${isCompact ? 'my-4' : 'my-6'}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      <div className={`relative flex justify-center ${isCompact ? 'text-xs' : 'text-sm'}`}>
        <span className={`${isCompact ? 'px-3 bg-white dark:bg-gray-900' : 'px-4 bg-white/50 dark:bg-gray-900/50'} text-gray-500`}>
          {t('login.orContinueWith')}
        </span>
      </div>
    </div>
  );
}
