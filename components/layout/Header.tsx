'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/lib/navigation';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Wallet, User, CreditCard, LogOut, ArrowDownToLine } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { TimezoneSelector } from '@/components/ui/timezone-selector';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useTranslations } from 'next-intl';
import { useAppName, useWalletEnabled } from '@/providers/config-provider';

export default function Header() {
  const t = useTranslations();
  const appName = useAppName();
  const walletEnabled = useWalletEnabled();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Extract locale from pathname
  const getLocale = () => {
    const segments = pathname.split('/');
    const possibleLocale = segments[1];
    if (['en', 'ru'].includes(possibleLocale)) {
      return possibleLocale;
    }
    return 'az'; // default
  };
  const locale = getLocale();

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
        // You could fetch user data here
        setUser({ name: 'User', email: 'user@example.com' });
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    // Check on mount and route changes
    checkAuth();
    setIsMounted(true);

    // Listen for auth state changes from AuthModal
    window.addEventListener('authStateChanged', checkAuth);

    return () => {
      window.removeEventListener('authStateChanged', checkAuth);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    window.dispatchEvent(new Event('authStateChanged'));
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-[1px] transition-transform group-hover:scale-105 duration-300">
                <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                </div>
              </div>
            </div>
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent text-lg font-bold">{appName}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className={`hidden md:flex items-center gap-6 transition-opacity duration-300 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
            {isAuthenticated && (
              <>
                {/* Only show deposit button when wallet is enabled */}
                {walletEnabled && (
                  <Link
                    href="/wallet/deposit"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>{t('nav.deposit')}</span>
                  </Link>
                )}

                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/dashboard'
                      ? 'text-emerald-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('nav.dashboard')}
                </Link>

                {/* Only show transactions link when wallet is enabled */}
                {walletEnabled && (
                  <Link
                    href="/wallet/transactions"
                    className={`text-sm font-medium transition-colors ${
                      pathname?.includes('/transactions')
                        ? 'text-emerald-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {t('nav.transactions')}
                  </Link>
                )}
              </>
            )}

            <LanguageSwitcher locale={locale} />
            <TimezoneSelector />
            <ThemeToggle />

            
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/settings"
                  className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  {t('nav.getStarted')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-3 md:hidden">
            <LanguageSwitcher locale={locale} />
            <TimezoneSelector />
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && isMounted && (
          <div className="md:hidden py-3 border-t border-gray-200 dark:border-gray-800">
            {isAuthenticated ? (
              <div className="space-y-1">
                {/* Only show deposit button when wallet is enabled */}
                {walletEnabled && (
                  <Link
                    href="/wallet/deposit"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    {t('nav.deposit')}
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('nav.dashboard')}
                </Link>
                {/* Only show transactions link when wallet is enabled */}
                {walletEnabled && (
                  <Link
                    href="/wallet/transactions"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.transactions')}
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('nav.settings')}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  href="/login"
                  className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('nav.getStarted')}
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
