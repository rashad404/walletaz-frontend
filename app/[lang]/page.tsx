'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Code, ArrowRight, Loader2, Shield, Users, Smartphone, Mail, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AppLogo } from '@/components/ui/app-logo';

interface Stats {
  users: number;
  partners: number;
  verifications: number;
}

export default function HomePage() {
  const t = useTranslations();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  // Check auth status before rendering
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/dashboard');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/stats`);
        const data = await response.json();
        if (data.status === 'success') {
          setStats(data.data);
        }
      } catch (error) {
        // Silently fail - we'll show fallback values
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

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

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${Math.floor(num / 1000)}K+`;
    }
    return `${num}+`;
  };

  const userCount = stats ? formatNumber(stats.users) : '1,000+';
  const partnerCount = stats ? `${stats.partners}+` : '15+';
  const verifiedCount = stats ? formatNumber(stats.verifications) : '500+';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section - Above the fold */}
      <section className="relative flex-1 flex flex-col justify-center py-12 md:py-16 px-6">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <AppLogo size="xl" />
          </div>

          {/* Position Statement */}
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-wide mb-3">
            {t('home.position')}
          </p>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {t('home.headline')}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
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

          {/* Trust Stats */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span><strong className="text-gray-900 dark:text-white">{userCount}</strong> {t('home.stats.users')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span><strong className="text-gray-900 dark:text-white">{partnerCount}</strong> {t('home.stats.partners')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span><strong className="text-gray-900 dark:text-white">{verifiedCount}</strong> {t('home.stats.verified')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Strip - Compact Horizontal */}
      <section className="py-6 px-6 border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-gray-700 dark:text-gray-300">{t('home.features.oneRegistration')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-gray-700 dark:text-gray-300">{t('home.features.oneVerification')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-gray-700 dark:text-gray-300">{t('home.features.oneWallet')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Methods & Security Section */}
      <section className="py-12 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('home.security.title')}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            {t('home.security.subtitle')}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Google */}
            <div className="group p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Google</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('home.security.quickLogin')}</p>
            </div>

            {/* Facebook */}
            <div className="group p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Facebook</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('home.security.quickLogin')}</p>
            </div>

            {/* Telegram */}
            <div className="group p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#26A5E4">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Telegram</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('home.security.quickLogin')}</p>
            </div>

            {/* 2FA */}
            <div className="group p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t('home.security.twoFactor')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('home.security.extraSecurity')}</p>
            </div>
          </div>

          {/* Additional security features */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-500" />
              <span>{t('home.security.emailLogin')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>{t('home.security.phoneLogin')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>{t('home.security.loginAlerts')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Sites Section */}
      <section className="py-10 px-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-6">
            {t('home.partnersTitle')}
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {partners.map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-md"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {partner.name}
                </span>
              </a>
            ))}
            {stats && stats.partners > partners.length && (
              <span className="px-5 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                +{stats.partners - partners.length} {t('home.more')}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Developer CTA - Compact */}
      <section className="py-8 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-gray-50 to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Code className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('home.developersTitle')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('home.developersDesc')}
                </p>
              </div>
            </div>
            <Link
              href="/docs/oauth"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors whitespace-nowrap"
            >
              {t('home.apiDocs')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-6 px-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>&copy; {new Date().getFullYear()} Kimlik.az</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link href="/terms" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t('footer.terms')}
            </Link>
            <a href="mailto:info@kimlik.az" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t('footer.contact')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
