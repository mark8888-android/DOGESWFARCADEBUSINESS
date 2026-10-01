import React, { useState, useEffect } from 'react';
import { SwfGame, ArcadeSession } from '../types/arcade';
import { RufflePlayer } from './RufflePlayer';
import { PaymentScreen } from './PaymentScreen';
import { arcadeAudio } from '../utils/audio';
import { Coins, Play, RefreshCw, Zap, FolderOpen, Gamepad2, ArrowLeft, Maximize2 } from 'lucide-react';

interface ArcadeScreenProps {
  session: ArcadeSession | null;
  activeGame: SwfGame | null;
  games: SwfGame[];
  onStartSession: () => void;
  onSimulatePayment: () => void;
  onCancelSession: () => void;
  onSelectGame: (game: SwfGame) => void;
  onUploadCustomSwf: (file: File) => void;
  isSimulating: boolean;
  nodeConnected: boolean;
  priceDoge: number;
}

export const ArcadeScreen: React.FC<ArcadeScreenProps> = ({
  session,
  activeGame,
  games,
  onStartSession,
  onSimulatePayment,
  onCancelSession,
  onSelectGame,
  onUploadCustomSwf,
  isSimulating,
  nodeConnected,
  priceDoge,
}) => {
  const [previewIndex, setPreviewIndex] = useState(0);

  // Cycle preview game titles in attract mode every 3 seconds
  useEffect(() => {
    if (!session && !activeGame) {
      const interval = setInterval(() => {
        setPreviewIndex((prev) => (prev + 1) % games.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [session, activeGame, games.length]);

  const previewGame = games[previewIndex] || games[0];

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 select-none">
      {/* Wooden / Molded Arcade Bezel Container */}
      <div className="w-full max-w-4xl bg-gradient-to-b from-[#1b1e2a] via-[#10131c] to-[#0c0e15] border-4 sm:border-8 border-[#2d3244] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.1)] relative">
        {/* Cabinet Marquee Decals & Screws */}
        <div className="flex items-center justify-between pb-3 px-2 border-b border-zinc-800/80 mb-3 text-[11px] font-retro text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600/80 shadow-[0_0_6px_#ef4444]" />
            <span className="font-arcade text-[9px] text-zinc-400">HI-RES CRT COLOR RASTER</span>
          </div>
          <div className="flex items-center gap-3">
            <span>20 SWF SLOTS READY</span>
            <span className="text-amber-400 font-arcade text-[9px]">DOGECOIN 1.14.9</span>
          </div>
        </div>

        {/* CRT Glass Monitor Container */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#07090e] rounded-xl border-4 border-[#07080c] shadow-[inset_0_0_40px_rgba(0,0,0,0.95)] overflow-hidden crt-container flex flex-col">
          {/* STATE 1: ACTIVE GAME IN PROGRESS */}
          {activeGame ? (
            <div className="w-full h-full flex flex-col relative z-10">
              {/* In-Game Header HUD */}
              <div className="h-9 bg-black/90 border-b border-zinc-800 px-3 flex items-center justify-between z-30 shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  <button
                    onClick={() => {
                      arcadeAudio.playClick();
                      onCancelSession();
                    }}
                    className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors flex items-center gap-1 text-[10px] font-retro"
                    title="Exit to Cabinet"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>EXIT</span>
                  </button>
                  <span className="text-zinc-600">|</span>
                  <span className="font-arcade text-xs text-amber-400 truncate">
                    {activeGame.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-retro">
                  <span className="text-zinc-400 hidden sm:inline">{activeGame.filename}</span>
                  <button
                    onClick={() => {
                      arcadeAudio.playCreditFanfare();
                      // Pick a random game from collection
                      const randomGame = games[Math.floor(Math.random() * games.length)];
                      onSelectGame(randomGame);
                    }}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-arcade text-[9px] rounded flex items-center gap-1 transition-transform active:scale-95"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>NEXT RANDOM SWF</span>
                  </button>
                </div>
              </div>

              {/* Ruffle / Canvas Display */}
              <div className="flex-1 w-full h-full relative overflow-hidden">
                <RufflePlayer
                  game={activeGame}
                  onUploadCustomSwf={onUploadCustomSwf}
                />
              </div>
            </div>
          ) : session ? (
            /* STATE 2: PAYMENT SESSION ACTIVE */
            <div className="w-full h-full relative z-10">
              <PaymentScreen
                session={session}
                onSimulatePayment={onSimulatePayment}
                onCancel={onCancelSession}
                isSimulating={isSimulating}
                nodeConnected={nodeConnected}
              />
            </div>
          ) : (
            /* STATE 3: ATTRACT MODE / IDLE SCREEN */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative z-10 bg-radial from-[#121626] via-[#090b12] to-[#040508]">
              {/* Retro Arcade Marquee Graphic */}
              <div className="mb-4">
                <div className="inline-block p-4 rounded-full bg-gradient-to-tr from-amber-500/20 to-yellow-400/10 border-2 border-amber-400/40 shadow-[0_0_30px_rgba(246,168,33,0.3)] mb-3">
                  <Coins className="w-12 h-12 text-[#f6a821] animate-bounce" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-arcade text-white tracking-widest drop-shadow-[0_0_15px_rgba(246,168,33,0.9)]">
                  DOGE ARCADE
                </h2>
                <div className="mt-1 font-arcade text-xs text-amber-400/90 tracking-wider">
                  POWERED BY DOGECOIN CORE 1.14.9
                </div>
              </div>

              {/* Flashing "INSERT 25 DOGE TO PLAY" */}
              <div className="my-3">
                <button
                  onClick={() => {
                    arcadeAudio.playCoinInsert();
                    onStartSession();
                  }}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#f6a821] hover:bg-[#e59510] text-black font-arcade text-xs sm:text-sm rounded-xl shadow-[0_0_25px_rgba(246,168,33,0.8)] transition-all transform hover:scale-105 active:scale-95 animate-arcade-blink font-bold flex items-center gap-3"
                >
                  <Coins className="w-5 h-5 fill-black" />
                  <span>INSERT {priceDoge} DOGE TO PLAY</span>
                </button>
              </div>

              {/* Attract Mode Preview Carousel */}
              <div className="mt-4 p-3 bg-black/60 border border-zinc-800 rounded-lg max-w-md w-full text-left">
                <div className="flex items-center justify-between text-[10px] font-arcade text-zinc-500 mb-1">
                  <span>SWF ROTATION PREVIEW</span>
                  <span className="text-amber-400 font-retro">
                    {previewIndex + 1} / {games.length}
                  </span>
                </div>
                <div className="font-arcade text-xs text-white truncate mb-1">
                  {previewGame.title}
                </div>
                <div className="text-[11px] text-zinc-400 font-retro truncate">
                  {previewGame.description}
                </div>
              </div>

              {/* Subtle instruction */}
              <div className="mt-4 text-[11px] font-retro text-zinc-500">
                Insert {priceDoge} DOGE to unlock the screen · Loads a random SWF Flash game via Ruffle
              </div>
            </div>
          )}
        </div>

        {/* Lower Arcade Bezel Speaker Grille */}
        <div className="mt-4 flex items-center justify-between px-4">
          {/* Left Speaker Grille */}
          <div className="flex gap-1.5 opacity-60">
            <div className="w-1.5 h-6 bg-zinc-800 rounded-full" />
            <div className="w-1.5 h-6 bg-zinc-800 rounded-full" />
            <div className="w-1.5 h-6 bg-zinc-800 rounded-full" />
            <div className="w-1.5 h-6 bg-zinc-800 rounded-full" />
          </div>

          {/* Center Mascot & Badge */}
          <div className="text-center font-arcade text-[10px] text-amber-500/70 tracking-widest">
            MUCH ARCADE · VERY 25 DOGE · WOW
          </div>

          {/* Right Speaker Grille */}
          <div className="flex gap-1.5 opacity-60">
            <div className="w-1.5 h-6 bg-zinc-800 rounded-full" />
            <div className="w-1.5 h-6 bg-zinc-800 rounded-full" />
            <div className="w-1.5 h-6 bg-zinc-800 rounded-full" />
            <div className="w-1.5 h-6 bg-zinc-800 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
