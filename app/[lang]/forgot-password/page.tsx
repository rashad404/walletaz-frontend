'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { Mail, Lock, ArrowLeft, Loader2, Check, KeyRound, Wallet } from 'lucide-react';

type Step = 'email' | 'code' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return_url');

  // Check if this is OAuth popup flow (has return_url with oauth/authorize or oauth/approve)
  const isOAuthFlow = returnUrl?.includes('oauth/authorize') || returnUrl?.includes('oauth/approve');

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || t('forgotPassword.errors.sendFailed'));
      }

      setStep('code');
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || t('forgotPassword.errors.sendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(t('forgotPassword.errors.invalidCode'));
      }

      setResetToken(data.data.reset_token);
      setStep('password');
    } catch (err: any) {
      setError(err.message || t('forgotPassword.errors.invalidCode'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordConfirm'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.errors.passwordMin'));
      return;
    }

    setIsLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          reset_token: resetToken,
          password,
          password_confirmation: confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || t('forgotPassword.errors.resetFailed'));
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message || t('forgotPassword.errors.resetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setError('');
    setIsLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || t('forgotPassword.errors.sendFailed'));
      }

      setCountdown(60);
    } catch (err: any) {
      setError(err.message || t('forgotPassword.errors.sendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const maskEmail = (email: string) => {
    const [name, domain] = email.split('@');
    if (name.length <= 2) return email;
    return `${name.slice(0, 2)}${'*'.repeat(name.length - 2)}@${domain}`;
  };

  // Compact OAuth popup design - matches login page style
  if (isOAuthFlow) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
        {/* Header with Wallet.az branding */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Wallet.az</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {/* Success State */}
          {step === 'success' ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {t('forgotPassword.success.title')}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                {t('forgotPassword.success.message')}
              </p>
              <Link
                href={`/login?return_url=${encodeURIComponent(returnUrl)}`}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {t('forgotPassword.success.loginButton')}
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-4">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {step === 'email' && t('forgotPassword.title')}
                  {step === 'code' && t('forgotPassword.verifyTitle')}
                  {step === 'password' && t('forgotPassword.newPasswordTitle')}
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {step === 'email' && t('forgotPassword.description')}
                  {step === 'code' && t('forgotPassword.codeSentTo', { email: maskEmail(email) })}
                  {step === 'password' && t('forgotPassword.newPasswordDescription')}
                </p>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 mb-3">
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Step 1: Email */}
              {step === 'email' && (
                <form onSubmit={handleSendCode} className="space-y-3">
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('auth.email')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder={t('login.emailPlaceholder')}
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
                      t('forgotPassword.sendCode')
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Code */}
              {step === 'code' && (
                <form onSubmit={handleVerifyCode} className="space-y-3">
                  <div>
                    <label htmlFor="code" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('forgotPassword.code')}
                    </label>
                    <input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-center text-xl tracking-widest font-mono"
                      placeholder="------"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || code.length < 6}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t('forgotPassword.verify')
                    )}
                  </button>

                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('forgotPassword.resendIn', { seconds: countdown })}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={isLoading}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                      >
                        {t('forgotPassword.resendCode')}
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Step 3: New Password */}
              {step === 'password' && (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('forgotPassword.newPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="********"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('forgotPassword.passwordHint')}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('forgotPassword.confirmPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="********"
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
                      t('forgotPassword.resetPassword')
                    )}
                  </button>
                </form>
              )}

              {/* Back to Login */}
              <p className="mt-4 text-center">
                <Link
                  href={`/login?return_url=${encodeURIComponent(returnUrl)}`}
                  className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  {t('forgotPassword.backToLogin')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Success screen
  if (step === 'success') {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-[-10]">
          <div className="absolute inset-0 mesh-gradient opacity-30" />
        </div>

        <div className="w-full max-w-md px-6 py-12">
          <div className="card-glass rounded-3xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('forgotPassword.success.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('forgotPassword.success.message')}
            </p>
            <Link
              href={returnUrl ? `/login?return_url=${encodeURIComponent(returnUrl)}` : '/login'}
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all"
            >
              {t('forgotPassword.success.loginButton')}
            </Link>
          </div>
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {step === 'email' && t('forgotPassword.title')}
            {step === 'code' && t('forgotPassword.verifyTitle')}
            {step === 'password' && t('forgotPassword.newPasswordTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'email' && t('forgotPassword.description')}
            {step === 'code' && t('forgotPassword.codeSentTo', { email: maskEmail(email) })}
            {step === 'password' && t('forgotPassword.newPasswordDescription')}
          </p>
        </div>

        {/* Form Card */}
        <div className="card-glass rounded-3xl p-8">
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.email')}
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('forgotPassword.sendCode')
                )}
              </button>
            </form>
          )}

          {/* Step 2: Code */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('forgotPassword.code')}
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-center text-2xl tracking-widest font-mono"
                  placeholder="------"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length < 6}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('forgotPassword.verify')
                )}
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('forgotPassword.resendIn', { seconds: countdown })}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                  >
                    {t('forgotPassword.resendCode')}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('forgotPassword.newPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="********"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('forgotPassword.passwordHint')}
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('forgotPassword.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="********"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('forgotPassword.resetPassword')
                )}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href={returnUrl ? `/login?return_url=${encodeURIComponent(returnUrl)}` : '/login'}
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
