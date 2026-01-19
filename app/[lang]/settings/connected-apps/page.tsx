'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  Shield,
  User,
  CreditCard,
  History,
  Wallet,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface ConnectedApp {
  client_id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  scopes: string[];
  connected_at: string;
}

const scopeIcons: Record<string, React.ReactNode> = {
  'profile:read': <User className="w-4 h-4" />,
  'verification:read': <Shield className="w-4 h-4" />,
  'wallet:read': <CreditCard className="w-4 h-4" />,
  'transactions:read': <History className="w-4 h-4" />,
  'wallet:write': <Wallet className="w-4 h-4" />,
};

export default function ConnectedAppsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'az';
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConnectedApps();
  }, []);

  const fetchConnectedApps = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push(`/${lang}/login`);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';
      const response = await fetch(`${API_URL}/connected-apps`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load apps');
      }

      setApps(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async (clientId: string, appName: string) => {
    if (!confirm(t('connectedApps.confirmRevoke', { app: appName }))) {
      return;
    }

    setRevoking(clientId);

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';

      const response = await fetch(`${API_URL}/connected-apps/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to revoke access');
      }

      // Remove from list
      setApps(apps.filter((app) => app.client_id !== clientId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRevoking(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
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
                {t('connectedApps.title')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('connectedApps.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
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
        ) : apps.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ExternalLink className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('connectedApps.noApps')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {t('connectedApps.noAppsDesc')}
            </p>
          </div>
        ) : (
          /* Apps List */
          <div className="space-y-4">
            {apps.map((app) => (
              <div
                key={app.client_id}
                className="card-glass rounded-2xl p-6"
              >
                <div className="flex items-start gap-4">
                  {/* App Icon */}
                  {app.logo_url ? (
                    <img
                      src={app.logo_url}
                      alt={app.name}
                      className="w-14 h-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                  )}

                  {/* App Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {app.name}
                      </h3>
                      {app.website_url && (
                        <a
                          href={app.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {t('connectedApps.lastUsed', { date: formatDate(app.connected_at) })}
                    </p>

                    {/* Scopes */}
                    <div className="flex flex-wrap gap-2">
                      {app.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400"
                        >
                          {scopeIcons[scope] || <Shield className="w-4 h-4" />}
                          {t(`oauth.scopes.${scope}`)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Revoke Button */}
                  <button
                    onClick={() => handleRevokeAccess(app.client_id, app.name)}
                    disabled={revoking === app.client_id}
                    className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {revoking === app.client_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {t('connectedApps.revokeAccess')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
