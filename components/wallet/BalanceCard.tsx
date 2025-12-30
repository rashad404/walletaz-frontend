'use client';

import { Wallet, TrendingUp, Plus, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import type { WalletBalance } from '@/lib/api/wallet';

interface BalanceCardProps {
  balance: WalletBalance | null;
  isLoading?: boolean;
}

export default function BalanceCard({ balance, isLoading = false }: BalanceCardProps) {
  const t = useTranslations();

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('az-AZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="card-glass rounded-3xl p-8 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  const currentBalance = balance?.balance ?? 0;
  const availableBalance = balance?.available_balance ?? 0;
  const reservedBalance = balance?.reserved_balance ?? 0;
  const status = balance?.status ?? 'active';

  return (
    <div className="card-glass rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <Wallet className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {t(`wallet.${status}`)}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {t('dashboard.availableBalance')}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">
            {formatAmount(availableBalance)}
          </span>
          <span className="text-lg text-gray-500 dark:text-gray-400">AZN</span>
        </div>
      </div>

      {reservedBalance > 0 && (
        <div className="mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-700 dark:text-amber-300">
              {t('dashboard.reservedBalance')}
            </span>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {formatAmount(reservedBalance)} AZN
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href="/wallet/deposit"
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          {t('dashboard.deposit')}
        </Link>
        <Link
          href="/wallet/transactions"
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300"
        >
          <TrendingUp className="w-5 h-5" />
          {t('wallet.transactions')}
        </Link>
      </div>
    </div>
  );
}
