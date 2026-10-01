import React, { useState } from 'react';
import { DogeCoreConfig, NodeStatus } from '../types/arcade';
import { arcadeAudio } from '../utils/audio';
import { X, Server, Check, Copy, RefreshCw, AlertTriangle, ShieldCheck, Database } from 'lucide-react';

interface NodeSettingsModalProps {
  config: DogeCoreConfig;
  status: NodeStatus | null;
  onSaveConfig: (newConfig: Partial<DogeCoreConfig>) => Promise<void>;
  onCheckStatus: () => Promise<void>;
  onClose: () => void;
}

export const NodeSettingsModal: React.FC<NodeSettingsModalProps> = ({
  config,
  status,
  onSaveConfig,
  onCheckStatus,
  onClose,
}) => {
  const [formData, setFormData] = useState<DogeCoreConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedConf, setCopiedConf] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    arcadeAudio.playClick();
    await onSaveConfig(formData);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    arcadeAudio.playClick();
    await onCheckStatus();
    setIsTesting(false);
  };

  const dogecoinConfSnippet = `# ~/.dogecoin/dogecoin.conf (or %APPDATA%\\Dogecoin\\dogecoin.conf)
server=1
rpcuser=${formData.user}
rpcpassword=${formData.password || 'your_secure_password'}
rpcport=${formData.port}
rpcallowip=127.0.0.1
rpcallowip=192.168.*.*
rpcallowip=10.*.*.*
disablewallet=0
txindex=1
# Optional: testnet=1
`;

  const copyConf = () => {
    navigator.clipboard.writeText(dogecoinConfSnippet);
    setCopiedConf(true);
    arcadeAudio.playClick();
    setTimeout(() => setCopiedConf(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-[#12151f] border-2 border-[#3a3f55] rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-[#181c2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#f6a821]">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-arcade text-white">
                DOGECOIN CORE 1.14.9 RPC SETTINGS
              </h2>
              <p className="text-xs text-zinc-400 font-retro">
                Configure connection to your Dogecoin Core node or LAN arcade server
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              arcadeAudio.playClick();
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Node Connection Status Card */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              status?.connected
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full animate-pulse ${
                  status?.connected ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-amber-400'
                }`}
              />
              <div>
                <div className="font-arcade text-xs text-white">
                  STATUS:{' '}
                  {status?.connected
                    ? 'CONNECTED TO DOGECOIN CORE v1.14.9'
                    : 'NODE OFFLINE / STANDBY MODE'}
                </div>
                <div className="text-xs font-retro mt-0.5 text-zinc-400">
                  {status?.connected
                    ? `Blocks: ${status.blocks} · Peers: ${status.connections} · Balance: ${status.balance} DOGE`
                    : status?.error || 'Make sure dogecoind or dogecoin-qt is running with server=1'}
                </div>
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-arcade text-[10px] rounded-lg transition-colors flex items-center gap-2 shrink-0 border border-zinc-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              TEST RPC NOW
            </button>
          </div>

          {/* RPC Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-arcade text-zinc-300 mb-1.5">
                  RPC HOST IP
                </label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="127.0.0.1 or LAN IP"
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-arcade text-zinc-300 mb-1.5">
                  RPC PORT
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value, 10) })}
                  placeholder="22555"
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
                <span className="text-[10px] font-retro text-zinc-500">22555 (Mainnet), 44555 (Testnet)</span>
              </div>

              <div>
                <label className="block text-[11px] font-arcade text-zinc-300 mb-1.5">
                  RPC USERNAME
                </label>
                <input
                  type="text"
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  placeholder="dogeuser"
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-arcade text-zinc-300 mb-1.5">
                  RPC PASSWORD
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="dogepassword"
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-arcade text-zinc-300 mb-1.5">
                  PRICE PER GAME (DOGE)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.priceDoge}
                  onChange={(e) => setFormData({ ...formData, priceDoge: parseFloat(e.target.value) })}
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-arcade text-zinc-300 mb-1.5">
                  CONFIRMATIONS
                </label>
                <select
                  value={formData.minConfirmations}
                  onChange={(e) => setFormData({ ...formData, minConfirmations: parseInt(e.target.value, 10) })}
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={0}>0-Conf (Instant Arcade Play - Recommended!)</option>
                  <option value={1}>1-Conf (Wait ~1 minute block)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {saveSuccess ? (
                <span className="text-emerald-400 font-retro text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Settings saved successfully!
                </span>
              ) : <span />}

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-[#f6a821] hover:bg-[#e59510] text-black font-arcade text-xs rounded-lg transition-transform active:scale-95 shadow"
              >
                SAVE RPC CONFIG
              </button>
            </div>
          </form>

          {/* dogecoin.conf Helper Box */}
          <div className="bg-[#0b0d14] border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-arcade text-xs text-amber-400">YOUR DOGECOIN.CONF TEMPLATE</span>
              <button
                onClick={copyConf}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-retro flex items-center gap-1 transition-colors"
              >
                {copiedConf ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedConf ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="text-[11px] font-mono text-zinc-300 bg-black/80 p-3 rounded overflow-x-auto border border-zinc-800/80">
              {dogecoinConfSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
