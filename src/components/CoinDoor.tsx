import React from 'react';
import { arcadeAudio } from '../utils/audio';
import { Sparkles, Coins } from 'lucide-react';

interface CoinDoorProps {
  onInsertCoin: () => void;
  isLoading: boolean;
  creditCount: number;
  priceDoge: number;
  isSessionActive: boolean;
}

export const CoinDoor: React.FC<CoinDoorProps> = ({
  onInsertCoin,
  isLoading,
  creditCount,
  priceDoge,
  isSessionActive,
}) => {
  const handleClickCoinSlot = () => {
    arcadeAudio.playCoinInsert();
    onInsertCoin();
  };

  return (
    <div className="w-full bg-[#151720] border-t-4 border-[#0b0c10] shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] py-6 px-4 flex flex-col items-center">
      {/* Coin Door Steel Faceplate */}
      <div className="w-full max-w-xl bg-gradient-to-b from-[#242735] via-[#1a1d28] to-[#12141c] border-2 border-[#3a3f52] rounded-lg p-5 shadow-2xl relative">
        {/* Metal Screws in corners */}
        <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#4a5068] border border-black/50 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-black/60 rotate-45" />
        </div>
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#4a5068] border border-black/50 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-black/60 -rotate-45" />
        </div>
        <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#4a5068] border border-black/50 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-black/60 -rotate-45" />
        </div>
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#4a5068] border border-black/50 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-black/60 rotate-45" />
        </div>

        {/* Center Coin Door Plate */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4 py-2">
          {/* Credit Display */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-arcade text-zinc-400 mb-1">ARCADE CREDITS</span>
            <div className="bg-black border-2 border-red-950 px-5 py-2 rounded shadow-inner flex items-center gap-2">
              <span className="font-arcade text-xl text-red-500 tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">
                {String(creditCount).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Dual Coin Slots / Illuminated Rejection Buttons */}
          <div className="flex items-center gap-6">
            {/* Slot 1: Primary 25 DOGE */}
            <div className="flex flex-col items-center">
              {/* Coin Slot Opening */}
              <div className="w-12 h-2.5 bg-black rounded-sm border border-zinc-700 shadow-inner mb-2 flex items-center justify-center">
                <div className="w-8 h-1 bg-[#090b0e]" />
              </div>

              {/* Illuminated Rejection Button */}
              <button
                onClick={handleClickCoinSlot}
                disabled={isLoading}
                aria-label={`Insert ${priceDoge} Dogecoin`}
                className={`group relative w-16 h-16 rounded bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 border-2 border-amber-300 shadow-[0_0_15px_rgba(246,168,33,0.5)] active:translate-y-0.5 active:shadow-inner transition-all flex flex-col items-center justify-center ${
                  isSessionActive ? 'ring-2 ring-amber-400 animate-pulse' : 'hover:brightness-110'
                }`}
              >
                <span className="font-arcade text-base font-bold text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                  {priceDoge}
                </span>
                <span className="font-arcade text-[9px] font-bold text-black">
                  ÐOGE
                </span>
              </button>
              <span className="mt-1.5 text-[9px] font-retro text-amber-400/90 tracking-wider">
                PUSH FOR Ð
              </span>
            </div>

            {/* Slot 2: Secondary / Reject */}
            <div className="flex flex-col items-center opacity-85">
              <div className="w-12 h-2.5 bg-black rounded-sm border border-zinc-700 shadow-inner mb-2 flex items-center justify-center">
                <div className="w-8 h-1 bg-[#090b0e]" />
              </div>

              <button
                onClick={handleClickCoinSlot}
                disabled={isLoading}
                aria-label={`Insert ${priceDoge} Dogecoin`}
                className="w-16 h-16 rounded bg-gradient-to-b from-orange-600 via-orange-700 to-red-800 border-2 border-orange-400 shadow-[0_0_12px_rgba(234,88,12,0.4)] active:translate-y-0.5 transition-all flex flex-col items-center justify-center hover:brightness-110"
              >
                <Coins className="w-5 h-5 text-amber-200 mb-0.5" />
                <span className="font-arcade text-[8px] text-amber-100">
                  COIN
                </span>
              </button>
              <span className="mt-1.5 text-[9px] font-retro text-zinc-400 tracking-wider">
                INSERT
              </span>
            </div>
          </div>

          {/* Keyhole / Service Lock */}
          <div className="hidden sm:flex flex-col items-center">
            <span className="text-[10px] font-arcade text-zinc-500 mb-1">LOCK</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600 flex items-center justify-center shadow-inner">
              <div className="w-1.5 h-3 bg-black rounded-sm" />
            </div>
          </div>
        </div>

        {/* Micro Notice on Coin Door */}
        <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-retro text-zinc-400 px-2">
          <span>DOGECOIN CORE 1.14.9 COMPATIBLE</span>
          <span className="text-amber-400 font-arcade text-[9px]">25 DOGE = 1 CREDIT</span>
        </div>
      </div>
    </div>
  );
};
