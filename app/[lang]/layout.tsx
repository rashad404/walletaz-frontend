import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { i18n, type Locale } from "@/i18n-config";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LangLayoutProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
  };
}

export default async function LangLayout({
  children,
  params
}: LangLayoutProps) {
  const { lang } = await params;

  // Validate that the incoming `lang` parameter is valid
  if (!i18n.locales.includes(lang as Locale)) {
    notFound();
  }

  // Load messages for the current locale
  const messages = await getMessages({ locale: lang });

  // Check if this is an OAuth popup (no header/footer needed)
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isOAuthPopup = pathname.includes("/oauth/");

  if (isOAuthPopup) {
    return (
      <NextIntlClientProvider locale={lang} messages={messages}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return (
    <NextIntlClientProvider locale={lang} messages={messages}>
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors flex flex-col">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}

export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}
