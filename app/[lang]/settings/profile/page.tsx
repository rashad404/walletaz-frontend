'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/lib/navigation';
import {
  User,
  Mail,
  Phone,
  Save,
  Loader2,
  ChevronLeft,
  Camera,
  Globe
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TIMEZONES } from '@/lib/utils/date';

export default function ProfileSettingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.lang as string) || 'az';

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    timezone: 'Asia/Baku'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push(`/login`);
      return;
    }

    // Fetch user data
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setUser(data.data);
          setFormData({
            name: data.data.name || '',
            email: data.data.email || '',
            phone: data.data.phone ? String(data.data.phone) : '',
            timezone: data.data.timezone || 'Asia/Baku'
          });
        }
      })
      .catch(err => {
        console.error('Failed to fetch user:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router, locale]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: t('settings.profile.imageTooBig') });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: t('settings.profile.onlyImages') });
        return;
      }

      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setErrors({});
    setSaving(true);

    try {
      const token = localStorage.getItem('token');

      // Use FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('_method', 'PUT'); // Laravel method spoofing for file uploads
      formDataToSend.append('name', String(formData.name));
      formDataToSend.append('email', String(formData.email));
      formDataToSend.append('phone', formData.phone ? String(formData.phone) : '');
      formDataToSend.append('timezone', formData.timezone);

      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: t('settings.profile.updateSuccess') });
        const updatedUser = data.data;
        setUser(updatedUser);

        // Update formData with the latest user info
        setFormData({
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone ? String(updatedUser.phone) : '',
          timezone: updatedUser.timezone || 'Asia/Baku'
        });

        setErrors({});
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        // Handle validation errors
        if (data.errors && typeof data.errors === 'object') {
          // Laravel validation errors format
          const fieldErrors: Record<string, string> = {};
          Object.keys(data.errors).forEach(field => {
            // Get first error message for each field
            fieldErrors[field] = Array.isArray(data.errors[field])
              ? data.errors[field][0]
              : data.errors[field];
          });
          setErrors(fieldErrors);
          setMessage({
            type: 'error',
            text: t('settings.profile.fixErrors')
          });
        } else {
          setMessage({ type: 'error', text: data.message || t('common.error') });
        }
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setMessage({ type: 'error', text: t('settings.profile.connectionError') });
    } finally {
      setSaving(false);
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('settings.profile.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('settings.profile.subtitle')}
          </p>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-sm ${
              message.type === 'success'
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-3xl p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30">
          {/* Profile Photo Section */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative">
              {/* Avatar Display */}
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                {avatarPreview || user.avatar ? (
                  <img
                    src={avatarPreview || user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-4xl font-bold">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Upload Button Overlay */}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors"
              >
                <Camera className="w-5 h-5 text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.profile.profilePhoto')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('settings.profile.photoHint')}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t('settings.profile.name')} *
                </div>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 rounded-2xl border ${
                  errors.name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                placeholder={t('settings.profile.namePlaceholder')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {t('auth.email')} *
                </div>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 rounded-2xl border ${
                  errors.email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {t('auth.phone')} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">({t('alerts.quickSetup.optional')})</span>
                </div>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-3 rounded-2xl border ${
                  errors.phone
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                placeholder="+994 XX XXX XX XX"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
              )}
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t('settings.profile.timezone')}
                </div>
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className={`w-full px-4 py-3 rounded-2xl border ${
                  errors.timezone
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('settings.profile.timezoneHint')}
              </p>
              {errors.timezone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.timezone}</p>
              )}
            </div>

          </div>

          {/* Submit Button */}
          <div className="mt-8 flex gap-4">
            <Link
              href={`/settings`}
              className="flex-1 px-6 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
            >
              {t('common.cancel')}
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t('common.save')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
