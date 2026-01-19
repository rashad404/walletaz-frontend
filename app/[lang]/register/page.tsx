'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Link } from '@/lib/navigation';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppLogo } from '@/components/ui/app-logo';
import { SocialLoginButtons, SocialLoginDivider } from '@/components/auth/SocialLoginButtons';

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return_url');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if this is OAuth popup flow (has return_url with oauth/authorize or oauth/approve)
  const isOAuthFlow = returnUrl?.includes('oauth/authorize') || returnUrl?.includes('oauth/approve');

  // Redirect to dashboard if already logged in
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordsDoNotMatch'));
      return;
    }

    if (formData.password.length < 8) {
      setError(t('register.passwordMin8'));
      return;
    }

    setIsLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        // Map backend errors to frontend translations
        if (data.errors) {
          const errorKey = Object.keys(data.errors)[0];
          const errorMsg = data.errors[errorKey]?.[0]?.toLowerCase() || '';

          if (errorKey === 'email') {
            if (errorMsg.includes('taken') || errorMsg.includes('already')) {
              throw new Error(t('auth.errors.emailTaken'));
            } else if (errorMsg.includes('required')) {
              throw new Error(t('auth.errors.emailRequired'));
            } else if (errorMsg.includes('valid') || errorMsg.includes('invalid')) {
              throw new Error(t('auth.errors.emailInvalid'));
            }
          } else if (errorKey === 'password') {
            if (errorMsg.includes('required')) {
              throw new Error(t('auth.errors.passwordRequired'));
            } else if (errorMsg.includes('8') || errorMsg.includes('characters') || errorMsg.includes('min')) {
              throw new Error(t('auth.errors.passwordMin'));
            } else if (errorMsg.includes('confirm') || errorMsg.includes('match')) {
              throw new Error(t('auth.errors.passwordConfirm'));
            }
          } else if (errorKey === 'name') {
            throw new Error(t('auth.errors.nameRequired'));
          }
        }
        throw new Error(t('auth.errors.registrationFailed'));
      }

      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        if (returnUrl) {
          window.location.href = returnUrl;
        } else {
          router.push('/wallet');
        }
      } else {
        throw new Error('No token received from server');
      }
    } catch (err: any) {
      setError(err.message || t('auth.errors.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Compact OAuth popup design - matches authorize page style
  if (isOAuthFlow) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
        {/* Header with Kimlik.az branding */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <AppLogo size="sm" />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="text-center mb-3">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {t('register.createAccount')}
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('auth.createToContinue')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            {error && (
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('register.fullName')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={t('register.namePlaceholder')}
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('register.emailAddress')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={t('register.emailPlaceholder')}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('register.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={t('register.passwordPlaceholder')}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                {t('register.mustBe8Chars')}
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('register.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={t('register.passwordPlaceholder')}
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start pt-1">
              <input
                id="terms"
                type="checkbox"
                required
                className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="ml-2 text-[11px] text-gray-600 dark:text-gray-400">
                {t('register.agreeToTerms')}{' '}
                <Link href="/terms" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  {t('register.termsOfService')}
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{t('register.createAccount')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Login for OAuth flow */}
          <SocialLoginDivider variant="compact" />
          <SocialLoginButtons returnUrl={returnUrl} variant="compact" />

          {/* Sign In Link */}
          <p className="mt-3 text-center text-xs text-gray-600 dark:text-gray-400">
            {t('register.alreadyHaveAccount')}{' '}
            <Link
              href={`/login${returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : ''}`}
              className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t('register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Standard full-page register design
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Background Effects */}
      <div className="fixed inset-0 z-[-10]">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
      </div>

      <div className="w-full max-w-md px-6 py-12">
        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('register.createAccount')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('register.startMonitoring')}
          </p>
        </div>

        {/* Register Form Card */}
        <div className="card-glass rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('register.fullName')}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={t('register.namePlaceholder')}
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('register.emailAddress')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={t('register.emailPlaceholder')}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('register.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={t('register.passwordPlaceholder')}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('register.mustBe8Chars')}
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('register.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={t('register.passwordPlaceholder')}
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                {t('register.agreeToTerms')}{' '}
                <Link href="/terms" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                  {t('register.termsOfService')}
                </Link>
                {' '}{t('register.and')}{' '}
                <Link href="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                  {t('register.privacyPolicy')}
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-all group flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>{t('register.creatingAccount')}</span>
              ) : (
                <>
                  <span>{t('register.createAccount')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Social Login */}
          <SocialLoginDivider />
          <SocialLoginButtons returnUrl={returnUrl} />
        </div>

        {/* Sign In Link */}
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('register.alreadyHaveAccount')}{' '}
          <Link href="/login" className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
            {t('register.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
