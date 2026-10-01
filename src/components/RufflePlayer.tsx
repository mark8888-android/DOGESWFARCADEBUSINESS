import React, { useEffect, useRef, useState } from 'react';
import { SwfGame } from '../types/arcade';
import { BuiltInGameCanvas } from './BuiltInGames';
import { Upload, Gamepad2, WifiOff } from 'lucide-react';

interface RufflePlayerProps {
  game: SwfGame;
  onGameLoaded?: () => void;
  onUploadCustomSwf?: (file: File) => void;
}

declare global {
  interface Window {
    RufflePlayer?: any;
  }
}

export const RufflePlayer: React.FC<RufflePlayerProps> = ({ game, onGameLoaded, onUploadCustomSwf }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ruffleAvailable, setRuffleAvailable] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customFileLoaded, setCustomFileLoaded] = useState<string | null>(null);
  const [useEmbedTag, setUseEmbedTag] = useState<boolean>(false);

  const swfUrl = customFileLoaded || game.url;

  useEffect(() => {
    // If this is a built-in canvas game, use the built-in interactive engine
    if (game.isBuiltIn && !customFileLoaded) {
      setRuffleAvailable(false);
      if (onGameLoaded) onGameLoaded();
      return;
    }

    const checkRuffle = () => {
      if (window.RufflePlayer) {
        setRuffleAvailable(true);
        mountSwf(swfUrl);
      } else {
        // Wait briefly for local offline ruffle.js to initialize
        let tries = 0;
        const interval = setInterval(() => {
          tries++;
          if (window.RufflePlayer) {
            clearInterval(interval);
            setRuffleAvailable(true);
            mountSwf(swfUrl);
          } else if (tries > 8) {
            clearInterval(interval);
            // If ruffle.js not loaded, fall back to native <embed src=".swf"></embed>
            setRuffleAvailable(false);
            setUseEmbedTag(true);
          }
        }, 200);
      }
    };

    checkRuffle();
  }, [game, customFileLoaded, swfUrl]);

  const mountSwf = async (url: string) => {
    if (!containerRef.current || !window.RufflePlayer) {
      setUseEmbedTag(true);
      return;
    }

    try {
      setLoadError(null);
      containerRef.current.innerHTML = '';
      const ruffle = window.RufflePlayer.newest();
      const player = ruffle.createPlayer();
      player.style.width = '100%';
      player.style.height = '100%';

      containerRef.current.appendChild(player);

      await player.load({
        url,
        autoplay: 'on',
        letterbox: 'on',
        backgroundColor: '#0a0d14',
      });

      if (onGameLoaded) onGameLoaded();
    } catch (err: any) {
      console.warn('Ruffle load exception, activating <embed> fallback:', err);
      setUseEmbedTag(true);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.swf')) {
      alert('Please upload a valid .swf Flash file!');
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    setCustomFileLoaded(blobUrl);

    if (onUploadCustomSwf) {
      onUploadCustomSwf(file);
    }

    if (window.RufflePlayer) {
      mountSwf(blobUrl);
    } else {
      setUseEmbedTag(true);
    }
  };

  // If built-in arcade or fallback requested
  if (game.isBuiltIn && !customFileLoaded) {
    return <BuiltInGameCanvas game={game} />;
  }

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center bg-[#07090e]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      {/* Offline Mode indicator badge */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 border border-zinc-800 text-[10px] font-retro text-amber-400">
        <WifiOff className="w-3 h-3" />
        <span>OFFLINE READY · LOCAL RUFFLE.JS</span>
      </div>

      {/* Ruffle WebAssembly container */}
      <div
        ref={containerRef}
        className={`w-full h-full flex items-center justify-center ${useEmbedTag ? 'hidden' : 'block'}`}
      />

      {/* Patched standard HTML Flash embed requested by user for offline use */}
      {useEmbedTag && (
        <div className="w-full h-full flex items-center justify-center p-0 m-0 overflow-hidden bg-black">
          <embed
            src={swfUrl}
            type="application/x-shockwave-flash"
            width="100%"
            height="100%"
            className="w-full h-full border-0"
          ></embed>
        </div>
      )}

      {/* If SWF is loading or waiting for local file upload */}
      {(!ruffleAvailable || loadError) && !customFileLoaded && (
        <div className="absolute inset-0 bg-[#0c1017]/95 flex flex-col items-center justify-center p-6 text-center z-30">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#f6a821] mb-4">
            <Gamepad2 className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-arcade text-[#f6a821] mb-2">{game.title}</h3>
          <p className="text-xs text-zinc-400 max-w-md mb-3 leading-relaxed">
            Flash .SWF file: <span className="font-mono text-zinc-300">{game.filename}</span>
          </p>

          {/* Patched <embed> snippet preview */}
          <div className="mb-4 p-2 bg-black/80 border border-amber-500/30 rounded text-[11px] font-mono text-amber-300">
            &lt;embed src=&quot;{game.filename}&quot;&gt;&lt;/embed&gt;
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="px-5 py-2.5 bg-[#f6a821] hover:bg-[#e59510] text-black font-arcade text-xs rounded cursor-pointer transition-transform active:scale-95 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              LOAD YOUR .SWF FILE
              <input type="file" accept=".swf" onChange={handleFileInput} className="hidden" />
            </label>

            <button
              onClick={() => {
                setUseEmbedTag(true);
                setLoadError(null);
              }}
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-arcade text-[10px] rounded transition-colors"
            >
              RUN &lt;EMBED&gt; DIRECTLY
            </button>

            <button
              onClick={() => {
                // Switch to built-in arcade canvas game so user plays immediately
                game.isBuiltIn = true;
                setRuffleAvailable(false);
              }}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-arcade text-[10px] rounded transition-colors"
            >
              PLAY RETRO DEMO
            </button>
          </div>

          <p className="mt-4 text-[11px] text-zinc-500 font-retro">
            Or drop all 20 .swf files into <code className="text-amber-400">public/games/</code> for auto-loading!
          </p>
        </div>
      )}
    </div>
  );
};

