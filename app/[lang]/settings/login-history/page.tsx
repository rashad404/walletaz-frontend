'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Shield,
  Loader2,
  AlertTriangle,
  ExternalLink,
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

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const fetchLoginHistory = async () => {
    try {
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
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Relative time for recent logins
    if (diffMins < 1) return t('loginHistory.justNow');
    if (diffMins < 60) return t('loginHistory.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('loginHistory.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('loginHistory.daysAgo', { count: diffDays });

    // Full date for older entries
    return date.toLocaleDateString(lang === 'az' ? 'az-AZ' : lang === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('loginHistory.title')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('loginHistory.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Security Notice */}
        <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('loginHistory.securityNotice')}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        ) : history.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('loginHistory.noHistory')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {t('loginHistory.noHistoryDesc')}
            </p>
          </div>
        ) : (
          /* History List */
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className={`card-glass rounded-2xl p-4 ${
                  index === 0 ? 'border-2 border-emerald-200 dark:border-emerald-800' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* App Icon or Device Icon */}
                  {entry.app?.logo_url ? (
                    <img
                      src={entry.app.logo_url}
                      alt={entry.app.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      index === 0
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {deviceIcons[entry.device.type] || <Globe className="w-5 h-5" />}
                    </div>
                  )}

                  {/* Entry Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {entry.app?.name || t('loginHistory.directLogin')}
                      </h3>
                      {index === 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          {t('loginHistory.currentSession')}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        {deviceIcons[entry.device.type] || <Monitor className="w-4 h-4" />}
                        {entry.device.browser} / {entry.device.os}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        {entry.ip_address}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatDate(entry.logged_in_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
