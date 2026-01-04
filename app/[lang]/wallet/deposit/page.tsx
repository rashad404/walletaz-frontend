'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Wallet, Clock } from 'lucide-react';
import { Link } from '@/lib/navigation';
import walletApi, { WalletBalance, DepositResponse } from '@/lib/api/wallet';
import authService from '@/lib/api/auth';
import { DepositForm } from '@/components/wallet';
import { useWalletEnabled } from '@/providers/config-provider';

export default function DepositPage() {
  const t = useTranslations();
  const router = useRouter();
  const walletEnabled = useWalletEnabled();
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<WalletBalance | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Skip fetching balance if wallet is disabled
      if (!walletEnabled) {
        setIsLoading(false);
        return;
      }

      try {
        const balanceData = await walletApi.getBalance();
        setBalance(balanceData);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, walletEnabled]);

  const handleDepositSuccess = async (response: DepositResponse) => {
    // Refresh balance after successful deposit
    try {
      const newBalance = await walletApi.getBalance();
      setBalance(newBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('az-AZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
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

  // Show coming soon notice when wallet is disabled
  if (!walletEnabled) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="fixed inset-0 z-[-10]">
          <div className="absolute inset-0 mesh-gradient opacity-30" />
        </div>

        <div className="max-w-xl mx-auto px-6 py-12">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </Link>
          </div>

          <div className="card-glass rounded-3xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('wallet.comingSoon.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t('wallet.comingSoon.description')}
            </p>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t('wallet.comingSoon.notice')}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
            >
              {t('common.backToDashboard')}
            </Link>
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

      <div className="max-w-xl mx-auto px-6 py-12">
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
            {t('deposit.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('deposit.subtitle')}
          </p>
        </div>

        {/* Current Balance Card */}
        <div className="card-glass rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.balance')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatAmount(balance?.balance ?? 0)} AZN
              </p>
            </div>
          </div>
        </div>

        {/* Deposit Form */}
        <div className="card-glass rounded-3xl p-8">
          <DepositForm onSuccess={handleDepositSuccess} />
        </div>

        {/* Limits Info */}
        <div className="mt-6 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            {t('verification.limits.daily')}
          </h3>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>{t('deposit.minAmount', { amount: '1' })}</li>
            <li>{t('deposit.maxAmount', { amount: '5,000' })}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
