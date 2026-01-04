'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Wallet, Shield, User, CreditCard, History, Check, X, ExternalLink, Loader2, Mail, Phone } from 'lucide-react';
import { Link } from '@/lib/navigation';

interface OAuthData {
  client: {
    client_id: string;
    name: string;
    logo_url: string | null;
    website_url: string | null;
    description: string | null;
  };
  scopes: Array<{
    name: string;
    display_name: Record<string, string>;
    description: Record<string, string>;
    category: string;
  }>;
  user: {
    name: string;
    email: string;
    avatar: string | null;
  };
}

const scopeIcons: Record<string, React.ReactNode> = {
  'profile:name': <User className="w-4 h-4" />,
  'profile:email': <Mail className="w-4 h-4" />,
  'profile:phone': <Phone className="w-4 h-4" />,
  'verification:read': <Shield className="w-4 h-4" />,
  'wallet:read': <CreditCard className="w-4 h-4" />,
  'transactions:read': <History className="w-4 h-4" />,
  'wallet:charge': <Wallet className="w-4 h-4" />,
};

export default function OAuthAuthorizePage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = (params?.lang as string) || 'az';
  const [oauthData, setOAuthData] = useState<OAuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope');
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');
  const responseType = searchParams.get('response_type');

  useEffect(() => {
    fetchOAuthData();
  }, []);

  const fetchOAuthData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Redirect to login with return URL
        const returnUrl = window.location.href;
        router.push(`/${lang}/login?return_url=${encodeURIComponent(returnUrl)}`);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';
      const response = await fetch(
        `${API_URL}/oauth/authorize?${searchParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('oauth.errors.invalidClient'));
      }

      setOAuthData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (decision: 'allow' | 'deny') => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';

      const response = await fetch(`${API_URL}/oauth/authorize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: responseType,
          scope,
          state,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
          decision,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authorization failed');
      }

      if (decision === 'allow') {
        // Redirect to callback URL to exchange code for token
        window.location.href = data.redirect_uri;
      } else {
        // For deny: close popup or redirect with error
        if (window.opener) {
          window.opener.postMessage({ type: 'oauth_denied' }, '*');
          window.close();
        } else {
          window.location.href = data.redirect_uri;
        }
      }
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleSwitchAccount = () => {
    localStorage.removeItem('token');
    const returnUrl = window.location.href;
    router.push(`/${lang}/login?return_url=${encodeURIComponent(returnUrl)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !oauthData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {t('oauth.errors.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header with Wallet.az branding + App */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Wallet.az</span>
        </div>
        <div className="flex items-center gap-3">
          {oauthData?.client.logo_url ? (
            <img
              src={oauthData.client.logo_url}
              alt={oauthData.client.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {oauthData?.client.name}
            </h1>
            {oauthData?.client.website_url && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {new URL(oauthData.client.website_url).hostname}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          {t('oauth.consent.willAllow', { app: oauthData?.client.name })}
        </p>

        {/* Compact Scopes Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {oauthData?.scopes.map((scope) => (
            <div
              key={scope.name}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                {scopeIcons[scope.name] || <Shield className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                {scope.display_name[lang] || scope.display_name['en'] || scope.name}
              </span>
            </div>
          ))}
        </div>

        {/* User Info */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
          <div className="flex items-center gap-2 min-w-0">
            {oauthData?.user.avatar ? (
              <img
                src={oauthData.user.avatar}
                alt={oauthData.user.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-xs truncate">
                {oauthData?.user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {oauthData?.user.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSwitchAccount}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex-shrink-0 ml-2"
          >
            {t('oauth.consent.switchAccount')}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 mt-3">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Action Buttons - pb-safe for iPhone bottom bar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2">
          <button
            onClick={() => handleDecision('deny')}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {t('oauth.consent.deny')}
          </button>
          <button
            onClick={() => handleDecision('allow')}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                {t('oauth.consent.allow')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
