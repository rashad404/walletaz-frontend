import LoginForm from './LoginForm';
import { getLoginData } from '@/lib/server/login-data';

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const returnUrl = typeof query.return_url === 'string' ? query.return_url : null;
  const { partnerApp, appleEnabled } = await getLoginData(returnUrl);
  return <LoginForm returnUrl={returnUrl} partnerApp={partnerApp} appleEnabled={appleEnabled} />;
}
