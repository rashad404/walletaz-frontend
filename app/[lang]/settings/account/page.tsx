'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/lib/navigation';
import {
  User,
  ChevronLeft,
  Loader2,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  LinkIcon,
  Unlink
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DeletionStatus {
  pending_deletion: boolean;
  requested_at?: string;
  scheduled_for?: string;
}

interface LinkedProviders {
  google: { linked: boolean };
  facebook: { linked: boolean };
  telegram: { linked: boolean; username?: string };
}

export default function AccountSettingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.lang as string) || 'az';

  const [loading, setLoading] = useState(true);
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [linkedProviders, setLinkedProviders] = useState<LinkedProviders | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [cancellationToken, setCancellationToken] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [exportData, setExportData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push(`/${locale}/login`);
        return;
      }

      const [deletionRes, providersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/security/deletion-status`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/linked-providers`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const deletionData = await deletionRes.json();
      const providersData = await providersRes.json();

      if (deletionData.status === 'success') {
        setDeletionStatus(deletionData.data);
      }
      if (providersData.status === 'success') {
        setLinkedProviders(providersData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!password) {
      setMessage({ type: 'error', text: t('settings.security.passwordRequired') || 'Password is required' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/security/export-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setExportData(data.data);
        setShowExportConfirm(false);
        setPassword('');

        // Download as JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kimlik-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setMessage({ type: 'success', text: t('settings.account.dataExported') || 'Your data has been exported' });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('common.error') || 'An error occurred' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!password) {
      setMessage({ type: 'error', text: t('settings.security.passwordRequired') || 'Password is required' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/security/request-deletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password, reason: deleteReason }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setCancellationToken(data.data.cancellation_token);
        setShowDeleteConfirm(false);
        setPassword('');
        setDeleteReason('');
        fetchData();
        setMessage({ type: 'success', text: t('settings.account.deletionScheduled') || `Account deletion scheduled for ${new Date(data.data.scheduled_for).toLocaleDateString()}` });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('common.error') || 'An error occurred' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!cancellationToken) {
      setMessage({ type: 'error', text: 'Cancellation token required' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/security/cancel-deletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cancellation_token: cancellationToken }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setCancellationToken('');
        fetchData();
        setMessage({ type: 'success', text: t('settings.account.deletionCancelled') || 'Account deletion cancelled' });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('common.error') || 'An error occurred' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlinkProvider = async (provider: string) => {
    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/unlink/${provider}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.status === 'success') {
        fetchData();
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('common.error') || 'An error occurred' });
    } finally {
      setActionLoading(false);
    }
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
          href={`/settings`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('settings.backToSettings') || 'Back to Settings'}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('settings.account.title') || 'Account Settings'}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-[60px]">
            {t('settings.account.subtitle') || 'Manage your account data and connected services'}
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

        {/* Linked Accounts */}
        {linkedProviders && (
          <div className="rounded-3xl p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <LinkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('settings.account.linkedAccounts') || 'Linked Accounts'}
              </h2>
            </div>

            <div className="space-y-3">
              {/* Google */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium text-gray-900 dark:text-white">Google</span>
                </div>
                {linkedProviders.google.linked ? (
                  <button
                    onClick={() => handleUnlinkProvider('google')}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <Unlink className="w-4 h-4" />
                    {t('settings.account.unlink') || 'Unlink'}
                  </button>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.account.notLinked') || 'Not linked'}
                  </span>
                )}
              </div>

              {/* Facebook */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="font-medium text-gray-900 dark:text-white">Facebook</span>
                </div>
                {linkedProviders.facebook.linked ? (
                  <button
                    onClick={() => handleUnlinkProvider('facebook')}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <Unlink className="w-4 h-4" />
                    {t('settings.account.unlink') || 'Unlink'}
                  </button>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.account.notLinked') || 'Not linked'}
                  </span>
                )}
              </div>

              {/* Telegram */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#0088cc" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-white">Telegram</span>
                    {linkedProviders.telegram?.username && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">@{linkedProviders.telegram.username}</span>
                    )}
                  </div>
                </div>
                {linkedProviders.telegram?.linked ? (
                  <button
                    onClick={() => handleUnlinkProvider('telegram')}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <Unlink className="w-4 h-4" />
                    {t('settings.account.unlink') || 'Unlink'}
                  </button>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.account.notLinked') || 'Not linked'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data Export */}
        <div className="rounded-3xl p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('settings.account.exportData') || 'Export Your Data'}
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('settings.account.exportDescription') || 'Download a copy of all your data including profile, transactions, and connected apps.'}
          </p>

          {!showExportConfirm ? (
            <button
              onClick={() => setShowExportConfirm(true)}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              {t('settings.account.exportButton') || 'Export Data'}
            </button>
          ) : (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.security.currentPassword') || 'Current Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowExportConfirm(false);
                    setPassword('');
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleExportData}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      {t('settings.account.export') || 'Export'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pending Deletion Status */}
        {deletionStatus?.pending_deletion && (
          <div className="rounded-3xl p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-300">
                  {t('settings.account.deletionPending') || 'Account Deletion Scheduled'}
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  {t('settings.account.deletionScheduledFor') || 'Scheduled for'}: {deletionStatus.scheduled_for ? new Date(deletionStatus.scheduled_for).toLocaleDateString() : 'Unknown'}
                </p>
                <div className="mt-4">
                  <input
                    type="text"
                    value={cancellationToken}
                    onChange={(e) => setCancellationToken(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-3"
                    placeholder={t('settings.account.cancellationToken') || 'Enter cancellation token'}
                  />
                  <button
                    onClick={handleCancelDeletion}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t('settings.account.cancelDeletion') || 'Cancel Deletion'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account */}
        {!deletionStatus?.pending_deletion && (
          <div className="rounded-3xl p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-xl font-bold text-red-900 dark:text-red-300">
                {t('settings.account.deleteAccount') || 'Delete Account'}
              </h2>
            </div>
            <p className="text-red-700 dark:text-red-400 mb-4">
              {t('settings.account.deleteDescription') || 'Permanently delete your account and all associated data. This action cannot be undone after the grace period.'}
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                {t('settings.account.deleteButton') || 'Delete Account'}
              </button>
            ) : (
              <div className="space-y-4 p-4 bg-white dark:bg-gray-900 rounded-2xl">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {t('settings.account.deleteGracePeriod') || 'You will have 30 days to cancel this request. After that, your data will be permanently deleted.'}
                  </p>
                </div>
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
                    {t('settings.account.deleteReason') || 'Reason (optional)'}
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    rows={3}
                    placeholder={t('settings.account.deleteReasonPlaceholder') || 'Tell us why you want to delete your account...'}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setPassword('');
                      setDeleteReason('');
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    onClick={handleRequestDeletion}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        {t('settings.account.confirmDelete') || 'Delete Account'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
