'use client';

import { Link } from '@/lib/navigation';
import { Mail, Phone, Shield, HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Footer Content - Single Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Copyright */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} Wallet.az. {t('footer.allRightsReserved')}
            </p>
          </div>

          {/* Center: Essential Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/help"
              className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t('footer.help')}</span>
            </Link>
            <Link
              href="/privacy"
              className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-colors flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t('footer.privacy')}</span>
            </Link>
            <Link
              href="/terms"
              className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-colors">
              {t('footer.terms')}
            </Link>
          </div>

          {/* Right: Contact */}
          <div className="flex items-center gap-4 text-sm">
            <a
              href="mailto:info@wallet.az"
              className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-colors flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">info@wallet.az</span>
            </a>
            <a
              href="tel:+994123456789"
              className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-colors flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+994 12 345 6789</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
