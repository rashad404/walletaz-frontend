'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import {
  ArrowLeft,
  Copy,
  Check,
  Key,
  Code,
  AlertCircle,
  Zap,
  ChevronRight,
  Shield,
  User,
  Wallet,
  Lock,
  ExternalLink,
  FileCode,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';

type CodeTab = 'javascript' | 'react' | 'php' | 'python';

interface SidebarItem {
  id: string;
  labelKey: string;
  icon?: React.ComponentType<{ className?: string }>;
  level: 'main' | 'sub';
}

export default function OAuthDocsPage() {
  const t = useTranslations();
  const params = useParams();
  const lang = (params?.lang as string) || 'az';

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CodeTab>('javascript');
  const [activeSection, setActiveSection] = useState('overview');

  const copyToClipboard = (code: string, id: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', labelKey: 'oauthDocs.overview.title', icon: Zap, level: 'main' },
    { id: 'getting-started', labelKey: 'oauthDocs.gettingStarted.title', icon: Key, level: 'main' },
    { id: 'authorization-flow', labelKey: 'oauthDocs.flow.title', icon: ArrowRight, level: 'main' },
    { id: 'flow-steps', labelKey: 'oauthDocs.flow.steps', level: 'sub' },
    { id: 'pkce', labelKey: 'oauthDocs.pkce.title', icon: Lock, level: 'main' },
    { id: 'endpoints', labelKey: 'oauthDocs.endpoints.title', icon: FileCode, level: 'main' },
    { id: 'endpoint-authorize', labelKey: 'oauthDocs.endpoints.authorize', level: 'sub' },
    { id: 'endpoint-token', labelKey: 'oauthDocs.endpoints.token', level: 'sub' },
    { id: 'endpoint-user', labelKey: 'oauthDocs.endpoints.user', level: 'sub' },
    { id: 'scopes', labelKey: 'oauthDocs.scopes.title', icon: Layers, level: 'main' },
    { id: 'code-examples', labelKey: 'oauthDocs.codeExamples.title', icon: Code, level: 'main' },
    { id: 'error-codes', labelKey: 'oauthDocs.errorCodes.title', icon: AlertCircle, level: 'main' },
  ];

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wallet.az';

  const codeExamples: Record<CodeTab, string> = {
    javascript: `// 1. Generate PKCE code verifier and challenge
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
}

// 2. Open authorization popup
async function loginWithWallet() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = crypto.randomUUID();

  // Store for later use
  sessionStorage.setItem('oauth_code_verifier', codeVerifier);
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    client_id: 'YOUR_CLIENT_ID',
    redirect_uri: 'https://yoursite.az/auth/wallet/callback',
    scope: 'profile:read verification:read wallet:read',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    response_type: 'code'
  });

  const popup = window.open(
    \`${API_URL}/oauth/authorize?\${params}\`,
    'wallet_oauth',
    'width=500,height=700,left=100,top=100'
  );

  // Listen for callback
  window.addEventListener('message', handleOAuthMessage);
}

// 3. Handle callback message from popup
function handleOAuthMessage(event) {
  if (event.origin !== '${API_URL}') return;

  if (event.data.type === 'oauth_success') {
    const code = new URL(event.data.redirect_uri).searchParams.get('code');
    exchangeCodeForToken(code);
  }
}

// 4. Exchange code for tokens (do this on your backend!)
async function exchangeCodeForToken(code) {
  const codeVerifier = sessionStorage.getItem('oauth_code_verifier');

  const response = await fetch('${API_URL}/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: 'YOUR_CLIENT_ID',
      code: code,
      redirect_uri: 'https://yoursite.az/auth/wallet/callback',
      code_verifier: codeVerifier
    })
  });

  const data = await response.json();
  // { access_token, refresh_token, expires_in, token_type }
}

// 5. Fetch user data with access token
async function getUserData(accessToken) {
  const response = await fetch('${API_URL}/oauth/user', {
    headers: { 'Authorization': \`Bearer \${accessToken}\` }
  });
  return response.json();
}`,
    react: `// components/LoginWithWallet.tsx
'use client';

import { useState } from 'react';

const API_URL = '${API_URL}';

// PKCE helpers
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
}

export default function LoginWithWallet() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = crypto.randomUUID();

    sessionStorage.setItem('oauth_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_WALLET_CLIENT_ID!,
      redirect_uri: \`\${window.location.origin}/auth/wallet/callback\`,
      scope: 'profile:read verification:read wallet:read',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      response_type: 'code'
    });

    const popup = window.open(
      \`\${API_URL}/oauth/authorize?\${params}\`,
      'wallet_oauth',
      'width=500,height=700'
    );

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== API_URL) return;

      window.removeEventListener('message', handleMessage);

      if (event.data.type === 'oauth_success') {
        const url = new URL(event.data.redirect_uri);
        const code = url.searchParams.get('code');

        // Exchange code via your backend
        const res = await fetch('/api/auth/wallet/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            code_verifier: sessionStorage.getItem('oauth_code_verifier')
          })
        });

        if (res.ok) {
          window.location.href = '/dashboard';
        }
      }
      setIsLoading(false);
    };

    window.addEventListener('message', handleMessage);
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="flex items-center gap-3 px-6 py-3 bg-emerald-500
                 hover:bg-emerald-600 text-white rounded-xl font-medium"
    >
      <WalletIcon className="w-5 h-5" />
      {isLoading ? 'Connecting...' : 'Login with Wallet'}
    </button>
  );
}`,
    php: `<?php
// config/services.php
return [
    'wallet' => [
        'client_id' => env('WALLET_CLIENT_ID'),
        'client_secret' => env('WALLET_CLIENT_SECRET'), // Optional for PKCE
        'api_url' => env('WALLET_API_URL', '${API_URL}'),
    ],
];

// app/Http/Controllers/WalletAuthController.php
namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Http;

class WalletAuthController extends Controller
{
    /**
     * Exchange authorization code for tokens
     */
    public function callback(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'code_verifier' => 'required|string',
        ]);

        $response = Http::post(config('services.wallet.api_url') . '/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => config('services.wallet.client_id'),
            'code' => $request->code,
            'redirect_uri' => route('auth.wallet.callback'),
            'code_verifier' => $request->code_verifier,
        ]);

        if (!$response->successful()) {
            return response()->json(['error' => 'Token exchange failed'], 400);
        }

        $tokens = $response->json();

        // Fetch user data
        $userResponse = Http::withToken($tokens['access_token'])
            ->get(config('services.wallet.api_url') . '/oauth/user');

        if (!$userResponse->successful()) {
            return response()->json(['error' => 'Failed to fetch user'], 400);
        }

        $walletUser = $userResponse->json()['data'];

        // Find or create user
        $user = User::updateOrCreate(
            ['wallet_id' => $walletUser['id']],
            [
                'name' => $walletUser['name'],
                'email' => $walletUser['email'],
                'wallet_access_token' => $tokens['access_token'],
                'wallet_refresh_token' => $tokens['refresh_token'],
            ]
        );

        // Login user
        auth()->login($user);

        return response()->json(['success' => true]);
    }
}`,
    python: `# Flask example
from flask import Flask, redirect, request, session
import requests
import hashlib
import base64
import secrets

app = Flask(__name__)
app.secret_key = 'your-secret-key'

API_URL = '${API_URL}'
CLIENT_ID = 'your-client-id'
REDIRECT_URI = 'https://yoursite.az/auth/wallet/callback'

def generate_code_verifier():
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b'=').decode()

def generate_code_challenge(verifier):
    digest = hashlib.sha256(verifier.encode()).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b'=').decode()

@app.route('/login/wallet')
def login_wallet():
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    state = secrets.token_urlsafe(16)

    session['oauth_code_verifier'] = code_verifier
    session['oauth_state'] = state

    params = {
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'scope': 'profile:read verification:read wallet:read',
        'state': state,
        'code_challenge': code_challenge,
        'code_challenge_method': 'S256',
        'response_type': 'code'
    }

    auth_url = f"{API_URL}/oauth/authorize?" + "&".join(
        f"{k}={v}" for k, v in params.items()
    )
    return redirect(auth_url)

@app.route('/auth/wallet/callback')
def wallet_callback():
    code = request.args.get('code')
    state = request.args.get('state')

    # Verify state
    if state != session.get('oauth_state'):
        return 'Invalid state', 400

    # Exchange code for token
    token_response = requests.post(f"{API_URL}/oauth/token", json={
        'grant_type': 'authorization_code',
        'client_id': CLIENT_ID,
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'code_verifier': session['oauth_code_verifier']
    })

    tokens = token_response.json()

    # Fetch user data
    user_response = requests.get(
        f"{API_URL}/oauth/user",
        headers={'Authorization': f"Bearer {tokens['access_token']}"}
    )

    user_data = user_response.json()['data']

    # Create session for user
    session['user'] = user_data
    session['access_token'] = tokens['access_token']

    return redirect('/dashboard')`
  };

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="cursor-pointer absolute top-3 right-3 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        title={t('common.copy')}
      >
        {copiedCode === id ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl sticky top-0 h-screen overflow-y-auto">
          <div className="p-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </Link>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('oauthDocs.title')}
            </h2>
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-3 py-2 rounded-lg text-sm transition-colors ${
                    item.level === 'sub' ? 'pl-9 pr-3' : 'px-3'
                  } ${
                    activeSection === item.id
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.level === 'sub' && <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600" />}
                  {t(item.labelKey)}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-12 max-w-4xl">
          {/* Mobile Back Button */}
          <Link
            href="/"
            className="lg:hidden inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Link>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    {t('oauthDocs.title')}
                  </span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('oauthDocs.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Overview Section */}
          <section id="overview" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-emerald-500" />
              {t('oauthDocs.overview.title')}
            </h2>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 space-y-4">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('oauthDocs.overview.description')}
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <User className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('oauthDocs.overview.benefit1Title')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('oauthDocs.overview.benefit1Desc')}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('oauthDocs.overview.benefit2Title')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('oauthDocs.overview.benefit2Desc')}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <Wallet className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('oauthDocs.overview.benefit3Title')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('oauthDocs.overview.benefit3Desc')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Getting Started Section */}
          <section id="getting-started" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Key className="w-6 h-6 text-emerald-500" />
              {t('oauthDocs.gettingStarted.title')}
            </h2>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                {t('oauthDocs.gettingStarted.description')}
              </p>
              <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-400">
                <li className="pl-2">{t('oauthDocs.gettingStarted.step1New')}</li>
                <li className="pl-2">{t('oauthDocs.gettingStarted.step2')}</li>
                <li className="pl-2">{t('oauthDocs.gettingStarted.step3')}</li>
                <li className="pl-2">{t('oauthDocs.gettingStarted.step4')}</li>
              </ol>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    {t('oauthDocs.gettingStarted.createAppNote')}
                  </p>
                  <Link
                    href="/settings/developer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    {t('developer.apps.createApp')}
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Authorization Flow Section */}
          <section id="authorization-flow" className="mb-6 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <ArrowRight className="w-6 h-6 text-emerald-500" />
              {t('oauthDocs.flow.title')}
            </h2>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('oauthDocs.flow.description')}
              </p>
              {/* Flow Diagram */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 overflow-x-auto">
                <div className="flex items-center justify-between min-w-[600px] text-sm">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                      <ExternalLink className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">{t('oauthDocs.flow.yourApp')}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-0.5 w-full bg-gray-300 dark:bg-gray-600 relative">
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">1. {t('oauthDocs.flow.redirect')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                      <Wallet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">Wallet.az</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
                    <div className="h-0.5 w-full bg-gray-300 dark:bg-gray-600 relative">
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">2. {t('oauthDocs.flow.code')}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                      <ExternalLink className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">{t('oauthDocs.flow.yourApp')}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-0.5 w-full bg-gray-300 dark:bg-gray-600 relative">
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">3. {t('oauthDocs.flow.exchange')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                      <Key className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">{t('oauthDocs.flow.tokens')}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Flow Steps */}
          <section id="flow-steps" className="mb-12 scroll-mt-6 ml-8 pl-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('oauthDocs.flow.steps')}
            </h3>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 space-y-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{t('oauthDocs.flow.step1Title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('oauthDocs.flow.step1Desc')}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{t('oauthDocs.flow.step2Title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('oauthDocs.flow.step2Desc')}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{t('oauthDocs.flow.step3Title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('oauthDocs.flow.step3Desc')}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">4</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{t('oauthDocs.flow.step4Title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('oauthDocs.flow.step4Desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PKCE Section */}
          <section id="pkce" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-emerald-500" />
              {t('oauthDocs.pkce.title')}
            </h2>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                {t('oauthDocs.pkce.description')}
              </p>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                  {t('oauthDocs.pkce.required')}
                </p>
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mt-4">{t('oauthDocs.pkce.howItWorks')}</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li>{t('oauthDocs.pkce.step1')}</li>
                <li>{t('oauthDocs.pkce.step2')}</li>
                <li>{t('oauthDocs.pkce.step3')}</li>
                <li>{t('oauthDocs.pkce.step4')}</li>
              </ol>
              <CodeBlock
                code={`// Generate code_verifier (43-128 characters, URL-safe)
const codeVerifier = generateRandomString(43);

// Generate code_challenge using SHA-256
const codeChallenge = base64url(sha256(codeVerifier));

// Send code_challenge in authorization request
// Send code_verifier in token exchange request`}
                id="pkce-example"
              />
            </div>
          </section>

          {/* Endpoints Section */}
          <section id="endpoints" className="mb-6 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <FileCode className="w-6 h-6 text-emerald-500" />
              {t('oauthDocs.endpoints.title')}
            </h2>
          </section>

          {/* Authorize Endpoint */}
          <section id="endpoint-authorize" className="mb-6 scroll-mt-6 ml-8 pl-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('oauthDocs.endpoints.authorize')}
            </h3>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  GET
                </span>
                <code className="text-sm font-mono text-gray-700 dark:text-gray-300">{API_URL}/oauth/authorize</code>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{t('oauthDocs.endpoints.authorizeDesc')}</p>

              <h4 className="font-medium text-gray-900 dark:text-white mt-4">{t('oauthDocs.endpoints.parameters')}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">{t('oauthDocs.endpoints.param')}</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">{t('oauthDocs.endpoints.required')}</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">{t('oauthDocs.endpoints.description')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-4 py-3"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">client_id</code></td>
                      <td className="px-4 py-3"><span className="text-emerald-600">{t('common.yes')}</span></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t('oauthDocs.endpoints.clientIdDesc')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">redirect_uri</code></td>
                      <td className="px-4 py-3"><span className="text-emerald-600">{t('common.yes')}</span></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t('oauthDocs.endpoints.redirectUriDesc')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">scope</code></td>
                      <td className="px-4 py-3"><span className="text-emerald-600">{t('common.yes')}</span></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t('oauthDocs.endpoints.scopeDesc')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">state</code></td>
                      <td className="px-4 py-3"><span className="text-emerald-600">{t('common.yes')}</span></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t('oauthDocs.endpoints.stateDesc')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">code_challenge</code></td>
                      <td className="px-4 py-3"><span className="text-emerald-600">{t('common.yes')}</span></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t('oauthDocs.endpoints.codeChallengeDesc')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">code_challenge_method</code></td>
                      <td className="px-4 py-3"><span className="text-emerald-600">{t('common.yes')}</span></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t('oauthDocs.endpoints.codeChallengeMethodDesc')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">response_type</code></td>
                      <td className="px-4 py-3"><span className="text-emerald-600">{t('common.yes')}</span></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t('oauthDocs.endpoints.responseTypeDesc')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Token Endpoint */}
          <section id="endpoint-token" className="mb-6 scroll-mt-6 ml-8 pl-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('oauthDocs.endpoints.token')}
            </h3>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  POST
                </span>
                <code className="text-sm font-mono text-gray-700 dark:text-gray-300">{API_URL}/oauth/token</code>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{t('oauthDocs.endpoints.tokenDesc')}</p>

              <h4 className="font-medium text-gray-900 dark:text-white mt-4">{t('oauthDocs.endpoints.requestBody')}</h4>
              <CodeBlock
                code={`{
  "grant_type": "authorization_code",
  "client_id": "your-client-id",
  "code": "authorization-code-from-callback",
  "redirect_uri": "https://yoursite.az/auth/wallet/callback",
  "code_verifier": "your-original-code-verifier"
}`}
                id="token-request"
              />

              <h4 className="font-medium text-gray-900 dark:text-white mt-4">{t('oauthDocs.endpoints.response')}</h4>
              <CodeBlock
                code={`{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "def502003a8e8f1234...",
  "token_type": "Bearer",
  "expires_in": 2592000
}`}
                id="token-response"
              />
            </div>
          </section>

          {/* User Endpoint */}
          <section id="endpoint-user" className="mb-12 scroll-mt-6 ml-8 pl-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('oauthDocs.endpoints.user')}
            </h3>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  GET
                </span>
                <code className="text-sm font-mono text-gray-700 dark:text-gray-300">{API_URL}/oauth/user</code>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{t('oauthDocs.endpoints.userDesc')}</p>

              <h4 className="font-medium text-gray-900 dark:text-white mt-4">{t('oauthDocs.endpoints.headers')}</h4>
              <CodeBlock
                code={`Authorization: Bearer {access_token}`}
                id="user-header"
              />

              <h4 className="font-medium text-gray-900 dark:text-white mt-4">{t('oauthDocs.endpoints.response')}</h4>
              <CodeBlock
                code={`{
  "status": "success",
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+994501234567",
    "avatar": "https://wallet.az/avatars/123.jpg",
    "email_verified": true,
    "phone_verified": true,
    "verification_level": "verified",
    "balance": "150.00",
    "currency": "AZN"
  }
}`}
                id="user-response"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('oauthDocs.endpoints.userNote')}
              </p>
            </div>
          </section>

          {/* Scopes Section */}
          <section id="scopes" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Layers className="w-6 h-6 text-emerald-500" />
              {t('oauthDocs.scopes.title')}
            </h2>
            <div className="rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      {t('oauthDocs.scopes.scope')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      {t('oauthDocs.scopes.description')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      {t('oauthDocs.scopes.data')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">profile:read</code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {t('oauth.scopes.profile:read')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      name, email, phone, avatar
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">verification:read</code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {t('oauth.scopes.verification:read')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      email_verified, phone_verified, verification_level
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">wallet:read</code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {t('oauth.scopes.wallet:read')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      balance, currency, wallet_status
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">transactions:read</code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {t('oauth.scopes.transactions:read')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      transactions[]
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">wallet:write</code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {t('oauth.scopes.wallet:write')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      charge(), refund()
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Code Examples */}
          <section id="code-examples" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Code className="w-6 h-6 text-emerald-500" />
              {t('oauthDocs.codeExamples.title')}
            </h2>
            <div className="rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                {(['javascript', 'react', 'php', 'python'] as CodeTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`cursor-pointer px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-500'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {t(`oauthDocs.codeExamples.${tab}`)}
                  </button>
                ))}
              </div>
              {/* Code */}
              <div className="p-4">
                <CodeBlock code={codeExamples[activeTab]} id={`code-${activeTab}`} />
              </div>
            </div>
          </section>

          {/* Error Codes Section */}
          <section id="error-codes" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-emerald-500" />
              {t('oauthDocs.errorCodes.title')}
            </h2>
            <div className="rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      {t('oauthDocs.errorCodes.error')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      {t('oauthDocs.errorCodes.code')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      {t('oauthDocs.errorCodes.description')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {[
                    { error: 'invalid_client', code: '400', key: 'invalidClient' },
                    { error: 'invalid_redirect_uri', code: '400', key: 'invalidRedirectUri' },
                    { error: 'invalid_scope', code: '400', key: 'invalidScope' },
                    { error: 'invalid_code', code: '400', key: 'invalidCode' },
                    { error: 'invalid_code_verifier', code: '400', key: 'invalidCodeVerifier' },
                    { error: 'code_expired', code: '400', key: 'codeExpired' },
                    { error: 'access_denied', code: '403', key: 'accessDenied' },
                    { error: 'token_expired', code: '401', key: 'tokenExpired' },
                    { error: 'insufficient_scope', code: '403', key: 'insufficientScope' },
                  ].map((item) => (
                    <tr key={item.error}>
                      <td className="px-6 py-4">
                        <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">{item.error}</code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          item.code === '400'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : item.code === '401'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {item.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {t(`oauthDocs.errorCodes.${item.key}`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Support Section */}
          <section className="mb-12">
            <div className="rounded-2xl p-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <h2 className="text-xl font-bold mb-2">{t('oauthDocs.support.title')}</h2>
              <p className="opacity-90 mb-4">{t('oauthDocs.support.description')}</p>
              <a
                href="mailto:developer@wallet.az"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
              >
                {t('oauthDocs.support.contact')}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
