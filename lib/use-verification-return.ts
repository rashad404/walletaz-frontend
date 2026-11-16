import { useEffect, useState } from 'react';

export type VerificationRequest = { client_name: string; return_to: string; need: 'phone' | 'email' | 'id' };

export function useVerificationReturn(query: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: VerificationRequest; error?: boolean } | null>(null);
  const params = new URLSearchParams(query);
  const requested = ['client_id', 'return_to', 'need'].some(key => params.has(key));
  const key = `${attempt}:${query}`;
  useEffect(() => {
    if (!requested) return;
    const params = new URLSearchParams(query);
    if (['client_id', 'return_to', 'need'].some(name => params.getAll(name).length !== 1 || !params.get(name))) {
      setResult({ key, error: true });
      return;
    }
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/verification-request`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(Object.fromEntries(['client_id', 'return_to', 'need'].map(name => [name, params.get(name)]))),
      signal: controller.signal, cache: 'no-store',
    }).then(async response => {
      if (!response.ok) throw new Error('Invalid verification request');
      const { data } = await response.json();
      if (!data || !['phone', 'email', 'id'].includes(data.need) || typeof data.client_name !== 'string') throw new Error('Invalid response');
      // Only use the server-approved URL, with an additional browser scheme check.
      const url = new URL(data.return_to);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid return URL');
      if (!controller.signal.aborted) setResult({ key, data });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ key, error: true });
    });
    return () => controller.abort();
  }, [query, requested, key]);
  const current = result?.key === key ? result : null;
  return { requested, context: requested ? current?.data : undefined,
    pending: requested && !current, error: requested && !!current?.error,
    retry: () => setAttempt(value => value + 1) };
}
