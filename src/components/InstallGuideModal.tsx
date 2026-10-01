import React, { useState } from 'react';
import { arcadeAudio } from '../utils/audio';
import { X, Download, Terminal, Check, Copy, HardDrive, Cpu, ShieldCheck, Gamepad2, ArrowRight } from 'lucide-react';

interface InstallGuideModalProps {
  onClose: () => void;
  priceDoge: number;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ onClose, priceDoge }) => {
  const [downloading, setDownloading] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleDownloadZip = () => {
    arcadeAudio.playCreditFanfare();
    setDownloading(true);
    // Trigger download from backend API
    const link = document.createElement('a');
    link.href = '/api/arcade/download-zip';
    link.download = 'doge-arcade-cabinet-v1.14.9.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 2000);
  };

  const copyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    arcadeAudio.playClick();
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-[#12151f] border-2 border-[#3a3f55] rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-[#181c2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#f6a821]">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-arcade text-white">
                INSTALLATION & NETWORK DEPLOYMENT GUIDE
              </h2>
              <p className="text-xs text-zinc-400 font-retro">
                Full step-by-step instructions for running DogeArcade with Dogecoin Core 1.14.9
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
          {/* Prominent ZIP Download Card */}
          <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border-2 border-amber-400/60 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2 font-arcade text-sm text-white mb-1">
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>DOGE-ARCADE-CABINET-V1.14.9.ZIP</span>
              </div>
              <p className="text-xs text-zinc-300 font-retro max-w-md">
                Contains preconfigured <code className="text-amber-400">dogecoin.conf</code>, 1-click Linux and Windows launch scripts, SWF game loader, and full arcade server!
              </p>
            </div>

            <button
              onClick={handleDownloadZip}
              disabled={downloading}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-arcade text-xs rounded-lg transition-transform active:scale-95 shadow-xl flex items-center gap-2 shrink-0 font-bold"
            >
              <Download className="w-4 h-4 fill-black" />
              <span>{downloading ? 'DOWNLOADING...' : 'DOWNLOAD .ZIP PACKAGE'}</span>
            </button>
          </div>

          {/* CRITICAL CALLOUT: THE SWF BIN DIRECTORY */}
          <div className="bg-[#181d2e] border-2 border-amber-400/80 rounded-xl p-5 space-y-2 shadow-lg">
            <div className="flex items-center gap-2 text-white font-arcade text-xs">
              <Gamepad2 className="w-4 h-4 text-amber-400" />
              <span>THE SWF BIN LOCATION: WHERE TO FILL YOUR .SWF GAMES</span>
            </div>
            <div className="text-xs text-zinc-300 font-retro leading-relaxed">
              Inside your unzipped <code className="text-amber-300">doge-arcade</code> folder, the bin to fill all your .SWF games is:
            </div>
            <div className="p-3 bg-black/80 rounded-lg border border-amber-500/50 flex items-center justify-between font-mono text-xs text-amber-300">
              <span>doge-arcade/public/games/</span>
              <button
                onClick={() => copyCode('binpath', 'doge-arcade/public/games/')}
                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-retro flex items-center gap-1"
              >
                {copiedSection === 'binpath' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedSection === 'binpath' ? 'Copied' : 'Copy Path'}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 font-retro">
              • Drop all your 20 .swf files into this bin!
              <br />
              • <strong className="text-white">When you get more .swf games later</strong>, simply drop them into <code className="text-amber-300">public/games/</code>. The arcade dynamically detects them instantly!
            </p>
          </div>

          {/* Step 1: Dogecoin Core 1.14.9 Config */}
          <div className="bg-[#151926] border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-arcade text-xs text-amber-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-300">1</span>
                CONFIGURE DOGECOIN CORE 1.14.9
              </h3>
              <button
                onClick={() => copyCode('step1', `server=1\nrpcuser=elshaddai\nrpcpassword=DAaB6QuYcEmuGmYENZRD4vdM9BFKt1zz8x\nrpcport=22555\nrpcallowip=127.0.0.1\nrpcallowip=192.168.*.*\ndisablewallet=0\ntxindex=1`)}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-retro flex items-center gap-1"
              >
                {copiedSection === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'step1' ? 'Copied' : 'Copy dogecoin.conf'}
              </button>
            </div>

            <p className="text-xs text-zinc-300 font-retro leading-relaxed">
              Place the pre-configured <code className="text-amber-300">dogecoin.conf</code> in your Dogecoin data directory:
              <br />
              • <strong className="text-white">Linux:</strong> <code className="text-amber-300">~/.dogecoin/dogecoin.conf</code>
              <br />
              • <strong className="text-white">Windows:</strong> <code className="text-amber-300">%APPDATA%\Dogecoin\dogecoin.conf</code>
            </p>

            <pre className="bg-black/80 border border-zinc-800 p-3 rounded text-[11px] font-mono text-zinc-300 overflow-x-auto">
{`server=1
rpcuser=elshaddai
rpcpassword=DAaB6QuYcEmuGmYENZRD4vdM9BFKt1zz8x
rpcport=22555
rpcallowip=127.0.0.1
rpcallowip=192.168.*.*
disablewallet=0
txindex=1`}
            </pre>

            <p className="text-xs text-zinc-400 font-retro">
              Start your node with: <code className="text-amber-400">dogecoind -daemon</code> or open Dogecoin-Qt with <code className="text-amber-400">-server</code>.
            </p>
          </div>

          {/* Step 2: Unzip and Install Arcade */}
          <div className="bg-[#151926] border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-arcade text-xs text-amber-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-300">2</span>
                UNZIP & RUN ARCADE CABINET
              </h3>
              <button
                onClick={() => copyCode('step2', `unzip doge-arcade-cabinet-v1.14.9.zip -d doge-arcade\ncd doge-arcade\nnpm install\nnpm run build\nnpm start`)}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-retro flex items-center gap-1"
              >
                {copiedSection === 'step2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'step2' ? 'Copied' : 'Copy Commands'}
              </button>
            </div>

            <pre className="bg-black/80 border border-zinc-800 p-3 rounded text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`# 1. Unzip archive:
unzip doge-arcade-cabinet-v1.14.9.zip -d doge-arcade
cd doge-arcade

# 2. Install dependencies:
npm install

# 3. Build & start arcade server:
npm run build
npm start`}
            </pre>

            <p className="text-xs text-zinc-400 font-retro">
              For Windows arcade machines, simply double-click <code className="text-amber-400">start-arcade.bat</code> included in the ZIP!
            </p>
          </div>

          {/* Step 3: Loading 20 .SWF Files */}
          <div className="bg-[#151926] border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3">
            <h3 className="font-arcade text-xs text-amber-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-300">3</span>
              LOAD YOUR 20 .SWF FLASH FILES
            </h3>

            <p className="text-xs text-zinc-300 font-retro leading-relaxed">
              Drop all 20 of your <code className="text-amber-300">.swf</code> files directly into the <code className="text-white">public/games/</code> folder.
              <br />
              Or simply drag-and-drop them right onto the arcade screen in your browser!
              <br />
              The arcade's Ruffle engine executes ActionScript 1/2/3 natively inside WebAssembly.
            </p>
          </div>

          {/* Step 4: Kiosk Fullscreen Arcade Mode */}
          <div className="bg-[#151926] border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3">
            <h3 className="font-arcade text-xs text-amber-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-300">4</span>
              LOCK CABINET INTO FULLSCREEN KIOSK MODE
            </h3>

            <p className="text-xs text-zinc-300 font-retro">
              To launch automatically on cabinet startup without browser bars or URL inputs:
            </p>

            <pre className="bg-black/80 border border-zinc-800 p-3 rounded text-[11px] font-mono text-zinc-300 overflow-x-auto">
{`# Linux / Raspberry Pi:
google-chrome --kiosk --incognito --app=http://localhost:3000

# Windows:
start msedge --kiosk http://localhost:3000 --edge-kiosk-type=fullscreen`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#0e1017] flex items-center justify-between text-xs font-retro text-zinc-400">
          <span>Much Doge · Very 25 Ð · Wow Arcade</span>
          <button
            onClick={() => {
              arcadeAudio.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-arcade text-[10px]"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
