import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import LoginForm from '@/app/[lang]/login/LoginForm';
import { getLoginData } from '@/lib/server/login-data';

export const revalidate = 60;
export const dynamic = 'force-static';
export const dynamicParams = true;
export function generateStaticParams() { return []; }

export default async function LoginShell({params}: {params: Promise<{lang: string; client: string; redirect: string}>}) {
  const {lang, client, redirect} = await params;
  if (!['az', 'en', 'ru'].includes(lang) || !/^[a-f0-9-]{36}$/i.test(client)) notFound();
  let redirectUri: string;
  try {
    redirectUri = Buffer.from(redirect, 'base64url').toString('utf8');
    if (redirectUri.length > 2048 || !/^https?:\/\//.test(redirectUri)) notFound();
  } catch { notFound(); }
  const returnUrl = `/oauth/authorize?${new URLSearchParams({client_id: client, redirect_uri: redirectUri})}`;
  const [data, allMessages] = await Promise.all([getLoginData(returnUrl), getMessages({locale: lang})]);
  if (!data.partnerApp) notFound();
  const messages = Object.fromEntries(['login', 'auth', 'common', 'appleAuth', 'settings'].map(key => [key, allMessages[key]]));
  return <NextIntlClientProvider locale={lang} messages={messages}>
    <LoginForm returnUrl={null} publicShell partnerApp={data.partnerApp} appleEnabled={data.appleEnabled}/>
  </NextIntlClientProvider>;
}
