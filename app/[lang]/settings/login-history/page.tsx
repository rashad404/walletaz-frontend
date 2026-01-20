'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import {
  ChevronLeft,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Shield,
  Loader2,
  AlertTriangle,
  Mail,
  Phone,
  Key,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';

interface LoginEntry {
  id: number;
  login_type: string;
  app: {
    name: string;
    logo_url: string | null;
  } | null;
  device: {
    type: string;
    browser: string;
    os: string;
    info: string;
  };
  ip_address: string;
  scopes: string[] | null;
  logged_in_at: string;
}

type LoginTypeStyle = {
  bg: string;
  text: string;
  icon: React.ReactNode;
};

const deviceIcons: Record<string, React.ReactNode> = {
  desktop: <Monitor className="w-5 h-5" />,
  mobile: <Smartphone className="w-5 h-5" />,
  tablet: <Tablet className="w-5 h-5" />,
};

export default function LoginHistoryPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'az';
  const [history, setHistory] = useState<LoginEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const fetchLoginHistory = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push(`/${lang}/login`);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';
      const response = await fetch(`${API_URL}/login-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load login history');
      }

      setHistory(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getLoginTypeStyle = (loginType: string): LoginTypeStyle => {
    const baseType = loginType.replace(/_2fa$|_2fa_recovery$|_otp$/, '');

    const styles: Record<string, LoginTypeStyle> = {
      email: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        icon: <Mail className="w-3 h-3" />,
      },
      phone: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-600 dark:text-green-400',
        icon: <Phone className="w-3 h-3" />,
      },
      google: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
        icon: <GoogleIcon />,
      },
      facebook: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        text: 'text-indigo-600 dark:text-indigo-400',
        icon: <FacebookIcon />,
      },
      telegram: {
        bg: 'bg-sky-50 dark:bg-sky-900/20',
        text: 'text-sky-600 dark:text-sky-400',
        icon: <TelegramIcon />,
      },
      magic_link: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-600 dark:text-purple-400',
        icon: <LinkIcon className="w-3 h-3" />,
      },
      oauth: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-600 dark:text-orange-400',
        icon: <Key className="w-3 h-3" />,
      },
      existing_session: {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        icon: <RefreshCw className="w-3 h-3" />,
      },
    };

    return styles[baseType] || {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
      icon: <Key className="w-3 h-3" />,
    };
  };

  const getLoginTypeLabel = (loginType: string): string => {
    const key = `loginHistory.loginTypes.${loginType}`;
    const translated = t(key);
    return translated !== key ? translated : loginType;
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('loginHistory.justNow');
    if (diffMins < 60) return t('loginHistory.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('loginHistory.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('loginHistory.daysAgo', { count: diffDays });

    return date.toLocaleDateString(lang === 'az' ? 'az-AZ' : lang === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(lang === 'az' ? 'az-AZ' : lang === 'ru' ? 'ru-RU' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDateGroup = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    if (date >= today) return 'today';
    if (date >= yesterday) return 'yesterday';
    if (date >= weekAgo) return 'thisWeek';
    return 'earlier';
  };

  const groupedHistory = useMemo(() => {
    const groups: Record<string, LoginEntry[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: [],
    };

    history.forEach((entry) => {
      const group = getDateGroup(entry.logged_in_at);
      groups[group].push(entry);
    });

    return groups;
  }, [history]);

  const getGroupLabel = (group: string): string => {
    const labels: Record<string, string> = {
      today: t('loginHistory.today'),
      yesterday: t('loginHistory.yesterday'),
      thisWeek: t('loginHistory.thisWeek'),
      earlier: t('loginHistory.earlier'),
    };
    return labels[group] || group;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 bg-white dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('settings.backToSettings')}
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('loginHistory.title')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('loginHistory.description')}
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchLoginHistory(true)}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Security Notice */}
        <div className="mb-5 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {t('loginHistory.securityNotice')}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {history.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('loginHistory.noHistory')}
            </h2>
            <p className="text-base text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {t('loginHistory.noHistoryDesc')}
            </p>
          </div>
        ) : (
          /* Grouped History */
          <div className="space-y-6">
            {(['today', 'yesterday', 'thisWeek', 'earlier'] as const).map((group) => {
              const entries = groupedHistory[group];
              if (entries.length === 0) return null;

              return (
                <div key={group}>
                  <h2 className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">
                    {getGroupLabel(group)}
                  </h2>
                  <div className="space-y-3">
                    {entries.map((entry, index) => {
                      const isFirst = group === 'today' && index === 0;
                      const style = getLoginTypeStyle(entry.login_type);

                      return (
                        <div
                          key={entry.id}
                          className={`rounded-xl p-4 border ${
                            isFirst
                              ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50'
                              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* App/Device Icon */}
                            {entry.app?.logo_url ? (
                              <img
                                src={entry.app.logo_url}
                                alt={entry.app.name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isFirst
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                              }`}>
                                {deviceIcons[entry.device.type] || <Globe className="w-5 h-5" />}
                              </div>
                            )}

                            {/* Entry Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base font-medium text-gray-900 dark:text-white truncate">
                                  {entry.app?.name || t('loginHistory.directLogin')}
                                </span>
                                {isFirst && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded">
                                    {t('loginHistory.currentSession')}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                {/* Login Method Badge */}
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${style.bg} ${style.text}`}>
                                  {style.icon}
                                  <span className="text-xs font-medium">{getLoginTypeLabel(entry.login_type)}</span>
                                </span>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span className="truncate">{entry.device.browser}</span>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span>{entry.ip_address}</span>
                              </div>
                            </div>

                            {/* Time */}
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formatTime(entry.logged_in_at)}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {formatRelativeDate(entry.logged_in_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Provider Icons (small)
function GoogleIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
