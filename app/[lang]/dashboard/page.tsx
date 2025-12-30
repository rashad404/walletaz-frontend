'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/lib/navigation';
import { Wallet, Plus, TrendingUp, ArrowRight, Settings, CreditCard, History, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import walletApi, { WalletBalance, Transaction } from '@/lib/api/wallet';
import authService from '@/lib/api/auth';
import { BalanceCard, TransactionList } from '@/components/wallet';

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Check authentication
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      try {
        // Fetch all data in parallel
        const [userData, balanceData, transactionsData] = await Promise.all([
          authService.getCurrentUser(),
          walletApi.getBalance().catch(() => null),
          walletApi.getTransactions({ per_page: 5 }).catch(() => ({ data: [] })),
        ]);

        setUser(userData);
        setBalance(balanceData);
        setTransactions(transactionsData.data || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-emerald-600 dark:text-emerald-400">
            {t('common.loading')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-[-10]">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.welcome', { name: user.name })}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <Link
            href="/wallet/deposit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>{t('dashboard.deposit')}</span>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Balance Card - Takes 2 columns */}
          <div className="lg:col-span-2">
            <BalanceCard balance={balance} isLoading={isLoading} />
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            {/* Total Balance */}
            <div className="card-glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {balance?.balance?.toFixed(2) || '0.00'} AZN
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.balance')}
              </div>
            </div>

            {/* Transaction Count */}
            <div className="card-glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {transactions.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.recentTransactions')}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card-glass rounded-3xl p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.recentTransactions')}
            </h2>
            <Link
              href="/wallet/transactions"
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium flex items-center gap-1"
            >
              {t('dashboard.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <TransactionList transactions={transactions} isLoading={isLoading} />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/wallet"
            className="card-glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {t('nav.wallet')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboard.subtitle')}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/wallet/deposit"
            className="card-glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {t('nav.deposit')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('deposit.subtitle')}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/wallet/transactions"
            className="card-glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {t('nav.transactions')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('transactions.title')}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/settings"
            className="card-glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {t('nav.settings')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('settings.manageAccount')}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
