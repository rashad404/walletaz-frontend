'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import {
  ArrowLeft,
  Copy,
  Check,
  CreditCard,
  Code,
  AlertCircle,
  Zap,
  ChevronRight,
  Shield,
  Wallet,
  FileCode,
  Layers,
  ArrowRight,
  Webhook,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

type CodeTab = 'javascript' | 'php' | 'curl';

interface SidebarItem {
  id: string;
  labelKey: string;
  icon?: React.ComponentType<{ className?: string }>;
  level: 'main' | 'sub';
}

export default function PaymentsDocsPage() {
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
    }
  };

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', labelKey: 'paymentsDocs.overview.title', icon: Zap, level: 'main' },
    { id: 'how-it-works', labelKey: 'paymentsDocs.howItWorks.title', icon: ArrowRight, level: 'main' },
    { id: 'create-charge', labelKey: 'paymentsDocs.createCharge.title', icon: CreditCard, level: 'main' },
    { id: 'approval-flow', labelKey: 'paymentsDocs.approvalFlow.title', icon: CheckCircle, level: 'main' },
    { id: 'webhooks', labelKey: 'paymentsDocs.webhooks.title', icon: Webhook, level: 'main' },
    { id: 'auto-approve', labelKey: 'paymentsDocs.autoApprove.title', icon: Shield, level: 'main' },
    { id: 'error-handling', labelKey: 'paymentsDocs.errorHandling.title', icon: AlertCircle, level: 'main' },
  ];

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kimlik.az';

  const chargeExample = {
    javascript: `// Create a charge request
const response = await fetch('${API_URL}/oauth/charge', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${accessToken}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 10.00,
    description: 'Top up balance',
    reference_id: 'order_123'  // Your internal reference
  })
});

const data = await response.json();

if (data.data.status === 'pending_approval') {
  // User needs to approve - open popup
  const popup = window.open(
    data.data.approval_url,
    'wallet_charge',
    'width=500,height=600'
  );

  // Listen for approval result
  window.addEventListener('message', (event) => {
    if (event.data.type === 'charge_approved') {
      console.log('Charge approved:', event.data.charge_id);
      // Refresh user balance or handle success
    } else if (event.data.type === 'charge_rejected') {
      console.log('Charge rejected');
    }
  });
} else if (data.data.status === 'approved') {
  // Auto-approved (user has set auto-approve limit)
  console.log('Charge auto-approved');
}`,
    php: `<?php
// Create a charge request
$response = Http::withToken($user->wallet_access_token)
    ->post(config('services.wallet.api_url') . '/oauth/charge', [
        'amount' => 10.00,
        'description' => 'Top up balance',
        'reference_id' => 'order_' . $order->id
    ]);

$data = $response->json();

if ($data['data']['status'] === 'pending_approval') {
    // Return approval URL to frontend
    return response()->json([
        'status' => 'pending_approval',
        'approval_url' => $data['data']['approval_url']
    ]);
} elseif ($data['data']['status'] === 'approved') {
    // Auto-approved - add balance immediately
    $user->addBalance($data['data']['amount']);
    return response()->json(['status' => 'success']);
}`,
    curl: `# Create a charge
curl -X POST ${API_URL}/oauth/charge \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10.00,
    "description": "Top up balance",
    "reference_id": "order_123"
  }'

# Response (pending approval):
{
  "status": "success",
  "data": {
    "status": "pending_approval",
    "charge_id": "ch_abc123xyz",
    "approval_url": "${API_URL.replace('/api', '')}/oauth/approve/ch_abc123xyz",
    "expires_at": "2024-01-01T12:00:00Z"
  }
}

# Response (auto-approved):
{
  "status": "success",
  "data": {
    "status": "approved",
    "charge_id": "ch_abc123xyz",
    "message": "Charge approved automatically"
  }
}`
  };

  const webhookExample = `// Webhook handler (your backend)
app.post('/webhooks/wallet', (req, res) => {
  const signature = req.headers['x-wallet-signature'];
  const payload = JSON.stringify(req.body);

  // Verify signature
  const expectedSig = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, charge_id, amount, user_id } = req.body;

  switch (event) {
    case 'charge.completed':
      // Payment successful - add balance to user
      await User.where('wallet_id', user_id).increment('balance', amount);
      break;

    case 'charge.rejected':
      // User rejected the charge
      console.log('Charge rejected:', charge_id);
      break;
  }

  res.json({ status: 'ok' });
});`;

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl sticky top-0 h-screen overflow-y-auto">
          <div className="p-6">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </Link>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('paymentsDocs.title')}
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
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
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
            href="/docs"
            className="lg:hidden inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Link>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {t('paymentsDocs.title')}
                  </span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('paymentsDocs.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Overview Section */}
          <section id="overview" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-blue-500" />
              {t('paymentsDocs.overview.title')}
            </h2>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 space-y-4">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('paymentsDocs.overview.description')}
              </p>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                  {t('paymentsDocs.overview.scopeRequired')}
                </p>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <ArrowRight className="w-6 h-6 text-blue-500" />
              {t('paymentsDocs.howItWorks.title')}
            </h2>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
              {/* Flow Diagram */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-semibold shrink-0 mt-0.5">1</div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{t('paymentsDocs.howItWorks.step1Title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('paymentsDocs.howItWorks.step1Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-semibold shrink-0 mt-0.5">2</div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{t('paymentsDocs.howItWorks.step2Title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('paymentsDocs.howItWorks.step2Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-semibold shrink-0 mt-0.5">3</div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{t('paymentsDocs.howItWorks.step3Title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('paymentsDocs.howItWorks.step3Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-semibold shrink-0 mt-0.5">4</div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{t('paymentsDocs.howItWorks.step4Title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('paymentsDocs.howItWorks.step4Desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Create Charge Section */}
          <section id="create-charge" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-500" />
              {t('paymentsDocs.createCharge.title')}
            </h2>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  POST
                </span>
                <code className="text-sm font-mono text-gray-700 dark:text-gray-300">{API_URL}/oauth/charge</code>
              </div>

              <h4 className="font-medium text-gray-900 dark:text-white">{t('paymentsDocs.createCharge.requestBody')}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">{t('paymentsDocs.createCharge.field')}</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">{t('paymentsDocs.createCharge.type')}</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">{t('paymentsDocs.createCharge.description')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-4 py-3"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">amount</code></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">number</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t('paymentsDocs.createCharge.amountDesc')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">description</code></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">string</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t('paymentsDocs.createCharge.descriptionDesc')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">reference_id</code></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">string?</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t('paymentsDocs.createCharge.referenceDesc')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Code Tabs */}
              <div className="mt-6 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  {(['javascript', 'php', 'curl'] as CodeTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`cursor-pointer px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-900/50'
                      }`}
                    >
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="p-4 bg-white dark:bg-gray-900">
                  <CodeBlock code={chargeExample[activeTab]} id={`charge-${activeTab}`} />
                </div>
              </div>
            </div>
          </section>

          {/* Approval Flow Section */}
          <section id="approval-flow" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-blue-500" />
              {t('paymentsDocs.approvalFlow.title')}
            </h2>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                {t('paymentsDocs.approvalFlow.description')}
              </p>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="font-medium text-emerald-800 dark:text-emerald-300">charge_approved</h4>
                  </div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    {t('paymentsDocs.approvalFlow.approvedDesc')}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <h4 className="font-medium text-red-800 dark:text-red-300">charge_rejected</h4>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {t('paymentsDocs.approvalFlow.rejectedDesc')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Webhooks Section */}
          <section id="webhooks" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Webhook className="w-6 h-6 text-blue-500" />
              {t('paymentsDocs.webhooks.title')}
            </h2>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                {t('paymentsDocs.webhooks.description')}
              </p>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {t('paymentsDocs.webhooks.signatureNote')}
                </p>
              </div>

              <h4 className="font-medium text-gray-900 dark:text-white mt-4">{t('paymentsDocs.webhooks.payload')}</h4>
              <CodeBlock
                code={`{
  "event": "charge.completed",
  "charge_id": "ch_abc123xyz",
  "amount": 10.00,
  "currency": "AZN",
  "status": "completed",
  "reference_id": "order_123",
  "user_id": 456,
  "timestamp": "2024-01-01T12:00:00Z"
}`}
                id="webhook-payload"
              />

              <h4 className="font-medium text-gray-900 dark:text-white mt-4">{t('paymentsDocs.webhooks.events')}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">{t('paymentsDocs.webhooks.event')}</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">{t('paymentsDocs.webhooks.description')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-4 py-3"><code className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">charge.completed</code></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t('paymentsDocs.webhooks.completedDesc')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">charge.rejected</code></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t('paymentsDocs.webhooks.rejectedDesc')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4 className="font-medium text-gray-900 dark:text-white mt-4">{t('paymentsDocs.webhooks.example')}</h4>
              <CodeBlock code={webhookExample} id="webhook-example" />
            </div>
          </section>

          {/* Auto-approve Section */}
          <section id="auto-approve" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-500" />
              {t('paymentsDocs.autoApprove.title')}
            </h2>
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                {t('paymentsDocs.autoApprove.description')}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {t('paymentsDocs.autoApprove.howItWorks')}
              </p>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {t('paymentsDocs.autoApprove.example')}
                </p>
              </div>
            </div>
          </section>

          {/* Error Handling Section */}
          <section id="error-handling" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-blue-500" />
              {t('paymentsDocs.errorHandling.title')}
            </h2>
            <div className="rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">{t('paymentsDocs.errorHandling.error')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">{t('paymentsDocs.errorHandling.code')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">{t('paymentsDocs.errorHandling.description')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="px-6 py-4"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">insufficient_balance</code></td>
                    <td className="px-6 py-4"><span className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">400</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{t('paymentsDocs.errorHandling.insufficientBalance')}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">charge_expired</code></td>
                    <td className="px-6 py-4"><span className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">400</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{t('paymentsDocs.errorHandling.chargeExpired')}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">invalid_scope</code></td>
                    <td className="px-6 py-4"><span className="px-2 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">403</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{t('paymentsDocs.errorHandling.invalidScope')}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4"><code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">token_expired</code></td>
                    <td className="px-6 py-4"><span className="px-2 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">401</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{t('paymentsDocs.errorHandling.tokenExpired')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Support Section */}
          <section className="mb-12">
            <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <h2 className="text-xl font-bold mb-2">{t('paymentsDocs.support.title')}</h2>
              <p className="opacity-90 mb-4">{t('paymentsDocs.support.description')}</p>
              <a
                href="mailto:developer@kimlik.az"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
              >
                {t('paymentsDocs.support.contact')}
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
