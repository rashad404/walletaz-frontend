'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Wallet,
  CreditCard,
  Check,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  Clock,
  Shield
} from 'lucide-react';

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

  useEffect(() => {
    fetchChargeData();
  }, [chargeId]);

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

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(lang === 'az' ? 'az-AZ' : lang === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !chargeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full">
          <div className="card-glass rounded-3xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('oauth.errors.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => window.close()}
              className="px-6 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full">
          <div className="card-glass rounded-3xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {success}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('oauth.charge.redirecting')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const charge = chargeData?.charge;
  const client = chargeData?.client;
  const wallet = chargeData?.wallet;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Wallet.az</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="card-glass rounded-3xl overflow-hidden">
          {/* App Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              {client?.logo_url ? (
                <img
                  src={client.logo_url}
                  alt={client.name}
                  className="w-14 h-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {client?.name}
                </h1>
                {client?.website_url && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new URL(client.website_url).hostname}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Charge Amount */}
            <div className="text-center mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {t('oauth.charge.requestAmount')}
              </p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {charge && formatAmount(charge.amount, charge.currency)}
              </p>
              {charge?.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {charge.description}
                </p>
              )}
            </div>

            {/* Wallet Balance */}
            <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('oauth.charge.yourBalance')}
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {wallet && formatAmount(wallet.balance, wallet.currency)}
                    </p>
                  </div>
                </div>
                {!wallet?.sufficient && (
                  <div className="flex items-center gap-1 text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{t('oauth.charge.insufficientBalance')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Expiry Warning */}
            {charge?.is_expired && (
              <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {t('oauth.charge.expired')}
                  </p>
                </div>
              </div>
            )}

            {/* Auto-approve Option */}
            {charge?.can_approve && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAutoApprove}
                    onChange={(e) => {
                      setEnableAutoApprove(e.target.checked);
                      // Set a sensible default when enabling
                      if (e.target.checked && autoApproveAmount === 0) {
                        setAutoApproveAmount(charge?.amount || 10);
                      }
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <p className="font-medium text-gray-900 dark:text-white">
                        {t('oauth.charge.autoApproveTitle')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('oauth.charge.autoApproveDesc', { app: client?.name })}
                    </p>
                    {enableAutoApprove && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('oauth.charge.maxAmount')}:
                        </span>
                        <input
                          type="number"
                          value={autoApproveAmount}
                          onChange={(e) => setAutoApproveAmount(parseFloat(e.target.value) || 0)}
                          min="0"
                          max="1000"
                          step="1"
                          className="w-24 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">AZN</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 mb-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleDecision('reject')}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {t('oauth.charge.reject')}
              </button>
              <button
                onClick={() => handleDecision('approve')}
                disabled={isSubmitting || !charge?.can_approve || !wallet?.sufficient}
                className="flex-1 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {t('oauth.charge.approve')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('oauth.charge.footer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
