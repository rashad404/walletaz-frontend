'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/lib/navigation';
import {
  Phone,
  Mail,
  ChevronLeft,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import authService from '@/lib/api/auth';

type VerificationStep = 'idle' | 'sending' | 'code_sent' | 'verifying';

export default function VerificationPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.lang as string) || 'az';

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Phone verification state
  const [phoneStep, setPhoneStep] = useState<VerificationStep>('idle');
  const [phonePrefix, setPhonePrefix] = useState('050');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Azerbaijan mobile operator prefixes
  const phonePrefixes = ['050', '051', '055', '070', '077', '099', '010', '060'];

  // Format full phone number for API (994XXYYYYYY)
  const getFullPhoneNumber = () => `994${phonePrefix.slice(1)}${phoneNumber}`;

  // Format display phone number
  const getDisplayPhone = () => `+994 ${phonePrefix.slice(1)} ${phoneNumber}`;

  // Email verification state
  const [emailStep, setEmailStep] = useState<VerificationStep>('idle');
  const [emailCode, setEmailCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailCountdown, setEmailCountdown] = useState(0);

  // Fetch user data
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push(`/login`);
      return;
    }

    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        // Parse existing phone number (format: 994XXYYYYYY)
        if (userData.phone) {
          const phone = userData.phone.replace(/\D/g, '');
          if (phone.startsWith('994') && phone.length === 12) {
            const prefix = '0' + phone.slice(3, 5);
            const number = phone.slice(5);
            if (phonePrefixes.includes(prefix)) {
              setPhonePrefix(prefix);
              setPhoneNumber(number);
            }
          }
        }
      } else {
        router.push(`/login`);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      router.push(`/login`);
    } finally {
      setLoading(false);
    }
  }, [router, locale]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Phone countdown timer
  useEffect(() => {
    if (phoneCountdown > 0) {
      const timer = setTimeout(() => setPhoneCountdown(phoneCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneCountdown]);

  // Email countdown timer
  useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCountdown]);

  // Send phone verification code
  const sendPhoneCode = async () => {
    if (phoneNumber.length !== 7) {
      setPhoneError(t('verification.invalidPhoneNumber'));
      return;
    }

    setPhoneStep('sending');
    setPhoneError('');

    try {
      const fullPhone = getFullPhoneNumber();
      const response = await authService.sendPhoneVerificationForUser(fullPhone);
      if (response.status === 'success') {
        setPhoneStep('code_sent');
        setPhoneCountdown(60);
      } else {
        setPhoneError(t('verification.verificationFailed'));
        setPhoneStep('idle');
      }
    } catch (error: any) {
      setPhoneError(t('verification.verificationFailed'));
      setPhoneStep('idle');
    }
  };

  // Verify phone code
  const verifyPhoneCode = async () => {
    if (phoneCode.length !== 6) {
      setPhoneError(t('verification.invalidCode'));
      return;
    }

    setPhoneStep('verifying');
    setPhoneError('');

    try {
      const response = await authService.verifyPhoneForUser({
        phone: getFullPhoneNumber(),
        code: phoneCode,
      });

      if (response.status === 'success') {
        await fetchUser();
        setPhoneStep('idle');
        setPhoneCode('');
        setIsEditingPhone(false);
      } else {
        setPhoneError(t('verification.invalidCode'));
        setPhoneStep('code_sent');
      }
    } catch (error: any) {
      setPhoneError(t('verification.invalidCode'));
      setPhoneStep('code_sent');
    }
  };

  // Send email verification code
  const sendEmailCode = async () => {
    if (!user?.email) {
      setEmailError(t('verification.notSet'));
      return;
    }

    setEmailStep('sending');
    setEmailError('');

    try {
      const response = await authService.sendEmailVerificationForUser(user.email);
      if (response.status === 'success') {
        setEmailStep('code_sent');
        setEmailCountdown(60);
      } else {
        setEmailError(t('verification.verificationFailed'));
        setEmailStep('idle');
      }
    } catch (error: any) {
      setEmailError(t('verification.verificationFailed'));
      setEmailStep('idle');
    }
  };

  // Verify email code
  const verifyEmailCode = async () => {
    if (emailCode.length !== 6) {
      setEmailError(t('verification.invalidCode'));
      return;
    }

    setEmailStep('verifying');
    setEmailError('');

    try {
      const response = await authService.verifyEmailForUser({
        email: user.email,
        code: emailCode,
      });

      if (response.status === 'success') {
        await fetchUser();
        setEmailStep('idle');
        setEmailCode('');
      } else {
        setEmailError(t('verification.invalidCode'));
        setEmailStep('code_sent');
      }
    } catch (error: any) {
      setEmailError(t('verification.invalidCode'));
      setEmailStep('code_sent');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isPhoneVerified = !!user.phone_verified_at;
  const isEmailVerified = !!user.email_verified_at;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 bg-white dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/settings`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            {t('settings.backToSettings')}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('verification.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('verification.subtitle')}
          </p>
        </div>

        {/* Why Verify Banner */}
        <div className="rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                {t('verification.verifyOnce')}
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                {t('verification.whyVerifyPhone')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Phone Verification Section */}
          <div className="rounded-3xl p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {t('verification.phoneTitle')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('verification.whyVerifyPhone')}
                </p>
              </div>
            </div>

            {/* Phone Status Card */}
            <div className={`rounded-2xl p-4 mb-4 ${
              isPhoneVerified
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : user.phone
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isPhoneVerified
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    {isPhoneVerified ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Phone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${
                      isPhoneVerified
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {isPhoneVerified ? t('verification.verified') : (user.phone ? t('verification.pending') : t('verification.notSet'))}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.phone || t('verification.addPhone')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isPhoneVerified
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {isPhoneVerified ? t('verification.active') : t('verification.inactive')}
                </span>
              </div>
            </div>

            {/* Phone Verification Form */}
            {!isPhoneVerified && (
              <div className="space-y-4">
                {phoneStep === 'idle' && !isEditingPhone && user.phone && (
                  <button
                    onClick={() => sendPhoneCode()}
                    className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-medium"
                  >
                    {t('verification.sendCode')}
                  </button>
                )}

                {phoneStep === 'idle' && (isEditingPhone || !user.phone) && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <select
                        value={phonePrefix}
                        onChange={(e) => setPhonePrefix(e.target.value)}
                        className="px-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                      >
                        {phonePrefixes.map((prefix) => (
                          <option key={prefix} value={prefix}>
                            {prefix}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 7))}
                        placeholder="XXX XX XX"
                        maxLength={7}
                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 tracking-wider"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => sendPhoneCode()}
                        disabled={phoneNumber.length !== 7}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {t('verification.sendCode')}
                      </button>
                      {user.phone && (
                        <button
                          onClick={() => {
                            setIsEditingPhone(false);
                            // Reset to user's current phone
                            if (user.phone) {
                              const phone = user.phone.replace(/\D/g, '');
                              if (phone.startsWith('994') && phone.length === 12) {
                                setPhonePrefix('0' + phone.slice(3, 5));
                                setPhoneNumber(phone.slice(5));
                              }
                            }
                          }}
                          className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {phoneStep === 'sending' && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{t('verification.sending')}</span>
                  </div>
                )}

                {phoneStep === 'code_sent' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      {t('verification.codeSentTo', { destination: getDisplayPhone() })}
                    </p>
                    <input
                      type="text"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder={t('verification.codePlaceholder')}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-2xl tracking-widest"
                      maxLength={6}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => verifyPhoneCode()}
                        disabled={phoneCode.length !== 6}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {t('verification.verify')}
                      </button>
                      <button
                        onClick={() => {
                          setPhoneStep('idle');
                          setPhoneCode('');
                        }}
                        className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t('common.back')}
                      </button>
                    </div>
                    <div className="text-center">
                      {phoneCountdown > 0 ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {t('verification.resendIn', { seconds: phoneCountdown })}
                        </span>
                      ) : (
                        <button
                          onClick={() => sendPhoneCode()}
                          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mx-auto"
                        >
                          <RefreshCw className="w-4 h-4" />
                          {t('verification.resendCode')}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {phoneStep === 'verifying' && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{t('verification.verifying')}</span>
                  </div>
                )}

                {phoneError && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {phoneError}
                  </div>
                )}

                {isPhoneVerified === false && user.phone && phoneStep === 'idle' && !isEditingPhone && (
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {t('verification.changePhone')}
                  </button>
                )}
              </div>
            )}

            {isPhoneVerified && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="w-5 h-5" />
                <span className="font-medium">{t('verification.verificationSuccess')}</span>
              </div>
            )}
          </div>

          {/* Email Verification Section */}
          <div className="rounded-3xl p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {t('verification.emailTitle')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('verification.whyVerifyEmail')}
                </p>
              </div>
            </div>

            {/* Email Status Card */}
            <div className={`rounded-2xl p-4 mb-4 ${
              isEmailVerified
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : user.email
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isEmailVerified
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    {isEmailVerified ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${
                      isEmailVerified
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {isEmailVerified ? t('verification.verified') : (user.email ? t('verification.pending') : t('verification.notSet'))}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email || t('verification.notSet')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isEmailVerified
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {isEmailVerified ? t('verification.active') : t('verification.inactive')}
                </span>
              </div>
            </div>

            {/* Email Verification Form */}
            {!isEmailVerified && user.email && (
              <div className="space-y-4">
                {emailStep === 'idle' && (
                  <button
                    onClick={() => sendEmailCode()}
                    className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-medium"
                  >
                    {t('verification.sendCode')}
                  </button>
                )}

                {emailStep === 'sending' && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{t('verification.sending')}</span>
                  </div>
                )}

                {emailStep === 'code_sent' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      {t('verification.codeSentTo', { destination: user.email })}
                    </p>
                    <input
                      type="text"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder={t('verification.codePlaceholder')}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-2xl tracking-widest"
                      maxLength={6}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => verifyEmailCode()}
                        disabled={emailCode.length !== 6}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {t('verification.verify')}
                      </button>
                      <button
                        onClick={() => {
                          setEmailStep('idle');
                          setEmailCode('');
                        }}
                        className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t('common.back')}
                      </button>
                    </div>
                    <div className="text-center">
                      {emailCountdown > 0 ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {t('verification.resendIn', { seconds: emailCountdown })}
                        </span>
                      ) : (
                        <button
                          onClick={() => sendEmailCode()}
                          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mx-auto"
                        >
                          <RefreshCw className="w-4 h-4" />
                          {t('verification.resendCode')}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {emailStep === 'verifying' && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{t('verification.verifying')}</span>
                  </div>
                )}

                {emailError && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {emailError}
                  </div>
                )}
              </div>
            )}

            {isEmailVerified && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="w-5 h-5" />
                <span className="font-medium">{t('verification.verificationSuccess')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
