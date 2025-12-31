'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Users, CheckCircle, CreditCard, Code, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function HomePage() {
  const t = useTranslations();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Check auth status before rendering
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/dashboard');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const partners = [
    { name: 'alert.az', url: 'https://alert.az' },
    { name: 'sayt.az', url: 'https://sayt.az' },
    { name: 'kredit.az', url: 'https://kredit.az' },
    { name: 'task.az', url: 'https://task.az' },
    { name: 'metbuat.az', url: 'https://metbuat.az' },
    { name: 'bugun.az', url: 'https://bugun.az' },
    { name: 'football.biz', url: 'https://football.biz' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-[2px]">
              <div className="w-full h-full rounded-3xl bg-white dark:bg-gray-900 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Wallet.az
            </span>
          </h1>

          {/* Headline */}
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('home.headline')}
          </h2>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              {t('home.createAccount')}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300"
            >
              {t('home.signIn')}
            </Link>
          </div>
        </div>
      </section>

      {/* User Benefits Section */}
      <section className="py-16 px-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Benefit 1: One Registration */}
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('home.benefit1Title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.benefit1Desc')}
              </p>
            </div>

            {/* Benefit 2: One Verification */}
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('home.benefit2Title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.benefit2Desc')}
              </p>
            </div>

            {/* Benefit 3: One Balance */}
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('home.benefit3Title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.benefit3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Sites Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
            {t('home.partnersTitle')}
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {partners.map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-lg"
              >
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  {partner.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* For Developers Section */}
      <section className="py-12 px-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Code className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('home.developersTitle')}
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('home.developersDesc')}
          </p>
          <Link
            href="/docs/oauth"
            className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
          >
            {t('home.apiDocs')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
