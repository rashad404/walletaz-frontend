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
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('terms.title')}
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm space-y-8">
          <p className="text-gray-600 dark:text-gray-400">
            {t('terms.lastUpdated')}: January 2025
          </p>

          {/* Acceptance of Terms */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.acceptance.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('terms.sections.acceptance.content')}
            </p>
          </section>

          {/* Age Requirements */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.age.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('terms.sections.age.content')}
            </p>
          </section>

          {/* Our Services */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.services.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('terms.sections.services.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>{t('terms.sections.services.items.identity')}</li>
              <li>{t('terms.sections.services.items.sso')}</li>
              <li>{t('terms.sections.services.items.oauth')}</li>
              <li>{t('terms.sections.services.items.wallet')}</li>
            </ul>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.accounts.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('terms.sections.accounts.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>{t('terms.sections.accounts.items.accurate')}</li>
              <li>{t('terms.sections.accounts.items.update')}</li>
              <li>{t('terms.sections.accounts.items.security')}</li>
              <li>{t('terms.sections.accounts.items.notify')}</li>
              <li>{t('terms.sections.accounts.items.noShare')}</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.intellectualProperty.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('terms.sections.intellectualProperty.content')}
            </p>
            <div className="ml-4">
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('terms.sections.intellectualProperty.restrictions.title')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li>{t('terms.sections.intellectualProperty.restrictions.items.copy')}</li>
                <li>{t('terms.sections.intellectualProperty.restrictions.items.trademark')}</li>
                <li>{t('terms.sections.intellectualProperty.restrictions.items.reverse')}</li>
                <li>{t('terms.sections.intellectualProperty.restrictions.items.scrape')}</li>
              </ul>
            </div>
          </section>

          {/* Partner Sites */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.partnerResponsibilities.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('terms.sections.partnerResponsibilities.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-4">
              <li>{t('terms.sections.partnerResponsibilities.items.separate')}</li>
              <li>{t('terms.sections.partnerResponsibilities.items.liability')}</li>
              <li>{t('terms.sections.partnerResponsibilities.items.compliance')}</li>
              <li>{t('terms.sections.partnerResponsibilities.items.misuse')}</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-sm">
              {t('terms.sections.partnerResponsibilities.report')}
            </p>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.prohibited.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('terms.sections.prohibited.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>{t('terms.sections.prohibited.items.illegal')}</li>
              <li>{t('terms.sections.prohibited.items.impersonate')}</li>
              <li>{t('terms.sections.prohibited.items.malware')}</li>
              <li>{t('terms.sections.prohibited.items.unauthorized')}</li>
              <li>{t('terms.sections.prohibited.items.interfere')}</li>
              <li>{t('terms.sections.prohibited.items.spam')}</li>
              <li>{t('terms.sections.prohibited.items.fraud')}</li>
              <li>{t('terms.sections.prohibited.items.abuse')}</li>
            </ul>
          </section>

          {/* Account Termination */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.termination.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('terms.sections.termination.content')}
            </p>
            <div className="ml-4 mb-4">
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('terms.sections.termination.reasons.title')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li>{t('terms.sections.termination.reasons.items.violation')}</li>
                <li>{t('terms.sections.termination.reasons.items.illegal')}</li>
                <li>{t('terms.sections.termination.reasons.items.fraud')}</li>
                <li>{t('terms.sections.termination.reasons.items.request')}</li>
                <li>{t('terms.sections.termination.reasons.items.inactivity')}</li>
              </ul>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('terms.sections.termination.effect')}
            </p>
            <p className="text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-sm">
              {t('terms.sections.termination.appeal')}
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.liability.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 font-medium">
              {t('terms.sections.liability.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>{t('terms.sections.liability.items.asis')}</li>
              <li>{t('terms.sections.liability.items.nowarranty')}</li>
              <li>{t('terms.sections.liability.items.nodamages')}</li>
              <li>{t('terms.sections.liability.items.cap')}</li>
            </ul>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.indemnification.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('terms.sections.indemnification.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>{t('terms.sections.indemnification.items.access')}</li>
              <li>{t('terms.sections.indemnification.items.violation')}</li>
              <li>{t('terms.sections.indemnification.items.rights')}</li>
              <li>{t('terms.sections.indemnification.items.content')}</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.governingLaw.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('terms.sections.governingLaw.content')}
            </p>
            <div className="ml-4 mb-4">
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                {t('terms.sections.governingLaw.disputes.title')}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {t('terms.sections.governingLaw.disputes.content')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li>{t('terms.sections.governingLaw.disputes.items.informal')}</li>
                <li>{t('terms.sections.governingLaw.disputes.items.arbitration')}</li>
                <li>{t('terms.sections.governingLaw.disputes.items.courts')}</li>
              </ul>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {t('terms.sections.governingLaw.classAction')}
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.changes.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('terms.sections.changes.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-4">
              <li>{t('terms.sections.changes.items.email')}</li>
              <li>{t('terms.sections.changes.items.notice')}</li>
              <li>{t('terms.sections.changes.items.login')}</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400">
              {t('terms.sections.changes.continued')}
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.severability.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('terms.sections.severability.content')}
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.contact.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('terms.sections.contact.content')}
            </p>
          </section>

          {/* Company Information */}
          <section className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('terms.sections.companyInfo.title')}
            </h3>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p><strong>{t('terms.sections.companyInfo.name')}</strong></p>
              <p>{t('terms.sections.companyInfo.address')}</p>
              <p>
                Email: <a href="mailto:legal@kimlik.az" className="text-emerald-600 dark:text-emerald-400">{t('terms.sections.companyInfo.email')}</a>
              </p>
            </div>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
            <Link
              href="/privacy"
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              ← {t('privacy.title')}
            </Link>
            <Link
              href="/data-deletion"
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t('dataDeletion.title')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
