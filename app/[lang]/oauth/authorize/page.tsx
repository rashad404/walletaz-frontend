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
  'profile:name': <User className="w-5 h-5" />,
  'profile:email': <Mail className="w-5 h-5" />,
  'profile:phone': <Phone className="w-5 h-5" />,
  'verification:read': <Shield className="w-5 h-5" />,
  'wallet:read': <CreditCard className="w-5 h-5" />,
  'transactions:read': <History className="w-5 h-5" />,
  'wallet:charge': <Wallet className="w-5 h-5" />,
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

      // Post message to parent window (popup flow)
      if (window.opener) {
        window.opener.postMessage({
          type: decision === 'allow' ? 'oauth_success' : 'oauth_denied',
          redirect_uri: data.redirect_uri,
        }, '*');
        window.close();
      } else {
        // Fallback to redirect
        window.location.href = data.redirect_uri;
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !oauthData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full">
          <div className="card-glass rounded-3xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('oauth.errors.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => window.close()}
              className="px-6 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Wallet.az</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="card-glass rounded-3xl overflow-hidden">
          {/* App Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              {oauthData?.client.logo_url ? (
                <img
                  src={oauthData.client.logo_url}
                  alt={oauthData.client.name}
                  className="w-14 h-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {oauthData?.client.name}
                </h1>
                {oauthData?.client.website_url && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new URL(oauthData.client.website_url).hostname}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {t('oauth.consent.willAllow', { app: oauthData?.client.name })}
            </p>

            {/* Scopes List */}
            <div className="space-y-3 mb-6">
              {oauthData?.scopes.map((scope) => (
                <div
                  key={scope.name}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    {scopeIcons[scope.name] || <Shield className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {scope.display_name[lang] || scope.display_name['en'] || scope.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {scope.description[lang] || scope.description['en']}
                    </p>
                  </div>
                  <Check className="w-5 h-5 text-emerald-500 mt-2" />
                </div>
              ))}
            </div>

            {/* User Info */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-6">
              <div className="flex items-center gap-3">
                {oauthData?.user.avatar ? (
                  <img
                    src={oauthData.user.avatar}
                    alt={oauthData.user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {oauthData?.user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {oauthData?.user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSwitchAccount}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {t('oauth.consent.switchAccount')}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 mb-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleDecision('deny')}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {t('oauth.consent.deny')}
              </button>
              <button
                onClick={() => handleDecision('allow')}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {t('oauth.consent.allow')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('oauth.consent.footer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
