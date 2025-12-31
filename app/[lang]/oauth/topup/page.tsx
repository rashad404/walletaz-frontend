'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Wallet,
  CreditCard,
  Check,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface ClientInfo {
  name: string;
  logo_url: string | null;
  website_url: string | null;
}

interface WalletInfo {
  balance: number;
  currency: string;
}

export default function TopupPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get('client_id');
  const initialAmount = searchParams.get('amount');

  const [amount, setAmount] = useState<number>(initialAmount ? parseFloat(initialAmount) : 10);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!clientId) {
      setError(t('oauth.topup.missingClientId'));
      setIsLoading(false);
      return;
    }
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const returnUrl = window.location.href;
        const lang = window.location.pathname.split('/')[1] || 'az';
        router.push(`/${lang}/login?return_url=${encodeURIComponent(returnUrl)}`);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';

      // Fetch client info and wallet balance
      const response = await fetch(`${API_URL}/oauth/topup-info?client_id=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('oauth.topup.loadError'));
      }

      setClientInfo(data.data.client);
      setWalletInfo(data.data.wallet);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount < 1) {
      setError(t('oauth.topup.minAmount'));
      return;
    }

    if (walletInfo && amount > walletInfo.balance) {
      setError(t('oauth.topup.insufficientBalance'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';

      // Create and approve the charge in one request
      const response = await fetch(`${API_URL}/oauth/topup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('oauth.topup.error'));
      }

      setSuccess(t('oauth.topup.success'));

      // Send message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'topup_completed',
          amount: amount,
          charge_id: data.data?.charge_id,
        }, '*');
        setTimeout(() => window.close(), 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.opener) {
      window.opener.postMessage({ type: 'topup_cancelled' }, '*');
      window.close();
    }
  };

  const handleAddBalance = () => {
    const lang = window.location.pathname.split('/')[1] || 'az';
    window.open(`/${lang}/wallet/deposit`, '_blank');
  };

  const formatAmount = (value: number, currency: string) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !clientInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {t('oauth.errors.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Check className="w-6 h-6 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {success}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('oauth.charge.redirecting')}
          </p>
        </div>
      </div>
    );
  }

  const insufficientBalance = walletInfo && amount > walletInfo.balance;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header with Wallet.az branding */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Wallet.az</span>
        </div>

        {/* Client info */}
        <div className="flex items-center gap-3">
          {clientInfo?.logo_url ? (
            <img
              src={clientInfo.logo_url}
              alt={clientInfo.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {clientInfo?.name}
            </h1>
            {clientInfo?.website_url && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {new URL(clientInfo.website_url).hostname}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className="flex-1 p-4 flex flex-col">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {t('oauth.topup.title')}
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t('oauth.topup.description')}
          </p>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('oauth.topup.amount')}
          </label>

          {/* Quick amount buttons */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[5, 10, 20, 50].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(value)}
                className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                  amount === value
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {value} AZN
              </button>
            ))}
          </div>

          {/* Custom amount input */}
          <div className="relative">
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setAmount(0);
                } else {
                  setAmount(Math.min(1000, parseFloat(val) || 0));
                }
              }}
              min="1"
              max="1000"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="0.00"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
              AZN
            </span>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className={`p-3 rounded-xl mb-4 ${insufficientBalance ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${insufficientBalance ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
              <CreditCard className={`w-4 h-4 ${insufficientBalance ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('oauth.charge.yourBalance')}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {walletInfo && formatAmount(walletInfo.balance, walletInfo.currency)}
              </p>
            </div>
          </div>

          {/* Insufficient Balance Warning */}
          {insufficientBalance && (
            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {t('oauth.charge.shortfall', { amount: (amount - (walletInfo?.balance || 0)).toFixed(2) })}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddBalance}
                className="w-full px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {t('oauth.charge.addBalance')}
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 mb-4">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || insufficientBalance || amount < 1}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{t('oauth.topup.confirm')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
