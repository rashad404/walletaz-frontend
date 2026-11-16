export async function setSessionToken(token: string) {
  localStorage.setItem('token', token);
  document.cookie = `kimlik_session=1; Path=/; SameSite=Lax; Max-Age=604800${location.protocol === 'https:' ? '; Secure' : ''}`;
  try {
    await fetch('/api/session', {method: 'POST', headers: {Authorization: `Bearer ${token}`}, signal: AbortSignal.timeout(5500)});
  } catch { /* Keep the existing bearer-token consent flow available if the bridge is down. */ }
}

export function clearSessionToken() {
  localStorage.removeItem('token');
  document.cookie = 'kimlik_session=; Path=/; SameSite=Lax; Max-Age=0';
  return fetch('/api/session', {method: 'DELETE', keepalive: true}).catch(() => {});
}
