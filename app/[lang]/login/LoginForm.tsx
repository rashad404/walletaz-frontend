'use client';

import { setSessionToken } from '@/lib/session';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/lib/navigation';
import { Mail, Lock, ArrowRight, Loader2, Phone, ShieldCheck, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppLogo } from '@/components/ui/app-logo';
import { GoogleLoginButton, SocialLoginButtons, SocialLoginDivider } from '@/components/auth/SocialLoginButtons';

type LoginMethod = 'email' | 'phone';

// Country codes for the selector with phone length validation
const countryCodes = [
  { code: '994', country: 'AZ', label: 'Azerbaijan (+994)', minLength: 9, maxLength: 9 },
  { code: '90', country: 'TR', label: 'Turkey (+90)', minLength: 10, maxLength: 10 },
  { code: '7', country: 'RU', label: 'Russia (+7)', minLength: 10, maxLength: 10 },
  { code: '380', country: 'UA', label: 'Ukraine (+380)', minLength: 9, maxLength: 9 },
  { code: '995', country: 'GE', label: 'Georgia (+995)', minLength: 9, maxLength: 9 },
  { code: '1', country: 'US', label: 'USA (+1)', minLength: 10, maxLength: 10 },
  { code: '44', country: 'GB', label: 'UK (+44)', minLength: 10, maxLength: 10 },
  { code: '49', country: 'DE', label: 'Germany (+49)', minLength: 10, maxLength: 11 },
];

