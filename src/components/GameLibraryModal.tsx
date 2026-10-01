import React, { useState } from 'react';
import { SwfGame } from '../types/arcade';
import { arcadeAudio } from '../utils/audio';
import { X, Upload, Play, Search, Gamepad2, Sparkles, FolderOpen, Check } from 'lucide-react';

interface GameLibraryModalProps {
  games: SwfGame[];
  activeGame: SwfGame | null;
  onSelectGame: (game: SwfGame) => void;
  onClose: () => void;
  onUploadGame: (file: File) => void;
}

export const GameLibraryModal: React.FC<GameLibraryModalProps> = ({
  games,
  activeGame,
  onSelectGame,
  onClose,
  onUploadGame,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const filteredGames = games.filter(
    (g) =>
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.name.toLowerCase().endsWith('.swf')) {
          onUploadGame(file);
          setUploadSuccess(`Loaded ${file.name} into cabinet library!`);
          setTimeout(() => setUploadSuccess(null), 3000);
        }
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (file.name.toLowerCase().endsWith('.swf')) {
          onUploadGame(file);
          setUploadSuccess(`Loaded ${file.name} into cabinet library!`);
          setTimeout(() => setUploadSuccess(null), 3000);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-[#12151f] border-2 border-[#3a3f55] rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-[#181c2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#f6a821]">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-arcade text-white flex items-center gap-2">
                ARCADE SWF LIBRARY
                <span className="text-xs font-retro text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {games.length} GAMES
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-retro">
                20 Flash games configured. Drag & drop your .SWF files below.
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

        {/* SWF Drop Zone & Search Bar */}
        <div className="p-4 border-b border-zinc-800 bg-[#0e1017] flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search Flash games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/60 border border-zinc-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-retro"
            />
          </div>

          {/* Upload Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="w-full sm:w-auto px-4 py-2 bg-[#f6a821] hover:bg-[#e59510] text-black font-arcade text-xs rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 shadow">
              <Upload className="w-4 h-4" />
              ADD .SWF FILES
              <input
                type="file"
                accept=".swf"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Drop notice banner and Disk Bin location */}
        <div className="mx-4 mt-3 space-y-2">
          {/* Bin folder callout */}
          <div className="bg-[#1b2133] border border-amber-500/40 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="font-arcade text-[11px] text-amber-300">
                  YOUR SWF BIN DIRECTORY: <code className="bg-black/60 px-2 py-0.5 rounded text-white font-mono border border-zinc-700">doge-arcade/public/games/</code>
                </div>
                <div className="text-[11px] text-zinc-300 font-retro">
                  Drop your 20 .swf files here. Whenever you get more, just drop them into this bin — the arcade detects them automatically!
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText('doge-arcade/public/games/');
                setUploadSuccess('Copied bin path: doge-arcade/public/games/');
                arcadeAudio.playClick();
                setTimeout(() => setUploadSuccess(null), 2500);
              }}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-retro shrink-0 border border-zinc-700 transition-colors"
            >
              Copy Bin Path
            </button>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`p-3 rounded-lg border-2 border-dashed transition-all flex items-center justify-center gap-2 text-xs font-retro ${
              dragActive
                ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                : 'border-zinc-700/80 bg-black/30 text-zinc-400'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>OR DRAG & DROP ANY .SWF FILES DIRECTLY ONTO THIS WINDOW</span>
          </div>
        </div>

        {uploadSuccess && (
          <div className="mx-4 mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-xs font-retro flex items-center gap-2">
            <Check className="w-4 h-4" />
            {uploadSuccess}
          </div>
        )}

        {/* Games Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredGames.map((game, index) => {
            const isSelected = activeGame?.id === game.id;
            return (
              <div
                key={game.id}
                className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-400/80 shadow-[0_0_15px_rgba(246,168,33,0.15)]'
                    : 'bg-[#151926] border-zinc-800 hover:border-zinc-700 hover:bg-[#1a1f30]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-arcade text-zinc-500">
                      SLOT {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-retro text-amber-400/80 px-2 py-0.5 rounded bg-black/40">
                      {game.category}
                    </span>
                  </div>

                  <h3 className="font-arcade text-xs text-white mb-1 leading-snug line-clamp-1">
                    {game.title}
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-2 mb-2 font-retro leading-relaxed">
                    {game.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-retro">
                  <span className="text-zinc-500 truncate max-w-[150px]">{game.filename}</span>
                  <button
                    onClick={() => {
                      arcadeAudio.playCreditFanfare();
                      onSelectGame(game);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-arcade text-[10px] rounded flex items-center gap-1.5 transition-transform active:scale-95 shadow"
                  >
                    <Play className="w-3 h-3 fill-black" />
                    LOAD & PLAY
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-[#0e1017] flex items-center justify-between text-xs font-retro text-zinc-400 px-5">
          <span>Randomizer picks from these {games.length} games upon 25 DOGE deposit</span>
          <button
            onClick={() => {
              arcadeAudio.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-arcade text-[10px]"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
