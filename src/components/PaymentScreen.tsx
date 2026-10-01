import React, { useState, useEffect } from 'react';
import { ArcadeSession } from '../types/arcade';
import { generateDogeQRCode } from '../utils/qr';
import { arcadeAudio } from '../utils/audio';
import { Copy, Check, QrCode, Zap, ExternalLink, ShieldCheck, Clock, RefreshCw } from 'lucide-react';

interface PaymentScreenProps {
  session: ArcadeSession;
  onSimulatePayment: () => void;
  onCancel: () => void;
  isSimulating: boolean;
  nodeConnected: boolean;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  session,
  onSimulatePayment,
  onCancel,
  isSimulating,
  nodeConnected,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins

  useEffect(() => {
    generateDogeQRCode(session.address, session.amountRequired).then(setQrCodeUrl);
  }, [session.address, session.amountRequired]);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [session.expiresAt]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(session.address);
    setCopied(true);
    arcadeAudio.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 bg-[#0a0d14] text-zinc-100 overflow-y-auto">
      {/* Arcade Payment Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-[#f6a821] text-xs font-arcade mb-2">
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          INSERT 25 DOGE TO PLAY
        </div>
        <h2 className="text-xl sm:text-2xl font-arcade text-white tracking-wide drop-shadow">
          PAY {session.amountRequired} DOGE
        </h2>
        <p className="text-xs text-zinc-400 font-retro mt-1">
          Scan QR with your Dogecoin wallet or copy the address below.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-2xl w-full bg-[#121622]/90 border border-amber-500/20 rounded-xl p-5 shadow-2xl backdrop-blur-sm">
        {/* QR Code with Dogecoin Mascot Badge */}
        <div className="relative flex flex-col items-center">
          <div className="p-3 bg-white rounded-xl shadow-lg border-4 border-amber-400 flex items-center justify-center">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="Dogecoin Payment QR"
                className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-zinc-100 text-zinc-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            )}
          </div>
          <span className="mt-2 text-[11px] font-retro text-amber-300/80">
            DOGECOIN URI READY
          </span>
        </div>

        {/* Address and Details */}
        <div className="flex-1 flex flex-col justify-center w-full">
          {/* Node RPC State Tag */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                nodeConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500'
              }`}
            />
            <span className="text-xs font-retro text-zinc-300">
              {nodeConnected
                ? 'Dogecoin Core v1.14.9: Listening for TX'
                : 'Demo / LAN Standby Mode'}
            </span>
          </div>

          {/* Amount Due */}
          <div className="bg-black/60 border border-zinc-800 rounded p-3 mb-3">
            <div className="text-[10px] font-arcade text-zinc-400 mb-1">PAYMENT EXACT AMOUNT</div>
            <div className="text-xl font-arcade text-[#f6a821] flex items-center gap-2">
              <span>{session.amountRequired}.00000000</span>
              <span className="text-sm font-retro text-zinc-400">DOGE</span>
            </div>
          </div>

          {/* Receiving Address */}
          <div className="mb-4">
            <div className="text-[10px] font-arcade text-zinc-400 mb-1">RESERVED RECEIVING ADDRESS</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={session.address}
                className="w-full bg-black/80 border border-zinc-700 rounded px-3 py-2 text-xs font-mono text-zinc-200 select-all focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={copyToClipboard}
                title="Copy Address"
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded border border-zinc-700 text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Countdown & Live Polling Status */}
          <div className="flex items-center justify-between text-xs font-retro text-zinc-400 mb-4 px-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Expires in {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Auto-verifying (2s)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Instant Test Deposit for rapid bench testing */}
            <button
              onClick={() => {
                arcadeAudio.playCoinInsert();
                onSimulatePayment();
              }}
              disabled={isSimulating}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-arcade text-xs rounded transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>SIMULATE 25 Ð DEPOSIT</span>
            </button>

            <button
              onClick={() => {
                arcadeAudio.playClick();
                onCancel();
              }}
              className="w-full sm:w-auto py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-arcade text-xs rounded transition-colors"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-[11px] font-retro text-zinc-400 text-center max-w-lg">
        Once 25 DOGE is detected by your Dogecoin Core node (via <code className="text-amber-400">getreceivedbyaddress</code>), this screen will blossom open and immediately load a random SWF game!
      </div>
    </div>
  );
};
