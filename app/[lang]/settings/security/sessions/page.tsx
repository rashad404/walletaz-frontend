'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/lib/navigation';
import {
  Monitor,
  Smartphone,
  Tablet,
  ChevronLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Trash2,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Session {
  id: number;
  name: string;
  is_current: boolean;
  last_used_at: string | null;
  created_at: string;
  device_type: string;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
}

export default function SessionsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.lang as string) || 'az';

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push(`/${locale}/login`);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/security/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.status === 'success') {
        setSessions(data.data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (tokenId: number) => {
    setRevoking(tokenId);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/security/sessions/${tokenId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.status === 'success') {
        setSessions(sessions.filter(s => s.id !== tokenId));
        setMessage({ type: 'success', text: t('settings.sessions.sessionRevoked') || 'Session revoked successfully' });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('common.error') || 'An error occurred' });
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllOther = async () => {
    if (!password) {
      setMessage({ type: 'error', text: t('settings.security.passwordRequired') || 'Password is required' });
      return;
    }

    setRevokingAll(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/security/sessions/revoke-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setShowRevokeAll(false);
        setPassword('');
        fetchSessions();
        setMessage({ type: 'success', text: `${data.data.revoked_count} ${t('settings.sessions.sessionsRevoked') || 'sessions revoked'}` });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('common.error') || 'An error occurred' });
    } finally {
      setRevokingAll(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('settings.sessions.never') || 'Never';
    const date = new Date(dateString);
    return date.toLocaleString(locale === 'az' ? 'az-AZ' : locale === 'ru' ? 'ru-RU' : 'en-US');
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
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link
          href={`/settings/security`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('settings.backToSettings') || 'Back to Settings'}
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('settings.sessions.title') || 'Active Sessions'}
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 ml-[60px]">
              {t('settings.sessions.subtitle') || 'Manage your active sessions across devices'}
            </p>
          </div>

          {sessions.length > 1 && (
            <button
              onClick={() => setShowRevokeAll(true)}
              className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              {t('settings.sessions.revokeAll') || 'Sign out all other'}
            </button>
          )}
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

        {/* Revoke All Modal */}
        {showRevokeAll && (
          <div className="mb-6 p-6 rounded-3xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mb-2">
              {t('settings.sessions.revokeAllTitle') || 'Sign out all other sessions?'}
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400 mb-4">
              {t('settings.sessions.revokeAllWarning') || 'This will sign you out of all devices except this one. You will need to sign in again on those devices.'}
            </p>
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
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRevokeAll(false);
                    setPassword('');
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={revokeAllOther}
                  disabled={revokingAll}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {revokingAll ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      {t('settings.sessions.revokeAll') || 'Sign out all'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`rounded-2xl p-6 border ${
                session.is_current
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    session.is_current
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {getDeviceIcon(session.device_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {session.browser || session.name}
                        {session.os && ` on ${session.os}`}
                      </h3>
                      {session.is_current && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full">
                          {t('settings.sessions.currentSession') || 'This device'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {session.ip_address && `IP: ${session.ip_address}`}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.sessions.lastActive') || 'Last active'}: {formatDate(session.last_used_at)}
                    </p>
                  </div>
                </div>

                {!session.is_current && (
                  <button
                    onClick={() => revokeSession(session.id)}
                    disabled={revoking === session.id}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50"
                    title={t('settings.sessions.revoke') || 'Revoke'}
                  >
                    {revoking === session.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-12">
            <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {t('settings.sessions.noSessions') || 'No active sessions'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
