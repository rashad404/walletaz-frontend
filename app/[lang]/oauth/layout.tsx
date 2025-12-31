import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

interface OAuthLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function OAuthLayout({
  children,
  params
}: OAuthLayoutProps) {
  const { lang } = await params;
  const messages = await getMessages({ locale: lang });

  return (
    <NextIntlClientProvider locale={lang} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
