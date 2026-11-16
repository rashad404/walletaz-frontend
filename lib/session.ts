export function setSessionToken(token: string) {
  localStorage.setItem('token', token);
  document.cookie = `kimlik_session=1; Path=/; SameSite=Lax; Max-Age=604800${location.protocol === 'https:' ? '; Secure' : ''}`;
}

export function clearSessionToken() {
  localStorage.removeItem('token');
  document.cookie = 'kimlik_session=; Path=/; SameSite=Lax; Max-Age=0';
}
