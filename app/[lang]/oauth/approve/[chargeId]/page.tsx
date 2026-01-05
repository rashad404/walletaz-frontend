'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CreditCard,
  Check,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  Clock,
  Shield
} from 'lucide-react';
import { AppLogo } from '@/components/ui/app-logo';

interface ChargeData {
  charge: {
    id: string;
    amount: number;
    currency: string;
    description: string | null;
    status: string;
    expires_at: string | null;
    is_expired: boolean;
    can_approve: boolean;
  };
  client: {
    name: string;
    logo_url: string | null;
    website_url: string | null;
  };
  wallet: {
    balance: number;
    currency: string;
    sufficient: boolean;
  };
  auto_approve: {
    enabled: boolean;
    max_amount: number;
  };
}

export default function ChargeApprovePage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'az';
  const chargeId = params?.chargeId as string;

  const [chargeData, setChargeData] = useState<ChargeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoApproveAmount, setAutoApproveAmount] = useState<number>(0);
  const [enableAutoApprove, setEnableAutoApprove] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    fetchChargeData();
  }, [chargeId]);

  // Polling for balance updates (only when isPolling is true)
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';
        const response = await fetch(`${API_URL}/oauth/approve/${chargeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        const data = await response.json();
        if (response.ok && data.data) {
          setChargeData(data.data);
          // Stop polling if balance is now sufficient
          if (data.data.wallet?.sufficient) {
            setIsPolling(false);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isPolling, chargeId]);

  const fetchChargeData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const returnUrl = window.location.href;
        router.push(`/${lang}/login?return_url=${encodeURIComponent(returnUrl)}`);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';
      const response = await fetch(`${API_URL}/oauth/approve/${chargeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('oauth.charge.notFound'));
      }

      setChargeData(data.data);

      // Set auto-approve default from existing settings
      if (data.data.auto_approve.enabled) {
        setEnableAutoApprove(true);
        setAutoApproveAmount(data.data.auto_approve.max_amount);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (decision: 'approve' | 'reject') => {
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';

      const body: any = { decision };
      if (decision === 'approve' && enableAutoApprove && autoApproveAmount > 0) {
        body.auto_approve_limit = autoApproveAmount;
      }

      const response = await fetch(`${API_URL}/oauth/approve/${chargeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('oauth.charge.error'));
      }

      if (decision === 'approve') {
        setSuccess(t('oauth.charge.approved'));
      } else {
        setSuccess(t('oauth.charge.rejected'));
      }

      // Post message to parent window (popup flow)
      if (window.opener) {
        window.opener.postMessage({
          type: decision === 'approve' ? 'charge_approved' : 'charge_rejected',
          charge_id: chargeId,
        }, '*');
        setTimeout(() => window.close(), 2000);
      } else {
        // Redirect back after a delay
        setTimeout(() => {
          router.push(`/${lang}/wallet`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleAddBalance = () => {
    // Open deposit page in new tab
    window.open(`/${lang}/wallet/deposit`, '_blank');
    // Start polling for balance updates
    setIsPolling(true);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(lang === 'az' ? 'az-AZ' : lang === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
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

  if (error && !chargeData) {
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

  const charge = chargeData?.charge;
  const client = chargeData?.client;
  const wallet = chargeData?.wallet;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header with Kimlik.az branding + App */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-center mb-3">
          <AppLogo size="sm" />
        </div>
        <div className="flex items-center gap-3">
          {client?.logo_url ? (
            <img
              src={client.logo_url}
              alt={client.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {client?.name}
            </h1>
            {client?.website_url && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {new URL(client.website_url).hostname}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Charge Amount */}
        <div className="text-center mb-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('oauth.charge.requestAmount')}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {charge && formatAmount(charge.amount, charge.currency)}
          </p>
          {charge?.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {charge.description}
            </p>
          )}
        </div>

        {/* Wallet Balance */}
        <div className={`p-3 rounded-xl mb-4 ${!wallet?.sufficient ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!wallet?.sufficient ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
              <CreditCard className={`w-4 h-4 ${!wallet?.sufficient ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('oauth.charge.yourBalance')}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {wallet && formatAmount(wallet.balance, wallet.currency)}
              </p>
            </div>
          </div>

          {/* Insufficient Balance Warning */}
          {!wallet?.sufficient && charge && (
            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {t('oauth.charge.shortfall', { amount: ((charge.amount - (wallet?.balance || 0)).toFixed(2)) })}
                </span>
              </div>

              {isPolling ? (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">{t('oauth.charge.checkingBalance')}</span>
                </div>
              ) : (
                <button
                  onClick={handleAddBalance}
                  className="w-full mt-2 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {t('oauth.charge.addBalance')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Expiry Warning */}
        {charge?.is_expired && (
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              <p className="text-xs text-red-600 dark:text-red-400">
                {t('oauth.charge.expired')}
              </p>
            </div>
          </div>
        )}

        {/* Auto-approve Option */}
        {charge?.can_approve && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 mb-4">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAutoApprove}
                onChange={(e) => {
                  setEnableAutoApprove(e.target.checked);
                  if (e.target.checked && autoApproveAmount === 0) {
                    setAutoApproveAmount(charge?.amount || 10);
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {t('oauth.charge.autoApproveTitle')}
                  </p>
                </div>
                {enableAutoApprove && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {t('oauth.charge.maxAmount')}:
                    </span>
                    <input
                      type="number"
                      value={autoApproveAmount}
                      onChange={(e) => setAutoApproveAmount(parseFloat(e.target.value) || 0)}
                      min="0"
                      max="1000"
                      step="1"
                      className="w-20 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">AZN</span>
                  </div>
                )}
              </div>
            </label>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 mt-3">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Action Buttons - pb-safe for iPhone bottom bar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2">
          <button
            onClick={() => handleDecision('reject')}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {t('oauth.charge.reject')}
          </button>
          <button
            onClick={() => handleDecision('approve')}
            disabled={isSubmitting || !charge?.can_approve || !wallet?.sufficient}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                {t('oauth.charge.approve')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
