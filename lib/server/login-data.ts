import 'server-only';
import { cache } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.kimlik.az/api';
async function publicData(path: string, seconds: number) {
  try {
    const response = await fetch(`${API}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: seconds },
      signal: AbortSignal.timeout(1500),
    });
    return response.ok ? (await response.json()).data ?? null : null;
  } catch { return null; }
}

export const getPublicConfig = cache(() => publicData('/config', 300));
export async function getLoginData(returnUrl: string | null) {
  let partnerPath: string | null = null;
  try {
    const url = new URL(returnUrl || '', 'https://kimlik.az');
    if (/^\/(?:az\/|en\/|ru\/)?oauth\/authorize$/.test(url.pathname)) {
      const client_id = url.searchParams.get('client_id');
      const redirect_uri = url.searchParams.get('redirect_uri');
      if (client_id && redirect_uri) partnerPath = `/oauth/client?${new URLSearchParams({ client_id, redirect_uri })}`;
    }
  } catch { /* Invalid return URLs have no partner branding. */ }
  // Only public metadata is cached. The API validates the client and redirect URI.
  const [, partnerApp, apple] = await Promise.all([
    getPublicConfig(),
    partnerPath ? publicData(partnerPath, 60) : null,
    publicData('/auth/apple/availability', 300),
  ]);
  return { partnerApp, appleEnabled: apple?.enabled === true };
}
