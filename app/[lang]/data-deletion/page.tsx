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
    title: `${t('dataDeletion.title')} - Kimlik.az`,
    description: t('dataDeletion.description'),
  };
}

export default async function DataDeletionPage({ params }: Props) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('dataDeletion.title')}
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('dataDeletion.howTo')}
          </h2>

          <div className="space-y-4 text-gray-600 dark:text-gray-400">
            <p>{t('dataDeletion.intro')}</p>

            <ol className="list-decimal list-inside space-y-3 ml-4">
              <li>{t('dataDeletion.step1')}</li>
              <li>{t('dataDeletion.step2')}</li>
              <li>{t('dataDeletion.step3')}</li>
              <li>{t('dataDeletion.step4')}</li>
            </ol>

            <p className="mt-6">{t('dataDeletion.alternative')}</p>

            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <p className="font-medium text-gray-900 dark:text-white">
                {t('dataDeletion.contactEmail')}: <a href="mailto:info@kimlik.az" className="text-emerald-600 dark:text-emerald-400">info@kimlik.az</a>
              </p>
            </div>

            <p className="mt-6 text-sm">
              {t('dataDeletion.timeframe')}
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/privacy"
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              ← {t('dataDeletion.backToPrivacy')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
