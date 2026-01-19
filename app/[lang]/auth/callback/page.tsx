"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import authService from '@/lib/api/auth';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const returnUrl = searchParams.get('return_url');

      if (token) {
        // Store the token
        authService.setToken(token);

        // Redirect to return URL or dashboard
        const destination = returnUrl ? decodeURIComponent(returnUrl) : '/alerts';
        router.push(destination);
      } else {
        // No token, redirect to login
        router.push('/auth/login');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Completing authentication...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}