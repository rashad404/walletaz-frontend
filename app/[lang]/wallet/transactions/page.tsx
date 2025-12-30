'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Filter } from 'lucide-react';
import { Link } from '@/lib/navigation';
import walletApi, { Transaction, TransactionFilters } from '@/lib/api/wallet';
import authService from '@/lib/api/auth';
import { TransactionList } from '@/components/wallet';

export default function TransactionsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filters = [
    { key: 'all', label: t('transactions.all') },
    { key: 'deposit', label: t('transactions.deposits') },
    { key: 'charge', label: t('transactions.charges') },
    { key: 'refund', label: t('transactions.refunds') },
  ];

  const fetchTransactions = async (page: number = 1, type?: string) => {
    setIsLoading(true);
    try {
      const params: TransactionFilters = {
        per_page: 10,
        page,
      };

      if (type && type !== 'all') {
        params.type = type;
      }

      const response = await walletApi.getTransactions(params);
      setTransactions(response.data);
      setCurrentPage(response.meta.current_page);
      setTotalPages(response.meta.last_page);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchTransactions(1, activeFilter);
  }, [router, activeFilter]);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    fetchTransactions(page, activeFilter);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-[-10]">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/wallet"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('transactions.title')}
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleFilterChange(filter.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeFilter === filter.key
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-500'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="card-glass rounded-3xl p-8">
          <TransactionList
            transactions={transactions}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
