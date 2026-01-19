'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Link } from '@/lib/navigation';
import { Mail, Lock, ArrowRight, Loader2, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppLogo } from '@/components/ui/app-logo';

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

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return_url');

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

  // Get current country code config
  const currentCountry = countryCodes.find(cc => cc.code === countryCode) || countryCodes[0];

  // Validate phone length for current country
  const isPhoneValid = phoneNumber.length >= currentCountry.minLength && phoneNumber.length <= currentCountry.maxLength;

  // Check if this is OAuth popup flow
  const isOAuthFlow = returnUrl?.includes('oauth/authorize') || returnUrl?.includes('oauth/approve');

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      if (returnUrl) {
        window.location.href = returnUrl;
      } else {
        router.push('/dashboard');
      }
    }
  }, [router, returnUrl]);

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
        body: JSON.stringify({ email, password })
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

      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        if (returnUrl) {
          window.location.href = returnUrl;
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
        body: JSON.stringify({ phone: fullPhone, password: phonePassword })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        if (data.message?.toLowerCase().includes('credentials') || data.message?.toLowerCase().includes('invalid')) {
          throw new Error(t('login.invalidPhoneCredentials'));
        }
        throw new Error(t('auth.errors.loginFailed'));
      }

      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        if (returnUrl) {
          window.location.href = returnUrl;
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
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <AppLogo size="sm" />
        </div>

        <div className="flex-1 p-4">
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {t('login.signIn')}
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('auth.signInToContinue')}
            </p>
          </div>

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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder={t('login.emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password-compact" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password-compact"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder={t('login.passwordPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  href={`/forgot-password${returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : ''}`}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t('login.forgotPassword')}
                </Link>
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
                    className="w-28 px-2 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                <label htmlFor="phonePassword-compact" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="phonePassword-compact"
                    type="password"
                    value={phonePassword}
                    onChange={(e) => setPhonePassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder={t('login.passwordPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  href={`/forgot-password${returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : ''}`}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t('login.forgotPassword')}
                </Link>
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
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white dark:bg-gray-900 text-gray-500">
                {t('login.orContinueWith')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const params = returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : '';
              window.location.href = `${API_BASE_URL}/auth/google${params}`;
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('login.google')}</span>
          </button>

          <p className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400">
            {t('login.noAccount')}{' '}
            <Link
              href={`/register${returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : ''}`}
              className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t('login.signUp')}
            </Link>
          </p>
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
                <Link
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
                <Link
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
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/50 dark:bg-gray-900/50 text-gray-500">
                    {t('login.orContinueWith')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const params = returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : '';
                    window.location.href = `${API_BASE_URL}/auth/google${params}`;
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('login.google')}</span>
                </button>

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all"
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('login.facebook')}</span>
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('login.noAccount')}{' '}
          <Link href="/register" className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
            {t('login.signUp')}
          </Link>
        </p>
      </div>
    </div>
  );
}
