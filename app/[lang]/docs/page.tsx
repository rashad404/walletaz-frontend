'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import {
  Wallet,
  Key,
  CreditCard,
  ArrowRight,
  Code,
  Shield,
  Zap,
  BookOpen,
} from 'lucide-react';

interface DocCard {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  gradient: string;
  available: boolean;
}

export default function DocsPage() {
  const t = useTranslations();

  const docs: DocCard[] = [
    {
      id: 'oauth',
      titleKey: 'docs.oauth.title',
      descriptionKey: 'docs.oauth.description',
      icon: Key,
      href: '/docs/oauth',
      gradient: 'from-emerald-500 to-teal-500',
      available: true,
    },
    {
      id: 'payments',
      titleKey: 'docs.payments.title',
      descriptionKey: 'docs.payments.description',
      icon: CreditCard,
      href: '/docs/payments',
      gradient: 'from-blue-500 to-indigo-500',
      available: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              {t('docs.title')}
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('docs.subtitle')}
          </p>
        </div>

        {/* Quick Start */}
        <div className="mb-12 p-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">{t('docs.quickStart.title')}</h2>
              <p className="opacity-90 mb-4">{t('docs.quickStart.description')}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/docs/oauth"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-sm font-medium"
                >
                  {t('docs.quickStart.startWithOAuth')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {docs.map((doc) => {
            const Icon = doc.icon;
            return (
              <Link
                key={doc.id}
                href={doc.href}
                className={`group relative rounded-3xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all hover:shadow-xl ${
                  !doc.available ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${doc.gradient} flex items-center justify-center shrink-0`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {t(doc.titleKey)}
                      </h2>
                      {!doc.available && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500">
                          {t('common.comingSoon')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t(doc.descriptionKey)}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('docs.features.secure.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('docs.features.secure.description')}
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('docs.features.easy.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('docs.features.easy.description')}
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('docs.features.payments.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('docs.features.payments.description')}
            </p>
          </div>
        </div>

        {/* Support */}
        <div className="text-center p-8 rounded-3xl bg-gray-100 dark:bg-gray-800/50">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('docs.support.title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('docs.support.description')}
          </p>
          <a
            href="mailto:developer@wallet.az"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            {t('docs.support.contact')}
          </a>
        </div>
      </div>
    </div>
  );
}
