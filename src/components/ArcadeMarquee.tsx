import React from 'react';
import { Volume2, VolumeX, Maximize, Settings, HardDrive, Gamepad2, Coins } from 'lucide-react';
import { arcadeAudio } from '../utils/audio';

interface ArcadeMarqueeProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
  onOpenGames: () => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onInsertCoin: () => void;
  nodeConnected: boolean;
  priceDoge: number;
}

export const ArcadeMarquee: React.FC<ArcadeMarqueeProps> = ({
  soundEnabled,
  onToggleSound,
  onToggleFullscreen,
  onOpenGames,
  onOpenSettings,
  onOpenGuide,
  onInsertCoin,
  nodeConnected,
  priceDoge,
}) => {
  return (
    <header className="w-full bg-[#0a0c12] border-b border-[#232738] relative z-40 select-none">
      {/* Zone 1, 2, 3 Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <span className="font-arcade text-sm sm:text-base tracking-wider text-[#f6a821] drop-shadow-[0_0_8px_rgba(246,168,33,0.5)]">
            DOGEARCADE
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-retro text-zinc-400">
            <span
              className={`w-2 h-2 rounded-full ${
                nodeConnected ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-amber-400'
              }`}
            />
            <span>{nodeConnected ? 'RPC 1.14.9' : 'STANDBY'}</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-arcade text-zinc-400">
          <button
            onClick={() => {
              arcadeAudio.playClick();
              onOpenGames();
            }}
            className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            SWF LIBRARY
          </button>
          <button
            onClick={() => {
              arcadeAudio.playClick();
              onOpenSettings();
            }}
            className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            NODE RPC
          </button>
          <button
            onClick={() => {
              arcadeAudio.playClick();
              onOpenGuide();
            }}
            className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <HardDrive className="w-3.5 h-3.5" />
            LAN INSTALL & .ZIP
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick ZIP Download */}
          <button
            onClick={() => {
              arcadeAudio.playCreditFanfare();
              onOpenGuide();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-[#f6a821] border border-amber-500/30 rounded font-arcade text-[10px] transition-colors"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>GET .ZIP</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
            className="p-2 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-400 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            aria-label="Toggle Fullscreen"
            className="p-2 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-400 hover:text-white transition-colors"
          >
            <Maximize className="w-4 h-4" />
          </button>

          {/* Direct Insert Coin button */}
          <button
            onClick={onInsertCoin}
            className="px-3.5 py-1.5 bg-[#f6a821] hover:bg-[#e59510] text-black font-arcade text-[11px] rounded transition-transform active:scale-95 shadow flex items-center gap-1.5 whitespace-nowrap"
          >
            <Coins className="w-3.5 h-3.5 fill-black" />
            <span>PAY {priceDoge} Ð</span>
          </button>
        </div>
      </div>

      {/* Illuminated Arcade Marquee Header Banner */}
      <div className="w-full bg-gradient-to-r from-[#17130c] via-[#2a2010] to-[#17130c] border-y-2 border-amber-500/40 py-3 sm:py-4 px-4 shadow-[0_0_25px_rgba(246,168,33,0.25)] relative overflow-hidden">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f6a821_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left relative z-10">
          <div className="flex items-center gap-3">
            {/* Doge Golden Coin Emblem */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 via-amber-500 to-amber-700 border-2 border-yellow-200 shadow-[0_0_15px_rgba(246,168,33,0.8)] flex items-center justify-center shrink-0">
              <span className="font-arcade text-xl font-bold text-black drop-shadow">
                Ð
              </span>
            </div>

            <div>
              <div className="font-arcade text-xs text-amber-300/80 tracking-widest uppercase">
                DOGECOIN CORE 1.14.9 ARCADE
              </div>
              <h1 className="font-arcade text-base sm:text-lg text-white drop-shadow-[0_0_12px_rgba(246,168,33,0.9)] tracking-wide">
                25 DOGE TO PLAY · SWF FLASH MACHINE
              </h1>
            </div>
          </div>

          {/* Marquee Right Badge: SWF Bin Notice & Download */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={() => {
                arcadeAudio.playClick();
                onOpenGames();
              }}
              className="font-arcade text-[10px] text-amber-300 bg-black/70 hover:bg-black px-3 py-1.5 rounded border border-amber-500/40 shadow-inner flex items-center gap-1.5 transition-colors"
            >
              <span>SWF BIN:</span>
              <span className="text-white font-mono bg-zinc-800 px-1 rounded">public/games/</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
