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

  // Phone verification state
  const [phoneStep, setPhoneStep] = useState<VerificationStep>('idle');
  const [countryCode, setCountryCode] = useState('994');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Get current country code config
  const currentCountry = countryCodes.find(cc => cc.code === countryCode) || countryCodes[0];

  // Validate phone length for current country
  const isPhoneValid = phoneNumber.length >= currentCountry.minLength && phoneNumber.length <= currentCountry.maxLength;

  // Format full phone number for API
  const getFullPhoneNumber = () => `${countryCode}${phoneNumber}`;

  // Format display phone number
  const getDisplayPhone = () => `+${countryCode} ${phoneNumber}`;

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
        // Parse existing phone number by matching country codes
        if (userData.phone) {
          const phone = userData.phone.replace(/\D/g, '');
          // Try to match against known country codes (longest first)
          const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
          for (const cc of sortedCodes) {
            if (phone.startsWith(cc.code)) {
              setCountryCode(cc.code);
              setPhoneNumber(phone.slice(cc.code.length));
              break;
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
    if (!isPhoneValid) {
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
                        value={countryCode}
                        onChange={(e) => {
                          setCountryCode(e.target.value);
                          setPhoneNumber(''); // Reset phone number when country changes
                        }}
                        className="w-28 px-2 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                      >
                        {countryCodes.map((cc) => (
                          <option key={cc.code} value={cc.code}>
                            {cc.country} +{cc.code}
                          </option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, currentCountry.maxLength))}
                          placeholder={t('settings.profile.phonePlaceholder')}
                          maxLength={currentCountry.maxLength}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 tracking-wider"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentCountry.minLength === currentCountry.maxLength
                        ? `${currentCountry.minLength} digits required`
                        : `${currentCountry.minLength}-${currentCountry.maxLength} digits required`}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => sendPhoneCode()}
                        disabled={!isPhoneValid}
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
                              const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
                              for (const cc of sortedCodes) {
                                if (phone.startsWith(cc.code)) {
                                  setCountryCode(cc.code);
                                  setPhoneNumber(phone.slice(cc.code.length));
                                  break;
                                }
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
