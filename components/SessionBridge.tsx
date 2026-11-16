"use client";
import { useEffect } from 'react';
import { setSessionToken } from '@/lib/session';
export function SessionBridge() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    // Auth pages await their own bridge before navigating.
    if (token && !/\/(login|auth|oauth)(\/|$)/.test(location.pathname)) void setSessionToken(token);
  }, []);
  return null;
}
