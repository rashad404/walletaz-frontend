'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/lib/navigation';
import {
  Shield,
  ChevronLeft,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Key
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TwoFactorStatus {
  enabled: boolean;
  confirmed: boolean;
  recovery_codes_count: number;
}

interface SetupData {
  secret: string;
  qr_code_url: string;
  recovery_codes: string[];
}

export default function TwoFactorPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.lang as string) || 'az';

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [step, setStep] = useState<'status' | 'setup' | 'confirm' | 'recovery'>('status');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push(`/${locale}/login`);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/2fa/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.status === 'success') {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!password) {
      setMessage({ type: 'error', text: t('settings.security.passwordRequired') || 'Password is required' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setSetupData(data.data);
        setStep('setup');
        setPassword('');
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('common.error') || 'An error occurred' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (verificationCode.length !== 6) {
      setMessage({ type: 'error', text: t('settings.security.invalidCode') || 'Enter a valid 6-digit code' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/2fa/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setStep('recovery');
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('common.error') || 'An error occurred' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!password) {
      setMessage({ type: 'error', text: t('settings.security.passwordRequired') || 'Password is required' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password, code: verificationCode }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setStatus({ enabled: false, confirmed: false, recovery_codes_count: 0 });
        setStep('status');
        setPassword('');
        setVerificationCode('');
        setMessage({ type: 'success', text: t('settings.security.twoFactorDisabled') || 'Two-factor authentication disabled' });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('common.error') || 'An error occurred' });
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyAllRecoveryCodes = () => {
    if (setupData?.recovery_codes) {
      navigator.clipboard.writeText(setupData.recovery_codes.join('\n'));
      setCopiedCode('all');
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const finishSetup = () => {
    setSetupData(null);
    setStep('status');
    fetchStatus();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 bg-white dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link
          href={`/settings/security`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('settings.backToSettings') || 'Back to Settings'}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('settings.security.twoFactor') || 'Two-Factor Authentication'}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-[60px]">
            {t('settings.security.twoFactorDesc') || 'Add an extra layer of security to your account'}
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <p className={`text-sm ${
              message.type === 'success'
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Status View */}
        {step === 'status' && (
          <div className="rounded-3xl p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30">
            {status?.enabled ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {t('settings.security.twoFactorEnabled') || '2FA is Enabled'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.security.recoveryCodesRemaining') || 'Recovery codes remaining'}: {status.recovery_codes_count}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.security.currentPassword') || 'Current Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder={t('settings.security.currentPasswordPlaceholder') || 'Enter your password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.security.verificationCode') || 'Verification Code'} ({t('common.optional') || 'optional'})
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>

                  <button
                    onClick={handleDisable}
                    disabled={actionLoading}
                    className="w-full px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>{t('settings.security.disable2FA') || 'Disable 2FA'}</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {t('settings.security.twoFactorDisabledTitle') || '2FA is Not Enabled'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.security.twoFactorDisabledDesc') || 'Enable 2FA for extra security'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.security.currentPassword') || 'Current Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder={t('settings.security.currentPasswordPlaceholder') || 'Enter your password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleEnable}
                    disabled={actionLoading}
                    className="w-full px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        {t('settings.security.enable2FA') || 'Enable 2FA'}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Setup View */}
        {step === 'setup' && setupData && (
          <div className="rounded-3xl p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('settings.security.setupAuthenticator') || 'Set Up Authenticator'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('settings.security.scanQRCode') || 'Scan this QR code with your authenticator app'}
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white rounded-2xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qr_code_url)}`}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Manual entry code */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
                {t('settings.security.orEnterManually') || 'Or enter this code manually:'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <code className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-mono text-sm">
                  {setupData.secret}
                </code>
                <button
                  onClick={() => copyToClipboard(setupData.secret)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === setupData.secret ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Verification code input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.security.enterCodeFromApp') || 'Enter the 6-digit code from your app'}
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleConfirm}
                disabled={actionLoading || verificationCode.length !== 6}
                className="w-full px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>{t('settings.security.verifyAndEnable') || 'Verify & Enable'}</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Recovery Codes View */}
        {step === 'recovery' && setupData && (
          <div className="rounded-3xl p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('settings.security.recoveryCodes') || 'Recovery Codes'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('settings.security.saveRecoveryCodes') || 'Save these codes in a safe place'}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {t('settings.security.recoveryCodesWarning') || 'Each code can only be used once. Store them securely - you will need them if you lose access to your authenticator app.'}
                </p>
              </div>
            </div>

            {/* Recovery codes grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {setupData.recovery_codes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl"
                >
                  <code className="font-mono text-sm">{code}</code>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {copiedCode === code ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={copyAllRecoveryCodes}
                className="flex-1 px-6 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
              >
                {copiedCode === 'all' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    {t('common.copied') || 'Copied!'}
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    {t('settings.security.copyAllCodes') || 'Copy All'}
                  </>
                )}
              </button>
              <button
                onClick={finishSetup}
                className="flex-1 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {t('settings.security.done') || 'Done'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
