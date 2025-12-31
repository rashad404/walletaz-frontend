'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import {
  Plus,
  Edit2,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Code,
  ExternalLink,
  Eye,
  EyeOff,
  ArrowLeft,
  Users,
  Globe,
  Shield,
  Loader2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface OAuthApp {
  id: number;
  client_id: string;
  client_secret?: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  redirect_uris: string[];
  allowed_scopes: string[];
  is_active: boolean;
  is_confidential: boolean;
  connected_users_count: number;
  created_at: string;
  updated_at: string;
}

interface OAuthScope {
  name: string;
  display_name: Record<string, string>;
  description: Record<string, string>;
  category: string;
}

export default function DeveloperAppsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'az';

  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [scopes, setScopes] = useState<OAuthScope[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState<OAuthApp | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAppSecret, setNewAppSecret] = useState<{ id: number; secret: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    description: '',
    redirect_uris: [''],
    allowed_scopes: [] as string[],
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push(`/${lang}/login`);
      return;
    }
    loadApps();
    loadScopes();
  }, []);

  const loadApps = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/apps`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setApps(data.data);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load apps');
    } finally {
      setIsLoading(false);
    }
  };

  const loadScopes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/scopes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setScopes(data.data);
      }
    } catch (err) {
      console.error('Failed to load scopes:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingApp
        ? `${process.env.NEXT_PUBLIC_API_URL}/oauth/apps/${editingApp.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/oauth/apps`;

      const response = await fetch(url, {
        method: editingApp ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          redirect_uris: formData.redirect_uris.filter(uri => uri.trim()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save app');
      }

      // If creating new app, show the secret
      if (!editingApp && data.data.client_secret) {
        setNewAppSecret({
          id: data.data.id,
          secret: data.data.client_secret,
        });
      }

      await loadApps();
      setShowModal(false);
      setEditingApp(null);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (app: OAuthApp) => {
    if (!confirm(t('developer.apps.confirmDelete', { app: app.name }))) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/apps/${app.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await loadApps();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRegenerateSecret = async (app: OAuthApp) => {
    if (!confirm(t('developer.apps.regenerateWarning'))) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/apps/${app.id}/regenerate-secret`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.status === 'success') {
        setNewAppSecret({
          id: app.id,
          secret: data.data.client_secret,
        });
        await loadApps();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts (HTTP)
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleSecretVisibility = (appId: number) => {
    setVisibleSecrets(prev => {
      const next = new Set(prev);
      if (next.has(appId)) {
        next.delete(appId);
      } else {
        next.add(appId);
      }
      return next;
    });
  };

  const openAddModal = () => {
    setEditingApp(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (app: OAuthApp) => {
    setEditingApp(app);
    setFormData({
      name: app.name,
      logo_url: app.logo_url || '',
      website_url: app.website_url || '',
      description: app.description || '',
      redirect_uris: app.redirect_uris.length > 0 ? app.redirect_uris : [''],
      allowed_scopes: app.allowed_scopes,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      logo_url: '',
      website_url: '',
      description: '',
      redirect_uris: [''],
      allowed_scopes: [],
    });
  };

  const addRedirectUri = () => {
    setFormData(prev => ({
      ...prev,
      redirect_uris: [...prev.redirect_uris, ''],
    }));
  };

  const removeRedirectUri = (index: number) => {
    setFormData(prev => ({
      ...prev,
      redirect_uris: prev.redirect_uris.filter((_, i) => i !== index),
    }));
  };

  const updateRedirectUri = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      redirect_uris: prev.redirect_uris.map((uri, i) => i === index ? value : uri),
    }));
  };

  const toggleScope = (scopeName: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_scopes: prev.allowed_scopes.includes(scopeName)
        ? prev.allowed_scopes.filter(s => s !== scopeName)
        : [...prev.allowed_scopes, scopeName],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/settings"
                className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('developer.apps.title')}
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {t('developer.description')}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-6 py-3 rounded-2xl font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 hover:shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('developer.apps.createApp')}
          </button>
        </div>

        {/* Documentation Banner */}
        <div className="mb-6 rounded-2xl p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {t('developer.docs.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('developer.docs.description')}
                </p>
              </div>
            </div>
            <Link
              href="/docs/oauth"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors flex items-center gap-2 flex-shrink-0"
            >
              {t('developer.docs.viewDocs')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-2xl p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* New Secret Alert */}
        {newAppSecret && (
          <div className="mb-6 rounded-2xl p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-amber-800 dark:text-amber-200 mb-2">
                  {t('developer.apps.secretCreated')}
                </h3>
                <p className="text-amber-700 dark:text-amber-300 text-sm mb-3">
                  {t('developer.apps.secretWarning')}
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg font-mono text-sm text-amber-900 dark:text-amber-100 break-all">
                    {newAppSecret.secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newAppSecret.secret, `new-secret-${newAppSecret.id}`)}
                    className="p-2 rounded-lg bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
                  >
                    {copiedField === `new-secret-${newAppSecret.id}` ? (
                      <Check className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                    ) : (
                      <Copy className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setNewAppSecret(null)}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Apps Grid */}
        {apps.length === 0 ? (
          <div className="rounded-3xl p-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Code className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {t('developer.apps.noApps')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {t('developer.apps.noAppsDesc')}
            </p>
            <button
              onClick={openAddModal}
              className="px-8 py-3 rounded-2xl font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg transition-all duration-300"
            >
              {t('developer.apps.createApp')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {apps.map((app) => (
              <div
                key={app.id}
                className="rounded-3xl p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
              >
                {/* App Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {app.logo_url ? (
                      <img
                        src={app.logo_url}
                        alt={app.name}
                        className="w-12 h-12 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <Code className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {app.name}
                      </h3>
                      {app.website_url && (
                        <a
                          href={app.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          {new URL(app.website_url).hostname}
                        </a>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-medium ${
                    app.is_active
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400'
                  }`}>
                    {app.is_active ? t('developer.apps.active') : t('developer.apps.inactive')}
                  </span>
                </div>

                {app.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {app.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {app.connected_users_count}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('developer.apps.connectedUsers')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
                      {app.redirect_uris.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('developer.apps.redirectUris')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                      {app.allowed_scopes.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('developer.apps.scopes')}</div>
                  </div>
                </div>

                {/* Credentials */}
                <div className="space-y-3 mb-4">
                  {/* Client ID */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      {t('developer.apps.clientId')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={app.client_id}
                        readOnly
                        className="flex-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(app.client_id, `client-${app.id}`)}
                        className={`p-2 rounded-xl transition-colors ${
                          copiedField === `client-${app.id}`
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {copiedField === `client-${app.id}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Client Secret (masked) */}
                  {app.is_confidential && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                        {t('developer.apps.clientSecret')}
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-500 dark:text-gray-400 font-mono">
                          {'•'.repeat(32)}
                        </div>
                        <button
                          onClick={() => handleRegenerateSecret(app)}
                          className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 transition-colors"
                          title={t('developer.apps.regenerateSecret')}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(app)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('developer.apps.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(app)}
                    className="px-4 py-2.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-xl transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {editingApp ? t('developer.form.editApp') : t('developer.form.createApp')}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('developer.form.name')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('developer.form.namePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Logo URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('developer.form.logo')}
                  </label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder={t('developer.form.logoPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Website URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('developer.form.website')}
                  </label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder={t('developer.form.websitePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('developer.form.description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('developer.form.descriptionPlaceholder')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Redirect URIs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('developer.form.redirectUri')} *
                  </label>
                  <div className="space-y-2">
                    {formData.redirect_uris.map((uri, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={uri}
                          onChange={(e) => updateRedirectUri(index, e.target.value)}
                          placeholder={t('developer.form.redirectUriPlaceholder')}
                          className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          required={index === 0}
                        />
                        {formData.redirect_uris.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRedirectUri(index)}
                            className="p-3 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addRedirectUri}
                    className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    {t('developer.form.addRedirectUri')}
                  </button>
                </div>

                {/* Scopes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('developer.form.selectScopes')} *
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {t('developer.form.scopesNote')}
                  </p>
                  <div className="space-y-2">
                    {scopes.map((scope) => (
                      <label
                        key={scope.name}
                        className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                          formData.allowed_scopes.includes(scope.name)
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.allowed_scopes.includes(scope.name)}
                          onChange={() => toggleScope(scope.name)}
                          className="w-5 h-5 rounded-lg border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {scope.display_name[lang] || scope.display_name['en']}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {scope.description[lang] || scope.description['en']}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingApp(null);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || formData.allowed_scopes.length === 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    {editingApp ? t('common.save') : t('common.create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
