'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/lib/navigation';
import {
  User,
  Shield,
  ChevronRight,
  Phone,
  Edit2,
  Loader2,
  BadgeCheck,
  Check,
  AlertCircle,
  ExternalLink,
  Code,
  History,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.lang as string) || 'az';

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push(`/login`);
      return;
    }

    // Fetch user data
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setUser(data.data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch user:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate verification status
  const isPhoneVerified = !!user.phone_verified_at;
  const isEmailVerified = !!user.email_verified_at;
  const verifiedCount = (isPhoneVerified ? 1 : 0) + (isEmailVerified ? 1 : 0);
  const isFullyVerified = verifiedCount === 2;

  const settingsMenu = [
    {
      id: 'profile',
      title: t('settings.profile.title'),
      description: t('settings.profile.description'),
      icon: User,
      href: `/settings/profile`,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      badge: null
    },
    {
      id: 'verification',
      title: t('verification.title'),
      description: t('verification.description'),
      icon: BadgeCheck,
      href: `/settings/verification`,
      color: isFullyVerified ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400',
      bgColor: isFullyVerified ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30',
      badge: {
        text: t('verification.verifiedCount', { count: verifiedCount, total: 2 }),
        color: isFullyVerified
          ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
          : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
      }
    },
    {
      id: 'security',
      title: t('settings.security.title'),
      description: t('settings.security.description'),
      icon: Shield,
      href: `/settings/security`,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-100 dark:bg-teal-900/30',
      badge: null
    },
    {
      id: 'connected-apps',
      title: t('connectedApps.title'),
      description: t('connectedApps.description'),
      icon: ExternalLink,
      href: `/settings/connected-apps`,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      badge: null
    },
    {
      id: 'login-history',
      title: t('loginHistory.title'),
      description: t('loginHistory.description'),
      icon: History,
      href: `/settings/login-history`,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      badge: null
    },
    {
      id: 'developer',
      title: t('developer.title'),
      description: t('developer.description'),
      icon: Code,
      href: `/settings/developer`,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      badge: null
    }
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('settings.manageAccount')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 sticky top-8">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-1">
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {user.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {user.email}
                </p>
                {/* Verification Status */}
                {isFullyVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                    <Check className="w-3 h-3" />
                    {t('verification.verified')}
                  </span>
                ) : (
                  <Link
                    href={`/settings/verification`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/70 transition-colors"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {t('verification.verifyNow')}
                  </Link>
                )}
              </div>

              {/* Quick Info */}
              <div className="space-y-3 mb-6">
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              {/* Edit Profile Button */}
              <Link
                href={`/settings/profile`}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 text-center font-medium text-sm flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {t('settings.profile.editProfile')}
              </Link>
            </div>
          </div>

          {/* Settings Menu */}
          <div className="lg:col-span-2 space-y-4">
            {settingsMenu.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-3xl p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h3>
                        {item.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.badge.color}`}>
                            {item.badge.text}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
