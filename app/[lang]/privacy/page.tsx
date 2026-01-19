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
    title: `${t('privacy.title')} - Kimlik.az`,
    description: t('privacy.description'),
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('privacy.title')}
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm space-y-8">
          <p className="text-gray-600 dark:text-gray-400">
            {t('privacy.lastUpdated')}: January 2025
          </p>

          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.introduction.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('privacy.sections.introduction.content')}
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.collection.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('privacy.sections.collection.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>{t('privacy.sections.collection.items.personal')}</li>
              <li>{t('privacy.sections.collection.items.profile')}</li>
              <li>{t('privacy.sections.collection.items.verification')}</li>
              <li>{t('privacy.sections.collection.items.payment')}</li>
              <li>{t('privacy.sections.collection.items.usage')}</li>
            </ul>
          </section>

          {/* Social Login */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.socialLogin.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('privacy.sections.socialLogin.content')}
            </p>

            <div className="ml-4 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                  {t('privacy.sections.socialLogin.facebook.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('privacy.sections.socialLogin.facebook.content')}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  {t('privacy.sections.socialLogin.facebook.revoke')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                  {t('privacy.sections.socialLogin.google.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('privacy.sections.socialLogin.google.content')}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  {t('privacy.sections.socialLogin.google.revoke')}
                </p>
              </div>
            </div>
          </section>

          {/* Third-Party Partner Sites */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.thirdPartyPartners.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('privacy.sections.thirdPartyPartners.content')}
            </p>

            <div className="ml-4 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                  {t('privacy.sections.thirdPartyPartners.dataShared.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('privacy.sections.thirdPartyPartners.dataShared.content')}
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                  <li>{t('privacy.sections.thirdPartyPartners.dataShared.items.profile')}</li>
                  <li>{t('privacy.sections.thirdPartyPartners.dataShared.items.email')}</li>
                  <li>{t('privacy.sections.thirdPartyPartners.dataShared.items.phone')}</li>
                  <li>{t('privacy.sections.thirdPartyPartners.dataShared.items.verification')}</li>
                  <li>{t('privacy.sections.thirdPartyPartners.dataShared.items.wallet')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                  {t('privacy.sections.thirdPartyPartners.partnerObligations.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('privacy.sections.thirdPartyPartners.partnerObligations.content')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                  {t('privacy.sections.thirdPartyPartners.revokeAccess.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('privacy.sections.thirdPartyPartners.revokeAccess.content')}
                </p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.cookies.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('privacy.sections.cookies.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-4">
              <li>{t('privacy.sections.cookies.types.essential')}</li>
              <li>{t('privacy.sections.cookies.types.analytics')}</li>
              <li>{t('privacy.sections.cookies.types.preferences')}</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400">
              {t('privacy.sections.cookies.manage')}
            </p>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.usage.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('privacy.sections.usage.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>{t('privacy.sections.usage.items.provide')}</li>
              <li>{t('privacy.sections.usage.items.process')}</li>
              <li>{t('privacy.sections.usage.items.verify')}</li>
              <li>{t('privacy.sections.usage.items.communicate')}</li>
              <li>{t('privacy.sections.usage.items.respond')}</li>
              <li>{t('privacy.sections.usage.items.analytics')}</li>
              <li>{t('privacy.sections.usage.items.legal')}</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.sharing.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('privacy.sections.sharing.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-4">
              <li>{t('privacy.sections.sharing.items.consent')}</li>
              <li>{t('privacy.sections.sharing.items.legal')}</li>
              <li>{t('privacy.sections.sharing.items.protection')}</li>
              <li>{t('privacy.sections.sharing.items.business')}</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              {t('privacy.sections.sharing.noSale')}
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.retention.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('privacy.sections.retention.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-4">
              <li>{t('privacy.sections.retention.periods.account')}</li>
              <li>{t('privacy.sections.retention.periods.transactions')}</li>
              <li>{t('privacy.sections.retention.periods.logs')}</li>
              <li>{t('privacy.sections.retention.periods.analytics')}</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400">
              {t('privacy.sections.retention.partners')}
            </p>
          </section>

          {/* Your Rights (GDPR) */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.rights.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('privacy.sections.rights.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-4">
              <li>{t('privacy.sections.rights.items.access')}</li>
              <li>{t('privacy.sections.rights.items.rectification')}</li>
              <li>{t('privacy.sections.rights.items.erasure')}</li>
              <li>{t('privacy.sections.rights.items.portability')}</li>
              <li>{t('privacy.sections.rights.items.restriction')}</li>
              <li>{t('privacy.sections.rights.items.objection')}</li>
              <li>{t('privacy.sections.rights.items.withdraw')}</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
              {t('privacy.sections.rights.exercise')}
            </p>
          </section>

          {/* Legal Basis for Processing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.legalBasis.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('privacy.sections.legalBasis.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>{t('privacy.sections.legalBasis.items.consent')}</li>
              <li>{t('privacy.sections.legalBasis.items.contract')}</li>
              <li>{t('privacy.sections.legalBasis.items.legitimate')}</li>
              <li>{t('privacy.sections.legalBasis.items.legal')}</li>
            </ul>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.internationalTransfers.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('privacy.sections.internationalTransfers.content')}
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.children.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('privacy.sections.children.content')}
            </p>
          </section>

          {/* Security Measures */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.security.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('privacy.sections.security.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>{t('privacy.sections.security.items.encryption')}</li>
              <li>{t('privacy.sections.security.items.access')}</li>
              <li>{t('privacy.sections.security.items.monitoring')}</li>
              <li>{t('privacy.sections.security.items.audits')}</li>
              <li>{t('privacy.sections.security.items.training')}</li>
            </ul>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.changes.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('privacy.sections.changes.content')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-4">
              <li>{t('privacy.sections.changes.items.email')}</li>
              <li>{t('privacy.sections.changes.items.notice')}</li>
              <li>{t('privacy.sections.changes.items.app')}</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400">
              {t('privacy.sections.changes.effective')}
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.contact.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('privacy.sections.contact.content')}
            </p>
          </section>

          {/* Company Information */}
          <section className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('privacy.sections.companyInfo.title')}
            </h3>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p><strong>{t('privacy.sections.companyInfo.name')}</strong></p>
              <p>{t('privacy.sections.companyInfo.address')}</p>
              <p>
                Email: <a href="mailto:privacy@kimlik.az" className="text-emerald-600 dark:text-emerald-400">{t('privacy.sections.companyInfo.email')}</a>
              </p>
              <p className="text-sm mt-4">
                {t('privacy.sections.companyInfo.dataProtection')}
              </p>
            </div>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
            <Link
              href="/terms"
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t('terms.title')} →
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
