import React, { useState, useEffect } from 'react';
import { CarparkService, ApiHealthInfo } from '../services/carparkService';
import {
  Server,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  RefreshCw,
  Activity,
  Key,
} from 'lucide-react';

interface BackendGuideModalProps {
  onRefreshData: () => void;
}

export const BackendGuideModal: React.FC<BackendGuideModalProps> = ({ onRefreshData }) => {
  const [backendUrl, setBackendUrlState] = useState<string>(CarparkService.getBackendUrl());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Serverless status from /api/health
  const [healthInfo, setHealthInfo] = useState<ApiHealthInfo | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const checkLocalHealth = async () => {
    setIsCheckingHealth(true);
    const info = await CarparkService.checkHealth();
    setHealthInfo(info);
    setIsCheckingHealth(false);
  };

  useEffect(() => {
    checkLocalHealth();
  }, []);

  const handleSaveAndTest = async () => {
    CarparkService.setBackendUrl(backendUrl.trim());
    if (!backendUrl.trim()) {
      setTestStatus('idle');
      setTestMessage('Reverted to built-in /api/carparkavailability serverless route.');
      onRefreshData();
      return;
    }

    setTestStatus('testing');
    setTestMessage('Sending ping request to ' + backendUrl.trim() + '...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(backendUrl.trim(), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        setTestStatus('success');
        setTestMessage('Connected successfully! Received HTTP ' + res.status);
        onRefreshData();
      } else {
        setTestStatus('failed');
        setTestMessage(`Server responded with HTTP ${res.status} ${res.statusText}`);
      }
    } catch (err: any) {
      setTestStatus('failed');
      setTestMessage(err.message || 'Connection refused or CORS not configured on backend.');
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sampleEnvCode = `# Add this to your .env or deployment environment:
LTA_DATAMALL_ACCOUNT_KEY="YOUR_LTA_DATAMALL_ACCOUNT_KEY"`;

  const sampleCurlCode = `# Test your serverless LTA DataMall route:
curl http://localhost:3000/api/carparkavailability

# Check health:
curl http://localhost:3000/api/health`;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Active Serverless Status Card */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Serverless LTA DataMall Connection
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live routes running at <code className="font-mono text-emerald-600 dark:text-emerald-400">/api/carparkavailability</code> & <code className="font-mono text-emerald-600 dark:text-emerald-400">/api/health</code>
              </p>
            </div>
          </div>

          <button
            onClick={checkLocalHealth}
            disabled={isCheckingHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            <span>Ping /api/health</span>
          </button>
        </div>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Serverless Endpoint</span>
            <div className="flex items-center gap-1.5 mt-1 font-mono text-xs font-semibold text-slate-900 dark:text-white">
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>/api/carparkavailability</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">LTA AccountKey Status</span>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              {healthInfo?.ltaAccountKeyConfigured ? (
                <span className="text-emerald-600 dark:text-emerald-400">Configured in Environment</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Ready for Key (Not Hardcoded)</span>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Target LTA Endpoint</span>
            <div className="mt-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate" title="https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2">
              CarParkAvailabilityv2
            </div>
          </div>
        </div>

        {/* Instructions to insert key */}
        <div className="mt-4 p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200">
          <div className="font-semibold flex items-center gap-1.5">
            <span>How to supply your LTA DataMall AccountKey:</span>
          </div>
          <p className="mt-1 text-amber-800 dark:text-amber-300">
            As requested, no keys are hardcoded. Whenever you are ready, add <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">LTA_DATAMALL_ACCOUNT_KEY="your_key"</code> to your <code className="font-mono">.env</code> file or host environment variables.
            The serverless endpoint will automatically include the <code className="font-mono">AccountKey</code> header in every outgoing request to LTA.
          </p>
        </div>
      </div>

      {/* Code Snippets & Curl Testing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Environment Variable Setup */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Environment Configuration (.env)</span>
            </h3>
            <button
              onClick={() => copyCode(sampleEnvCode, 'env')}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
            >
              {copiedCode === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'env' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
            {sampleEnvCode}
          </pre>
        </div>

        {/* Curl Testing Commands */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Test Endpoints Locally</span>
            </h3>
            <button
              onClick={() => copyCode(sampleCurlCode, 'curl')}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
            >
              {copiedCode === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'curl' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
            {sampleCurlCode}
          </pre>
        </div>
      </div>

      {/* Official Singapore Government API Documentation Links */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
          Official LTA DataMall Carpark Resource
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <a
            href="https://datamall.lta.gov.sg/content/datamall/en/dynamic-data.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-colors"
          >
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">LTA DataMall Dynamic Data</div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                CarParkAvailabilityv2 API documentation and field specifications.
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </a>

          <a
            href="https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-colors"
          >
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Request LTA DataMall AccountKey</div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Register for a free LTA DataMall developer account to receive your AccountKey.
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </a>
        </div>
      </div>
    </div>
  );
};
