'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/navigation';
import { formatDateInTimezone } from '@/lib/utils/date';
import {
  ArrowLeft,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Loader2,
} from 'lucide-react';

interface Transaction {
  charge_id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  description: string | null;
  reference_id: string | null;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  created_at: string;
  approved_at: string | null;
  completed_at: string | null;
}

interface AppInfo {
  id: number;
  name: string;
  logo_url: string | null;
}

interface Earnings {
  pending_balance: number;
  total_earned: number;
  total_refunded: number;
}

export default function AppTransactionsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const lang = (params?.lang as string) || 'az';
  const appId = params?.appId as string;

  const [app, setApp] = useState<AppInfo | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push(`/${lang}/login`);
      return;
    }
    loadData();
  }, [appId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      // Load app info, earnings, and transactions in parallel
      const [appRes, earningsRes, transactionsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/apps/${appId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/apps/${appId}/earnings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/apps/${appId}/transactions?per_page=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      const [appData, earningsData, transactionsData] = await Promise.all([
        appRes.json(),
        earningsRes.json(),
        transactionsRes.json(),
      ]);

      if (appData.status === 'success') {
        setApp(appData.data);
      }
      if (earningsData.status === 'success') {
        setEarnings(earningsData.data);
      }
      if (transactionsData.status === 'success') {
        setTransactions(transactionsData.data);
        setPagination(transactionsData.pagination);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'approved':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateInTimezone(dateString, 'Asia/Baku', { includeTime: true, locale });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/settings/developer"
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {app?.name} - {t('developer.apps.transactionsTitle')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t('developer.apps.earnings')}
              </p>
            </div>
          </div>
        </div>

        {/* Earnings Summary */}
        {earnings && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 opacity-80" />
                <span className="text-sm opacity-80">{t('developer.apps.pendingBalance')}</span>
              </div>
              <div className="text-3xl font-bold">
                {earnings.pending_balance.toFixed(2)} AZN
              </div>
            </div>
            <div className="rounded-2xl p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('developer.apps.totalEarned')}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {earnings.total_earned.toFixed(2)} AZN
              </div>
            </div>
            <div className="rounded-2xl p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Receipt className="w-6 h-6 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('transactions.title')}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {pagination.total}
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              {t('developer.apps.transactionsTitle')}
            </h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {t('developer.apps.noTransactions')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((tx) => (
                <div key={tx.charge_id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getStatusIcon(tx.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            +{tx.amount.toFixed(2)} {tx.currency}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </div>
                        {tx.user && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <User className="w-3 h-3" />
                            <span>{tx.user.name}</span>
                            <span className="text-gray-400 dark:text-gray-500">({tx.user.email})</span>
                          </div>
                        )}
                        {tx.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {tx.description}
                          </p>
                        )}
                        {tx.reference_id && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                            Ref: {tx.reference_id}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                      <div>{formatDate(tx.created_at)}</div>
                      <div className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-1">
                        {tx.charge_id}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
