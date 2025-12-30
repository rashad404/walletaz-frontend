'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/lib/navigation';
import {
  Shield,
  Lock,
  ChevronLeft,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SecuritySettingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.lang as string) || 'az';

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear message when user starts typing
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Basic validation
    if (!formData.current_password || !formData.new_password || !formData.new_password_confirmation) {
      setMessage({ type: 'error', text: t('settings.security.allFieldsRequired') });
      return;
    }

    if (formData.new_password.length < 6) {
      setMessage({ type: 'error', text: t('settings.security.passwordMinLength') });
      return;
    }

    if (formData.new_password !== formData.new_password_confirmation) {
      setMessage({ type: 'error', text: t('settings.security.passwordsMismatch') });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push(`/login`);
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
        setMessage({ type: 'success', text: t('settings.security.passwordChanged') });
        // Clear form
        setFormData({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });
      } else {
        if (data.message === 'Current password is incorrect') {
          setMessage({ type: 'error', text: t('settings.security.currentPasswordIncorrect') });
        } else if (data.message === 'Cannot change password for OAuth users') {
          setMessage({ type: 'error', text: t('settings.security.oauthNoPassword') });
        } else if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ');
          setMessage({ type: 'error', text: errorMessages as string });
        } else {
          setMessage({ type: 'error', text: data.message || t('common.error') });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('settings.profile.connectionError') });
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
          {t('settings.backToSettings')}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {t('settings.security.title')}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-[60px]">
            {t('settings.security.subtitle')}
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

        {/* Change Password Form */}
        <div className="rounded-3xl p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('settings.security.changePassword')}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.security.currentPassword')}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="current_password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                  placeholder={t('settings.security.currentPasswordPlaceholder')}
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
                {t('settings.security.newPassword')}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="new_password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                  placeholder={t('settings.security.newPasswordPlaceholder')}
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
                {t('settings.security.passwordHint')}
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="new_password_confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.security.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="new_password_confirmation"
                  name="new_password_confirmation"
                  value={formData.new_password_confirmation}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                  placeholder={t('settings.security.confirmPasswordPlaceholder')}
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
                {t('common.cancel')}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('settings.security.changing')}
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    {t('settings.security.changePassword')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Tips */}
        <div className="mt-8 rounded-3xl p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-3">
            {t('settings.security.tipsTitle')}
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>{t('settings.security.tip1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>{t('settings.security.tip2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>{t('settings.security.tip3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>{t('settings.security.tip4')}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
