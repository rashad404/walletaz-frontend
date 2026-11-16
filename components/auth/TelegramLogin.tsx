'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { setSessionToken } from '@/lib/session';
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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';


export default function TelegramLogin({returnUrl, variant = 'default'}: {returnUrl?: string | null; variant?: 'default' | 'compact'}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [error, setError] = useState('');
  const telegramRef = useRef<HTMLDivElement>(null);


  // Handle Telegram auth callback
  const handleTelegramAuth = useCallback(async (user: TelegramUser) => {
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

      const response = await fetch(`${API_BASE_URL}/auth/telegram/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Telegram authentication failed');
      }

      // Check if 2FA is required
      if (data.status === 'requires_2fa' && data.user_id) {
        const authMethod = data.auth_method || 'telegram';
        const returnUrlParam = data.return_url || returnUrl || '/dashboard';
        router.push(`/${locale}/auth/2fa?user_id=${data.user_id}&return_url=${encodeURIComponent(returnUrlParam)}&auth_method=${authMethod}`);
        return;
      }

      if (data.data?.token) {
        setSessionToken(data.data.token);
        // Use return_url from response which may have auth_method appended for OAuth flow
        const redirectUrl = data.data.return_url || returnUrl;
        if (redirectUrl) {
          window.location.href = redirectUrl;
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
  }, [returnUrl, router, locale]);

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
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', variant === 'compact' ? '12' : '16');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-lang', locale);
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    telegramRef.current.appendChild(script);

    return () => {
      if (telegramRef.current) {
        telegramRef.current.innerHTML = '';
      }
    };
  }, [variant, locale]);

  const isCompact = variant === 'compact';
  return <div>
      {/* Keep Telegram's official widget without a second button-shaped border. */}
      {TELEGRAM_BOT_USERNAME && (
        <div
          ref={telegramRef}
          data-testid="telegram-login-widget"
          className={`flex min-h-12 w-full items-center justify-center [color-scheme:light] [&_iframe]:block [&_iframe]:max-w-full [&_iframe]:[color-scheme:light] ${isCompact ? '[&_iframe]:rounded-xl' : '[&_iframe]:rounded-2xl'}`}
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
</div>;
}
