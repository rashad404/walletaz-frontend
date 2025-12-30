'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.89.150.50:8011/api';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  permission: NotificationPermission;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check if push notifications are supported
  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (supported && Notification.permission) {
      setPermission(Notification.permission);
    }

    // Check current subscription status (only if supported)
    if (supported) {
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      console.log('[PushNotifications] Checking subscription status...');

      // Check browser support first
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[PushNotifications] Browser does not support push notifications');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      console.log('[PushNotifications] Service worker is ready');

      const subscription = await registration.pushManager.getSubscription();
      console.log('[PushNotifications] Current subscription:', subscription);

      const isCurrentlySubscribed = !!subscription;
      console.log('[PushNotifications] Is subscribed:', isCurrentlySubscribed);

      setIsSubscribed(isCurrentlySubscribed);
    } catch (err) {
      console.error('[PushNotifications] Error checking subscription:', err);
    }
  };

  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    await navigator.serviceWorker.ready;
    return registration;
  };

  const getVapidPublicKey = async (): Promise<string> => {
    try {
      console.log('[PushNotifications] Fetching VAPID public key...');
      const response = await axios.get(`${API_BASE_URL}/notifications/vapid-public-key`);
      console.log('[PushNotifications] VAPID key received:', response.data);
      return response.data.data.public_key;
    } catch (err: any) {
      console.error('[PushNotifications] Error fetching VAPID key:', err.response?.data || err.message);
      throw new Error('Failed to fetch VAPID public key');
    }
  };

  const subscribe = async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[PushNotifications] Starting subscription process...');

      // Request notification permission
      console.log('[PushNotifications] Requesting notification permission...');
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      console.log('[PushNotifications] Permission result:', permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Register service worker
      console.log('[PushNotifications] Registering service worker...');
      const registration = await registerServiceWorker();
      console.log('[PushNotifications] Service worker registered');

      // Get VAPID public key from backend
      const vapidPublicKey = await getVapidPublicKey();
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      console.log('[PushNotifications] Subscribing to push manager...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
      console.log('[PushNotifications] Push manager subscription successful');

      // Send subscription to backend
      console.log('[PushNotifications] Sending subscription to backend...');
      const token = localStorage.getItem('token');
      const subscriptionData = subscription.toJSON();
      console.log('[PushNotifications] Subscription data:', subscriptionData);

      const response = await axios.post(
        `${API_BASE_URL}/notifications/subscribe`,
        subscriptionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[PushNotifications] Backend response:', response.data);
      setIsSubscribed(true);
      console.log('[PushNotifications] ✅ Successfully subscribed to push notifications!');
    } catch (err: any) {
      console.error('[PushNotifications] ❌ Error subscribing:', err);
      console.error('[PushNotifications] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || err.message || 'Failed to subscribe to push notifications');
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Unsubscribe from push service
      await subscription.unsubscribe();

      // Remove subscription from backend
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/notifications/unsubscribe`,
        {
          endpoint: subscription.endpoint,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setIsSubscribed(false);
      console.log('Successfully unsubscribed from push notifications');
    } catch (err: any) {
      console.error('Error unsubscribing from push notifications:', err);
      setError(err.message || 'Failed to unsubscribe from push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    permission,
    subscribe,
    unsubscribe,
  };
}
