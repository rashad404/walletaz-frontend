export const APPLE_API = process.env.NEXT_PUBLIC_API_URL || 'https://api.kimlik.az/api';
export const APPLE_SESSION_KEY = 'kimlik.apple.pkce';

export async function startAppleSignIn(locale: string, returnUrl?: string | null, token?: string | null) {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const encode = (value: Uint8Array) => btoa(String.fromCharCode(...value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const verifier = encode(bytes);
  const challenge = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  sessionStorage.setItem(APPLE_SESSION_KEY, JSON.stringify({verifier, expires: Date.now() + 15 * 60_000}));
  const response = await fetch(`${APPLE_API}${token ? '/account/link/apple' : '/auth/apple/start'}`, {
    method: 'POST', credentials: 'include',
    headers: {'Content-Type': 'application/json', Accept: 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})},
    body: JSON.stringify({code_challenge: challenge, locale, return_url: returnUrl}),
  });
  const result = await response.json();
  if (!response.ok || !result.data?.url) throw new Error('Apple sign-in could not start');
  const url = new URL(result.data.url);
  if (url.origin !== 'https://appleid.apple.com') throw new Error('Invalid sign-in destination');
  window.location.assign(url.href);
}
