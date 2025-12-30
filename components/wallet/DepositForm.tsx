'use client';

import { useState } from 'react';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import walletApi, { DepositResponse } from '@/lib/api/wallet';
import TestCardInfo from './TestCardInfo';

interface DepositFormProps {
  onSuccess?: (response: DepositResponse) => void;
  onError?: (error: string) => void;
}

export default function DepositForm({ onSuccess, onError }: DepositFormProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<DepositResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      const month = value.substring(0, 2);
      const year = value.substring(2, 4);
      setExpiryMonth(month);
      setExpiryYear(year);
    } else {
      setExpiryMonth(value);
      setExpiryYear('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await walletApi.deposit({
        amount: parseFloat(amount),
        card_number: cardNumber.replace(/\s/g, ''),
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        cvv,
      });

      if (response.status === 'success') {
        setSuccess(response);
        onSuccess?.(response);
        // Reset form
        setAmount('');
        setCardNumber('');
        setExpiryMonth('');
        setExpiryYear('');
        setCvv('');
      } else {
        throw new Error(response.message || t('deposit.failed'));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('deposit.failed');
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-300">
                {t('deposit.success')}
              </h4>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                {t('deposit.transactionId')}: {success.data?.transaction_id}
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                {t('deposit.newBalance')}: {success.data?.new_balance?.toFixed(2)} AZN
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-300">
                {t('deposit.failed')}
              </h4>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('deposit.amount')}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('deposit.amountPlaceholder')}
              className="w-full px-4 py-3 pr-16 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="1"
              max="5000"
              step="0.01"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              AZN
            </span>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(quickAmount.toString())}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  amount === quickAmount.toString()
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                }`}
              >
                {quickAmount} AZN
              </button>
            ))}
          </div>
        </div>

        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('deposit.cardNumber')}
          </label>
          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder={t('deposit.cardNumberPlaceholder')}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Expiry & CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('deposit.expiry')}
            </label>
            <input
              type="text"
              value={expiryMonth && expiryYear ? `${expiryMonth}/${expiryYear}` : expiryMonth}
              onChange={handleExpiryChange}
              placeholder={t('deposit.expiryPlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              maxLength={5}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('deposit.cvv')}
            </label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder={t('deposit.cvvPlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              maxLength={4}
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('deposit.processing')}
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              {t('deposit.continue')}
            </>
          )}
        </button>
      </form>

      {/* Test Cards Info */}
      <TestCardInfo />
    </div>
  );
}
