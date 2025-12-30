'use client';

import { useState, useEffect } from 'react';
import { Info, Copy, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import walletApi, { TestCard } from '@/lib/api/wallet';

export default function TestCardInfo() {
  const t = useTranslations();
  const [testCards, setTestCards] = useState<TestCard[]>([]);
  const [copiedCard, setCopiedCard] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchTestCards = async () => {
      try {
        const cards = await walletApi.getTestCards();
        setTestCards(cards);
      } catch (error) {
        // Use fallback test cards if API fails
        setTestCards([
          { number: '4111 1111 1111 1111', description: 'Success', brand: 'Visa' },
          { number: '4000 0000 0000 0002', description: 'Declined', brand: 'Visa' },
          { number: '4000 0000 0000 9995', description: 'Insufficient Funds', brand: 'Visa' },
        ]);
      }
    };

    fetchTestCards();
  }, []);

  const handleCopy = async (cardNumber: string) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cleanNumber);
      } else {
        // Fallback for non-HTTPS or unsupported browsers
        const textArea = document.createElement('textarea');
        textArea.value = cleanNumber;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopiedCard(cardNumber);
      setTimeout(() => setCopiedCard(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
      >
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-800 dark:text-blue-300">
            {t('deposit.testCards')}
          </h4>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
            {t('deposit.testCardsNote')}
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {testCards.map((card) => (
            <div
              key={card.number}
              className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                    {card.number}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {card.brand}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {card.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(card.number)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {copiedCard === card.number ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          ))}
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            CVV: 123 | {t('deposit.expiry')}: 12/30
          </p>
        </div>
      )}
    </div>
  );
}
