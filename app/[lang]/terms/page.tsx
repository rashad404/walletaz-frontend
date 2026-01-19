import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link } from '@/lib/navigation';

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang });

  return {
    title: `${t('terms.title')} - Kimlik.az`,
    description: t('terms.description'),
  };
}

export default async function TermsPage({ params }: Props) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('terms.title')}
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('terms.lastUpdated')}: January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.acceptance.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('terms.sections.acceptance.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.services.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('terms.sections.services.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.accounts.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('terms.sections.accounts.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.prohibited.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('terms.sections.prohibited.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.liability.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('terms.sections.liability.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.changes.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('terms.sections.changes.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.contact.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('terms.sections.contact.content')}: <a href="mailto:info@kimlik.az" className="text-emerald-600 dark:text-emerald-400">info@kimlik.az</a>
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/privacy"
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              ← {t('privacy.title')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
