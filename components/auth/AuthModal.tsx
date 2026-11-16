'use client';

import { setSessionToken } from '@/lib/session';

import { useState } from 'react';
import { X, Mail, Lock, User, Loader2, CheckSquare, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  returnUrl?: string;
  message?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  message
}: AuthModalProps) {
  const t = useTranslations('login');
  const tReg = useTranslations('register');
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Store current URL as return URL when modal opens
  if (isOpen && typeof window !== 'undefined') {
    const currentUrl = sessionStorage.getItem('return_url');
    if (!currentUrl) {
      sessionStorage.setItem('return_url', window.location.pathname);
    }
  }

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Store auth token
        if (data.data?.token) {
          await setSessionToken(data.data.token);
        }

        // Dispatch custom event to notify Header and other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('authStateChanged'));
        }

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }

        onClose();

        // If no onSuccess callback, handle redirect here
        if (!onSuccess) {
          const returnUrl = sessionStorage.getItem('return_url');
          if (returnUrl) {
            sessionStorage.removeItem('return_url');
            router.push(returnUrl);
          }
        }
      } else {
        setError(data.message || t('invalidCredentials'));
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (registerPassword !== registerConfirmPassword) {
      setError(tReg('passwordsDoNotMatch'));
      return;
    }

    if (registerPassword.length < 8) {
      setError(tReg('passwordMin8'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          password_confirmation: registerConfirmPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Store auth token
        if (data.data?.token) {
          await setSessionToken(data.data.token);
        }

        // Dispatch custom event to notify Header and other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('authStateChanged'));
        }

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }

        onClose();

        // If no onSuccess callback, handle redirect here
        if (!onSuccess) {
          const returnUrl = sessionStorage.getItem('return_url');
          if (returnUrl) {
            sessionStorage.removeItem('return_url');
            router.push(returnUrl);
          }
        }
      } else {
        setError(data.message || tReg('registrationFailed'));
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(tReg('registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CheckSquare className="w-12 h-12 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {activeTab === 'login' ? t('welcomeBack') : tReg('createAccount')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'login' ? t('signInToManage') : tReg('startMonitoring')}
            </p>
          </div>

          {/* Custom Message */}
          {message && (
            <div className="mb-6 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-indigo-900 dark:text-indigo-200 text-center">
                {message}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            <button
              onClick={() => {
                setActiveTab('login');
                setError('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('signIn')}
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setError('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tReg('createAccount')}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('emailAddress')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary group flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('signingIn')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('signIn')}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tReg('fullName')}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder={tReg('namePlaceholder')}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tReg('emailAddress')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder={tReg('emailPlaceholder')}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tReg('password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder={tReg('passwordPlaceholder')}
                    required
                    minLength={8}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tReg('confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    placeholder={tReg('passwordPlaceholder')}
                    required
                    minLength={8}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary group flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{tReg('creatingAccount')}</span>
                  </>
                ) : (
                  <>
                    <span>{tReg('createAccount')}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
