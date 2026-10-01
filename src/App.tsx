import React, { useState, useEffect, useRef } from 'react';
import { DogeCoreConfig, NodeStatus, ArcadeSession, SwfGame } from './types/arcade';
import { DEFAULT_SWF_GAMES } from './data/defaultGames';
import { ArcadeMarquee } from './components/ArcadeMarquee';
import { ArcadeScreen } from './components/ArcadeScreen';
import { CoinDoor } from './components/CoinDoor';
import { GameLibraryModal } from './components/GameLibraryModal';
import { NodeSettingsModal } from './components/NodeSettingsModal';
import { InstallGuideModal } from './components/InstallGuideModal';
import { arcadeAudio } from './utils/audio';

export default function App() {
  const [config, setConfig] = useState<DogeCoreConfig>({
    host: '127.0.0.1',
    port: 22555,
    user: 'elshaddai',
    password: 'DAaB6QuYcEmuGmYENZRD4vdM9BFKt1zz8x',
    priceDoge: 25,
    minConfirmations: 6,
    network: 'mainnet',
  });

  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);
  const [games, setGames] = useState<SwfGame[]>(DEFAULT_SWF_GAMES);
  const [activeSession, setActiveSession] = useState<ArcadeSession | null>(null);
  const [activeGame, setActiveGame] = useState<SwfGame | null>(null);
  const [creditCount, setCreditCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // Modals
  const [showGameLibrary, setShowGameLibrary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const pollIntervalRef = useRef<any>(null);

  // Initial Data Fetch
  useEffect(() => {
    fetchConfig();
    fetchNodeStatus();
    fetchGames();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/arcade/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
      }
    } catch (e) {
      console.warn('Failed to load arcade config:', e);
    }
  };

  const fetchNodeStatus = async () => {
    try {
      const res = await fetch('/api/arcade/node-status');
      if (res.ok) {
        const data = await res.json();
        setNodeStatus(data);
      }
    } catch (e) {
      console.warn('Failed to load node status:', e);
      setNodeStatus({
        connected: false,
        error: 'Offline / Standby Mode',
        lastChecked: Date.now(),
      });
    }
  };

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/arcade/games');
      if (res.ok) {
        const data = await res.json();
        if (data.games && data.games.length > 0) {
          setGames(data.games);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch games:', e);
    }
  };

  // Payment Polling Loop
  useEffect(() => {
    if (activeSession && activeSession.status === 'WAITING') {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/arcade/check-payment/${activeSession.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.paid) {
              clearInterval(pollIntervalRef.current);
              handlePaymentSuccess(data.game || games[Math.floor(Math.random() * games.length)]);
            } else if (data.expired) {
              clearInterval(pollIntervalRef.current);
              setActiveSession(null);
            }
          }
        } catch (e) {
          console.warn('Polling error:', e);
        }
      }, 2000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [activeSession, games]);

  const handlePaymentSuccess = (game: SwfGame) => {
    arcadeAudio.playCreditFanfare();
    arcadeAudio.playCrtIgnite();
    setCreditCount((prev) => prev + 1);
    setActiveSession(null);
    setActiveGame(game);
  };

  // 1. Generate new Dogecoin receiving address from Dogecoin Core 1.14.9
  const handleStartSession = async () => {
    setIsLoadingSession(true);
    try {
      const res = await fetch('/api/arcade/new-session', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
        setActiveGame(null);
      }
    } catch (e) {
      console.error('Failed to create arcade session:', e);
      // Fallback local session if offline
      const mockId = 'local_' + Date.now();
      setActiveSession({
        id: mockId,
        address: 'D9w4XFkPzXpYV7xM8wK7zH9L2mQ5r4t8v9',
        amountRequired: config.priceDoge,
        amountReceived: 0,
        status: 'WAITING',
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000,
        isSimulated: true,
      });
      setActiveGame(null);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // 2. Simulate 25 DOGE deposit (Instant testing on bench)
  const handleSimulatePayment = async () => {
    if (!activeSession) return;
    setIsSimulatingPayment(true);

    try {
      const res = await fetch('/api/arcade/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSession.id }),
      });

      if (res.ok) {
        const data = await res.json();
        handlePaymentSuccess(data.game || games[Math.floor(Math.random() * games.length)]);
      }
    } catch (e) {
      console.error('Simulation error:', e);
      // Local fallback
      const randomGame = games[Math.floor(Math.random() * games.length)];
      handlePaymentSuccess(randomGame);
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  const handleCancelSession = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setActiveSession(null);
    setActiveGame(null);
  };

  const handleUploadCustomSwf = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/arcade/upload-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name.replace(/\.[^/.]+$/, ''),
            filename: file.name,
            category: 'Custom SWF',
            description: `Uploaded .swf game (${Math.round(file.size / 1024)} KB)`,
            base64Content: base64,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.game) {
            setGames((prev) => [data.game, ...prev]);
            setActiveGame(data.game);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error('Failed to upload game file:', e);
    }
  };

  const handleSaveConfig = async (newConfig: Partial<DogeCoreConfig>) => {
    try {
      const res = await fetch('/api/arcade/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        await fetchNodeStatus();
      }
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    arcadeAudio.enabled = next;
    if (next) arcadeAudio.playClick();
  };

  const toggleFullscreen = () => {
    arcadeAudio.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      {/* 1. Arcade Header Marquee & Top Bar */}
      <ArcadeMarquee
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onToggleFullscreen={toggleFullscreen}
        onOpenGames={() => setShowGameLibrary(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenGuide={() => setShowInstallGuide(true)}
        onInsertCoin={handleStartSession}
        nodeConnected={!!nodeStatus?.connected}
        priceDoge={config.priceDoge}
      />

      {/* 2. Main CRT Screen Centerpiece */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-2 py-4">
        <ArcadeScreen
          session={activeSession}
          activeGame={activeGame}
          games={games}
          onStartSession={handleStartSession}
          onSimulatePayment={handleSimulatePayment}
          onCancelSession={handleCancelSession}
          onSelectGame={(game) => {
            setActiveGame(game);
            setActiveSession(null);
          }}
          onUploadCustomSwf={handleUploadCustomSwf}
          isSimulating={isSimulatingPayment}
          nodeConnected={!!nodeStatus?.connected}
          priceDoge={config.priceDoge}
        />
      </main>

      {/* 3. Authentic Coin Door & Rejection Mechanism */}
      <CoinDoor
        onInsertCoin={handleStartSession}
        isLoading={isLoadingSession}
        creditCount={creditCount}
        priceDoge={config.priceDoge}
        isSessionActive={!!activeSession}
      />

      {/* MODALS */}
      {showGameLibrary && (
        <GameLibraryModal
          games={games}
          activeGame={activeGame}
          onSelectGame={(g) => {
            setActiveGame(g);
            setActiveSession(null);
          }}
          onClose={() => setShowGameLibrary(false)}
          onUploadGame={handleUploadCustomSwf}
        />
      )}

      {showSettings && (
        <NodeSettingsModal
          config={config}
          status={nodeStatus}
          onSaveConfig={handleSaveConfig}
          onCheckStatus={fetchNodeStatus}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showInstallGuide && (
        <InstallGuideModal
          onClose={() => setShowInstallGuide(false)}
          priceDoge={config.priceDoge}
        />
      )}
    </div>
  );
}
