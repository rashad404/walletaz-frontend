import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang });

  return {
    title: `${t('privacy.title')} - Kimlik.az`,
    description: t('privacy.description'),
  };
}

export default function PrivacyPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('privacy.title')}
        </h1>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('privacy.lastUpdated')}: January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.collection.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('privacy.sections.collection.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.usage.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('privacy.sections.usage.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.sharing.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('privacy.sections.sharing.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.security.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('privacy.sections.security.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.deletion.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('privacy.sections.deletion.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.contact.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('privacy.sections.contact.content')}: info@kimlik.az
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
