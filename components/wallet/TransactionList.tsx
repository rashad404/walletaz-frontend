'use client';

import { ArrowDownLeft, ArrowUpRight, RefreshCw, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { Transaction } from '@/lib/api/wallet';
import { formatDateInTimezone } from '@/lib/utils/date';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function TransactionList({
  transactions,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: TransactionListProps) {
  const t = useTranslations();
  const locale = useLocale();

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('az-AZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-5 h-5" />;
      case 'charge':
        return <ArrowUpRight className="w-5 h-5" />;
      case 'refund':
        return <RefreshCw className="w-5 h-5" />;
      case 'adjustment':
        return <Settings className="w-5 h-5" />;
      default:
        return <ArrowUpRight className="w-5 h-5" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return 'from-green-500 to-emerald-500';
      case 'charge':
        return 'from-red-500 to-orange-500';
      case 'adjustment':
        return 'from-blue-500 to-indigo-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getAmountSign = (type: string) => {
    return type === 'deposit' || type === 'refund' ? '+' : '-';
  };

  const getAmountColor = (type: string) => {
    return type === 'deposit' || type === 'refund'
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 opacity-20 blur-xl" />
          <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 p-[1px]">
            <div className="w-full h-full rounded-3xl bg-white dark:bg-gray-900 flex items-center justify-center">
              <ArrowUpRight className="w-8 h-8 text-gray-900 dark:text-white" />
            </div>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t('transactions.noTransactions')}
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all"
        >
          {/* Icon */}
          <div className="relative flex-shrink-0">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTransactionColor(transaction.type)} p-[1px]`}>
              <div className="w-full h-full rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center">
                {getTransactionIcon(transaction.type)}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {t(`transactions.types.${transaction.type}`)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {transaction.description}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {formatDateInTimezone(transaction.created_at, 'Asia/Baku', { includeTime: true, locale })}
            </p>
          </div>

          {/* Amount & Status */}
          <div className="text-right flex-shrink-0">
            <p className={`text-lg font-bold ${getAmountColor(transaction.type)}`}>
              {getAmountSign(transaction.type)}{formatAmount(Math.abs(transaction.amount))} AZN
            </p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
              transaction.status === 'completed'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : transaction.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {t(`transactions.statuses.${transaction.status}`)}
            </span>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('common.pageOf', { current: currentPage, total: totalPages })}
          </span>
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-500 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