export default function LoginForm({ returnUrl: initialReturnUrl, partnerApp, appleEnabled, publicShell = false }: { publicShell?: boolean; returnUrl: string | null; partnerApp: { name: string; logo_url: string | null; website_url: string | null } | null; appleEnabled: boolean }) {
  const [returnUrl, setReturnUrl] = useState(initialReturnUrl);
  const [returnReady, setReturnReady] = useState(!publicShell);
  useEffect(() => {
    if (publicShell) {
      setReturnUrl(new URLSearchParams(window.location.search).get('return_url'));
      setReturnReady(true);
    }
  }, [publicShell]);
  const t = useTranslations();
  const router = useRouter();

  // Login method toggle
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone login state
  const [countryCode, setCountryCode] = useState('994');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phonePassword, setPhonePassword] = useState('');

  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState<number | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorAuthMethod, setTwoFactorAuthMethod] = useState<string | null>(null);

  // Get current country code config
  const currentCountry = countryCodes.find(cc => cc.code === countryCode) || countryCodes[0];

  // Validate phone length for current country
  const isPhoneValid = phoneNumber.length >= currentCountry.minLength && phoneNumber.length <= currentCountry.maxLength;

  // Check if this is OAuth popup flow
  const isOAuthFlow = publicShell || returnUrl?.includes('oauth/authorize') || returnUrl?.includes('oauth/approve');

  // Redirect if already logged in
  useEffect(() => {
    if (!returnReady) return;
    const token = localStorage.getItem('token');
    if (token) {
      void setSessionToken(token).then(() => {
      if (returnUrl) {
        window.location.href = returnUrl;
      } else {
        router.push('/dashboard');
      }
      });
    }
  }, [router, returnUrl, returnReady]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';

  // Email login handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password, return_url: returnUrl || '' })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        if (data.errors) {
          const errorKey = Object.keys(data.errors)[0];
          const errorMsg = data.errors[errorKey]?.[0]?.toLowerCase() || '';

          if (errorKey === 'email') {
            if (errorMsg.includes('required')) {
              throw new Error(t('auth.errors.emailRequired'));
            } else if (errorMsg.includes('valid') || errorMsg.includes('invalid')) {
              throw new Error(t('auth.errors.emailInvalid'));
            }
          } else if (errorKey === 'password') {
            if (errorMsg.includes('required')) {
              throw new Error(t('auth.errors.passwordRequired'));
            }
          }
        }
        if (data.message?.toLowerCase().includes('credentials') || data.message?.toLowerCase().includes('invalid')) {
          throw new Error(t('auth.errors.invalidCredentials'));
        }
        throw new Error(t('auth.errors.loginFailed'));
      }

      // Check if 2FA is required
      if (data.status === 'requires_2fa' && data.data?.user_id) {
        setRequires2FA(true);
        setTwoFactorUserId(data.data.user_id);
        setTwoFactorAuthMethod(data.data.auth_method || 'email');
        return;
      }

      if (data.data?.token) {
        await setSessionToken(data.data.token);
        let redirectUrl = data.data.return_url || returnUrl;
        // Append auth_method for OAuth flow so login history shows correct method
        if (redirectUrl && isOAuthFlow && data.data.auth_method) {
          const separator = redirectUrl.includes('?') ? '&' : '?';
          redirectUrl = `${redirectUrl}${separator}auth_method=${data.data.auth_method}`;
        }
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error('No token received from server');
      }
    } catch (err: any) {
      setError(err.message || t('auth.errors.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

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
        credentials: 'include',
        body: JSON.stringify({
          code: twoFactorCode,
          user_id: twoFactorUserId,
          auth_method: twoFactorAuthMethod,
          is_oauth_flow: isOAuthFlow
        })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        const errorMessage = data.code ? translateErrorCode(data.code) : t('auth.errors.invalid2FACode');
        throw new Error(errorMessage);
      }

      if (data.data?.token) {
        await setSessionToken(data.data.token);
        if (returnUrl) {
          // For OAuth flow, append auth_method to return URL
          let redirectUrl = returnUrl;
          if (isOAuthFlow && twoFactorAuthMethod) {
            const separator = redirectUrl.includes('?') ? '&' : '?';
            const loginType = twoFactorAuthMethod + '_2fa';
            redirectUrl = `${redirectUrl}${separator}auth_method=${loginType}`;
          }
          window.location.href = redirectUrl;
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

  // Phone login handler
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const fullPhone = `${countryCode}${phoneNumber}`;

      const response = await fetch(`${API_BASE_URL}/auth/login-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ phone: fullPhone, password: phonePassword, return_url: returnUrl || '' })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        if (data.message?.toLowerCase().includes('credentials') || data.message?.toLowerCase().includes('invalid')) {
          throw new Error(t('login.invalidPhoneCredentials'));
        }
        throw new Error(t('auth.errors.loginFailed'));
      }

      // Check if 2FA is required
      if (data.status === 'requires_2fa' && data.data?.user_id) {
        setRequires2FA(true);
        setTwoFactorUserId(data.data.user_id);
        setTwoFactorAuthMethod(data.data.auth_method || 'phone');
        return;
      }

      if (data.data?.token) {
        await setSessionToken(data.data.token);
        let redirectUrl = data.data.return_url || returnUrl;
        // Append auth_method for OAuth flow so login history shows correct method
        if (redirectUrl && isOAuthFlow && data.data.auth_method) {
          const separator = redirectUrl.includes('?') ? '&' : '?';
          redirectUrl = `${redirectUrl}${separator}auth_method=${data.data.auth_method}`;
        }
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error('No token received from server');
      }
    } catch (err: any) {
      setError(err.message || t('auth.errors.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Switch login method
  const switchLoginMethod = (method: LoginMethod) => {
    setLoginMethod(method);
    setError('');
  };

  // Compact OAuth popup design
  if (isOAuthFlow) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          {partnerApp ? (
            <>
              <div className="flex justify-center mb-3">
                <AppLogo size="sm" />
              </div>
              <div className="flex items-center gap-3">
                {partnerApp.logo_url ? (
                  <img
                    src={partnerApp.logo_url}
                    alt={partnerApp.name}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                    {partnerApp.name}
                  </p>
                  {partnerApp.website_url && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {new URL(partnerApp.website_url).hostname}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <AppLogo size="sm" />
          )}
        </div>

        <div className="flex-1 p-4">
          {/* 2FA Form (Compact) */}
          {requires2FA ? (
            <>
              <div className="text-center mb-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {t('auth.twoFactorTitle')}
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('auth.twoFactorSubtitle')}
                </p>
              </div>

              <form onSubmit={handle2FASubmit} className="space-y-3">
                {error && (
                  <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30">
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="2fa-code-compact" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('auth.verificationCode')}
                  </label>
                  <input
                    id="2fa-code-compact"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-center tracking-widest font-mono"
                    placeholder="000000"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('auth.twoFactorHint')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || twoFactorCode.length < 6}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t('auth.verify')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false);
                    setTwoFactorUserId(null);
                    setTwoFactorCode('');
                    setTwoFactorAuthMethod(null);
                    setError('');
                  }}
                  className="w-full py-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('auth.backToLogin')}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Google first: most users sign in with it */}
              <GoogleLoginButton returnUrl={returnUrl} />
              <SocialLoginDivider variant="compact" labelKey="login.or" />

              {/* Login method tabs */}
              <div className="flex gap-1 mb-3 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => switchLoginMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs rounded-lg font-medium transition-all ${
                loginMethod === 'email'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              {t('auth.email')}
            </button>
            <button
              type="button"
              onClick={() => switchLoginMethod('phone')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs rounded-lg font-medium transition-all ${
                loginMethod === 'phone'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              {t('auth.phone')}
            </button>
          </div>

          {/* Email Form (Compact) */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {error && (
                <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30">
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email-compact" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('login.emailAddress')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email-compact"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder={t('login.emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password-compact" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t('login.password')}
                  </label>
                  <Link prefetch={false}
                    href={`/forgot-password${returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : ''}`}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {t('login.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password-compact"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder={t('login.passwordPlaceholder')}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{t('login.signIn')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Phone Form (Compact) */}
          {loginMethod === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-3">
              {error && (
                <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30">
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="phone-compact" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('auth.phone')}
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-28 px-2 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    {countryCodes.map((cc) => (
                      <option key={cc.code} value={cc.code}>
                        {cc.country} +{cc.code}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="phone-compact"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      required
                      maxLength={currentCountry.maxLength}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder={t('settings.profile.phonePlaceholder')}
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {currentCountry.minLength === currentCountry.maxLength
                    ? `${currentCountry.minLength} digits required`
                    : `${currentCountry.minLength}-${currentCountry.maxLength} digits required`}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="phonePassword-compact" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t('login.password')}
                  </label>
                  <Link prefetch={false}
                    href={`/forgot-password${returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : ''}`}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {t('login.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="phonePassword-compact"
                    type="password"
                    value={phonePassword}
                    onChange={(e) => setPhonePassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder={t('login.passwordPlaceholder')}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isPhoneValid}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{t('login.signIn')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

              {/* Social Login for OAuth flow */}
              <SocialLoginDivider variant="compact" labelKey="login.otherMethods" />
              <SocialLoginButtons appleEnabled={appleEnabled} returnUrl={returnUrl} variant="compact" showGoogle={false} />

              <p className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400">
                {t('login.noAccount')}{' '}
                <Link prefetch={false}
                  href={`/register${returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : ''}`}
                  className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t('login.signUp')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Standard full-page login design
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      <div className="fixed inset-0 z-[-10]">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
      </div>

      <div className="w-full max-w-md px-6 py-12">
        {/* 2FA Form (Standard) */}
        {requires2FA ? (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('auth.twoFactorTitle')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('auth.twoFactorSubtitle')}
              </p>
            </div>

            <div className="card-glass rounded-3xl p-8">
              <form onSubmit={handle2FASubmit} className="space-y-6">
                {error && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 dark:bg-red-900/30">
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
                  onClick={() => {
                    setRequires2FA(false);
                    setTwoFactorUserId(null);
                    setTwoFactorCode('');
                    setTwoFactorAuthMethod(null);
                    setError('');
                  }}
                  className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('auth.backToLogin')}
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('login.welcomeBack')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('login.signInToManage')}
              </p>
            </div>

            <div className="card-glass rounded-3xl p-8">
              {/* Login method tabs */}
              <div className="flex gap-2 mb-6 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => switchLoginMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg font-medium transition-all ${
                loginMethod === 'email'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              {t('auth.email')}
            </button>
            <button
              type="button"
              onClick={() => switchLoginMethod('phone')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg font-medium transition-all ${
                loginMethod === 'phone'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Phone className="w-4 h-4" />
              {t('auth.phone')}
            </button>
          </div>

          {/* Email Form */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 dark:bg-red-900/30">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('login.emailAddress')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder={t('login.emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder={t('login.passwordPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link prefetch={false}
                  href={returnUrl ? `/forgot-password?return_url=${encodeURIComponent(returnUrl)}` : '/forgot-password'}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-all group flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>{t('login.signingIn')}</span>
                ) : (
                  <>
                    <span>{t('login.signIn')}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Phone Form */}
          {loginMethod === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 dark:bg-red-900/30">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.phone')}
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-28 px-2 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    {countryCodes.map((cc) => (
                      <option key={cc.code} value={cc.code}>
                        {cc.country} +{cc.code}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      required
                      maxLength={currentCountry.maxLength}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder={t('settings.profile.phonePlaceholder')}
                    />
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {currentCountry.minLength === currentCountry.maxLength
                    ? `${currentCountry.minLength} digits required`
                    : `${currentCountry.minLength}-${currentCountry.maxLength} digits required`}
                </p>
              </div>

              <div>
                <label htmlFor="phonePassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="phonePassword"
                    type="password"
                    value={phonePassword}
                    onChange={(e) => setPhonePassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder={t('login.passwordPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link prefetch={false}
                  href={returnUrl ? `/forgot-password?return_url=${encodeURIComponent(returnUrl)}` : '/forgot-password'}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isPhoneValid}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-all group flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>{t('login.signingIn')}</span>
                ) : (
                  <>
                    <span>{t('login.signIn')}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

              {/* Social Login - only show for email login */}
              {loginMethod === 'email' && (
                <>
                  <SocialLoginDivider />
                  <SocialLoginButtons appleEnabled={appleEnabled} returnUrl={returnUrl} />
                </>
              )}
            </div>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              {t('login.noAccount')}{' '}
              <Link prefetch={false} href="/register" className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                {t('login.signUp')}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
