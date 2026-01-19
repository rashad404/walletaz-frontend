'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/lib/navigation';
import {
  Shield,
  Lock,
  ChevronLeft,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  ChevronRight,
  Monitor,
  Smartphone,
  Key,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TwoFactorStatus {
  enabled: boolean;
  confirmed: boolean;
  recovery_codes_count: number;
}

interface SessionCount {
  count: number;
}

interface AlertCount {
  count: number;
}

export default function SecuritySettingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.lang as string) || 'az';

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [alertCount, setAlertCount] = useState<number>(0);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push(`/${locale}/login`);
        return;
      }

      const [twoFactorRes, sessionsRes, alertsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/2fa/status`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/security/sessions`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/login-alerts`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => ({ json: () => ({ status: 'error' }) })),
      ]);

      const twoFactorData = await twoFactorRes.json();
      const sessionsData = await sessionsRes.json();
      const alertsData = await alertsRes.json();

      if (twoFactorData.status === 'success') {
        setTwoFactorStatus(twoFactorData.data);
      }
      if (sessionsData.status === 'success') {
        setSessionCount(sessionsData.data.sessions.length);
      }
      if (alertsData.status === 'success') {
        setAlertCount(alertsData.data.alerts?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.current_password || !formData.new_password || !formData.new_password_confirmation) {
      setMessage({ type: 'error', text: t('settings.security.allFieldsRequired') || 'All fields are required' });
      return;
    }

    if (formData.new_password.length < 6) {
      setMessage({ type: 'error', text: t('settings.security.passwordMinLength') || 'Password must be at least 6 characters' });
      return;
    }

    if (formData.new_password !== formData.new_password_confirmation) {
      setMessage({ type: 'error', text: t('settings.security.passwordsMismatch') || 'Passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push(`/${locale}/login`);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: t('settings.security.passwordChanged') || 'Password changed successfully' });
        setFormData({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });
      } else {
        if (data.message === 'Current password is incorrect') {
          setMessage({ type: 'error', text: t('settings.security.currentPasswordIncorrect') || 'Current password is incorrect' });
        } else if (data.message === 'Cannot change password for OAuth users') {
          setMessage({ type: 'error', text: t('settings.security.oauthNoPassword') || 'Cannot change password for social login users' });
        } else if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ');
          setMessage({ type: 'error', text: errorMessages as string });
        } else {
          setMessage({ type: 'error', text: data.message || t('common.error') });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('settings.profile.connectionError') || 'Connection error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href={`/settings`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('settings.backToSettings') || 'Back to Settings'}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {t('settings.security.title') || 'Security'}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-[60px]">
            {t('settings.security.subtitle') || 'Manage your account security settings'}
          </p>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {message.type === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
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

        {/* Security Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Two-Factor Authentication */}
          <Link
            href={`/settings/security/two-factor`}
            className="rounded-3xl p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  twoFactorStatus?.enabled
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-amber-100 dark:bg-amber-900/30'
                }`}>
                  <Key className={`w-6 h-6 ${
                    twoFactorStatus?.enabled
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {t('settings.security.twoFactor') || 'Two-Factor Authentication'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dataLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : twoFactorStatus?.enabled ? (
                      <span className="text-green-600 dark:text-green-400">
                        {t('settings.security.enabled') || 'Enabled'}
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">
                        {t('settings.security.notEnabled') || 'Not enabled'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
            </div>
          </Link>

          {/* Active Sessions */}
          <Link
            href={`/settings/security/sessions`}
            className="rounded-3xl p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {t('settings.security.activeSessions') || 'Active Sessions'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dataLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : (
                      `${sessionCount} ${t('settings.security.activeDevices') || 'active devices'}`
                    )}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </div>
          </Link>

          {/* Login Alerts */}
          {alertCount > 0 && (
            <div className="rounded-3xl p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900 dark:text-amber-300">
                    {t('settings.security.loginAlerts') || 'Login Alerts'}
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {alertCount} {t('settings.security.unacknowledgedAlerts') || 'unacknowledged alerts'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Form */}
        <div className="rounded-3xl p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('settings.security.changePassword') || 'Change Password'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.security.currentPassword') || 'Current Password'}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="current_password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                  placeholder={t('settings.security.currentPasswordPlaceholder') || 'Enter current password'}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.security.newPassword') || 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="new_password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                  placeholder={t('settings.security.newPasswordPlaceholder') || 'Enter new password'}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('settings.security.passwordHint') || 'Must be at least 8 characters'}
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="new_password_confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.security.confirmPassword') || 'Confirm New Password'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="new_password_confirmation"
                  name="new_password_confirmation"
                  value={formData.new_password_confirmation}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                  placeholder={t('settings.security.confirmPasswordPlaceholder') || 'Re-enter new password'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Link
                href={`/settings`}
                className="flex-1 px-6 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
              >
                {t('common.cancel') || 'Cancel'}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('settings.security.changing') || 'Changing...'}
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    {t('settings.security.changePassword') || 'Change Password'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Tips */}
        <div className="mt-8 rounded-3xl p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-3">
            {t('settings.security.tipsTitle') || 'Security Tips'}
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">1.</span>
              <span>{t('settings.security.tip1') || 'Use a strong, unique password that you don\'t use elsewhere'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">2.</span>
              <span>{t('settings.security.tip2') || 'Enable two-factor authentication for extra security'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">3.</span>
              <span>{t('settings.security.tip3') || 'Regularly review your active sessions and connected apps'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">4.</span>
              <span>{t('settings.security.tip4') || 'Never share your password or recovery codes with anyone'}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
