'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Wallet, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from '@/lib/navigation';
import walletApi, { WalletBalance, Transaction } from '@/lib/api/wallet';
import authService from '@/lib/api/auth';
import { BalanceCard, TransactionList } from '@/components/wallet';

export default function WalletPage() {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Check authentication
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      try {
        // Fetch user, balance, and transactions in parallel
        const [userData, balanceData, transactionsData] = await Promise.all([
          authService.getCurrentUser(),
          walletApi.getBalance().catch(() => null),
          walletApi.getTransactions({ per_page: 5 }).catch(() => ({ data: [] })),
        ]);

        if (!userData) {
          router.push('/login');
          return;
        }

        setUser(userData);
        setBalance(balanceData);
        setTransactions(transactionsData.data || []);
      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-[-10]">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('wallet.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Balance Card */}
        <div className="mb-8">
          <BalanceCard balance={balance} isLoading={isLoading} />
        </div>

        {/* Recent Transactions */}
        <div className="card-glass rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
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

          <TransactionList
            transactions={transactions}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
