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
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('dataDeletion.title')}
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm space-y-8">
          {/* How to Delete Your Data */}
          <section>
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
          </section>

          {/* Social Login Revocation */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('dataDeletion.socialLoginRevocation.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('dataDeletion.socialLoginRevocation.description')}
            </p>

            <div className="space-y-6">
              {/* Facebook Disconnection */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  {t('dataDeletion.socialLoginRevocation.facebook.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {t('dataDeletion.socialLoginRevocation.facebook.description')}
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>{t('dataDeletion.socialLoginRevocation.facebook.step1')}</li>
                  <li>{t('dataDeletion.socialLoginRevocation.facebook.step2')}</li>
                  <li>{t('dataDeletion.socialLoginRevocation.facebook.step3')}</li>
                  <li>{t('dataDeletion.socialLoginRevocation.facebook.step4')}</li>
                </ol>
              </div>

              {/* Google Disconnection */}
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('dataDeletion.socialLoginRevocation.google.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {t('dataDeletion.socialLoginRevocation.google.description')}
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>{t('dataDeletion.socialLoginRevocation.google.step1')}</li>
                  <li>{t('dataDeletion.socialLoginRevocation.google.step2')}</li>
                  <li>{t('dataDeletion.socialLoginRevocation.google.step3')}</li>
                  <li>{t('dataDeletion.socialLoginRevocation.google.step4')}</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Data Retention After Deletion */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('dataDeletion.dataRetention.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('dataDeletion.dataRetention.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-4">
              <li>{t('dataDeletion.dataRetention.items.transactions')}</li>
              <li>{t('dataDeletion.dataRetention.items.logs')}</li>
              <li>{t('dataDeletion.dataRetention.items.legal')}</li>
              <li>{t('dataDeletion.dataRetention.items.anonymized')}</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              {t('dataDeletion.dataRetention.partners')}
            </p>
          </section>

          {/* Confirmation Email */}
          <section className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <p className="text-gray-700 dark:text-gray-300">
              {t('dataDeletion.confirmationEmail')}
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
            <Link
              href="/privacy"
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              ← {t('dataDeletion.backToPrivacy')}
            </Link>
            <Link
              href="/terms"
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t('terms.title')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
