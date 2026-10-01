import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';
import { DogeCoreConfig, NodeStatus, ArcadeSession, SwfGame, PaymentLog } from './src/types/arcade';
import { DEFAULT_SWF_GAMES } from './src/data/defaultGames';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initial configuration from env or defaults
const config: DogeCoreConfig = {
  host: process.env.DOGE_RPC_HOST || '127.0.0.1',
  port: parseInt(process.env.DOGE_RPC_PORT || '22555', 10),
  user: process.env.DOGE_RPC_USER || 'elshaddai',
  password: process.env.DOGE_RPC_PASSWORD || 'DAaB6QuYcEmuGmYENZRD4vdM9BFKt1zz8x',
  priceDoge: parseFloat(process.env.DOGE_PRICE_PER_PLAY || '25'),
  minConfirmations: parseInt(process.env.DOGE_MIN_CONFIRMATIONS || '6', 10),
  network: (process.env.DOGE_NETWORK as any) || 'mainnet',
};

// In-memory runtime state
const activeSessions = new Map<string, ArcadeSession>();
let paymentLogs: PaymentLog[] = [];
let customGames: SwfGame[] = [...DEFAULT_SWF_GAMES];

// Ensure public games folder exists (This is the BIN where users drop all .swf files!)
const publicGamesDir = path.join(__dirname, 'public', 'games');
if (!fs.existsSync(publicGamesDir)) {
  fs.mkdirSync(publicGamesDir, { recursive: true });
}

// Write a README helper inside public/games/
const readmeBinPath = path.join(publicGamesDir, 'DROP_SWF_FILES_HERE.txt');
if (!fs.existsSync(readmeBinPath)) {
  fs.writeFileSync(
    readmeBinPath,
    'DROP ALL YOUR .SWF FLASH FILES HERE! The DogeArcade automatically loads all .swf files in this folder for the 25 DOGE random rotation.'
  );
}

// Function to dynamically scan public/games/ directory for any newly dropped .swf files
function scanAndGetGames(): SwfGame[] {
  try {
    if (fs.existsSync(publicGamesDir)) {
      const diskFiles = fs.readdirSync(publicGamesDir);
      for (const file of diskFiles) {
        if (file.toLowerCase().endsWith('.swf')) {
          const alreadyExists = customGames.some(
            (g) => g.filename.toLowerCase() === file.toLowerCase()
          );
          if (!alreadyExists) {
            const prettyTitle = file
              .replace(/\.swf$/i, '')
              .replace(/[_-]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase());
            customGames.unshift({
              id: 'swf_' + file.replace(/[^a-zA-Z0-9]/g, '_'),
              title: prettyTitle,
              filename: file,
              url: `/games/${file}`,
              category: 'Custom Flash SWF',
              year: '2026',
              description: `Game dynamically loaded from arcade SWF bin: public/games/${file}`,
              controls: 'Keyboard & Mouse',
              isBuiltIn: false,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error scanning public/games/ bin:', err);
  }
  return customGames;
}

// Dogecoin Core RPC Helper
async function callDogeRpc<T = any>(method: string, params: any[] = []): Promise<{ result: T | null; error: any }> {
  const url = `http://${config.host}:${config.port}/`;
  const auth = Buffer.from(`${config.user}:${config.password}`).toString('base64');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        jsonrpc: '1.0',
        id: `arcade-${Date.now()}`,
        method,
        params,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { result: null, error: `HTTP ${res.status}: ${res.statusText} ${errText}` };
    }

    const json = await res.json();
    if (json.error) {
      return { result: null, error: json.error.message || json.error };
    }

    return { result: json.result as T, error: null };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return { result: null, error: err.message || 'RPC Connection Failed' };
  }
}

// Generate realistic Dogecoin fallback addresses when node is in setup/demo mode
function generateFallbackDogeAddress(network: 'mainnet' | 'testnet' | 'regtest'): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const prefix = network === 'mainnet' ? 'D' : 'n';
  let addr = prefix;
  for (let i = 0; i < 33; i++) {
    addr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return addr;
}

// --- API ROUTES ---

// 1. Get current config
app.get('/api/arcade/config', (_req: Request, res: Response) => {
  res.json({
    config: {
      ...config,
      password: config.password ? '••••••••' : '',
    },
  });
});

// 2. Update config
app.post('/api/arcade/config', (req: Request, res: Response) => {
  const { host, port, user, password, priceDoge, minConfirmations, network } = req.body;
  if (host !== undefined) config.host = host;
  if (port !== undefined) config.port = parseInt(port, 10);
  if (user !== undefined) config.user = user;
  if (password !== undefined && password !== '••••••••') config.password = password;
  if (priceDoge !== undefined) config.priceDoge = parseFloat(priceDoge);
  if (minConfirmations !== undefined) config.minConfirmations = parseInt(minConfirmations, 10);
  if (network !== undefined) config.network = network;

  res.json({ success: true, config: { ...config, password: '••••••••' } });
});

// 3. Node RPC status check
app.get('/api/arcade/node-status', async (_req: Request, res: Response) => {
  const { result: netInfo, error: netErr } = await callDogeRpc<any>('getnetworkinfo');
  const { result: chainInfo } = await callDogeRpc<any>('getblockchaininfo');
  const { result: balance } = await callDogeRpc<number>('getbalance');

  if (netErr || !netInfo) {
    const status: NodeStatus = {
      connected: false,
      error: netErr || 'Unable to connect to Dogecoin Core RPC at ' + config.host + ':' + config.port,
      lastChecked: Date.now(),
    };
    res.json(status);
    return;
  }

  const status: NodeStatus = {
    connected: true,
    version: netInfo.version,
    subversion: netInfo.subversion,
    protocolversion: netInfo.protocolversion,
    connections: netInfo.connections,
    network: chainInfo?.chain || config.network,
    blocks: chainInfo?.blocks,
    headers: chainInfo?.headers,
    difficulty: chainInfo?.difficulty,
    balance: balance !== null ? balance : 0,
    lastChecked: Date.now(),
  };

  res.json(status);
});

// 4. Create new arcade play session (Generates 25 DOGE address)
app.post('/api/arcade/new-session', async (req: Request, res: Response) => {
  const sessionId = 'session_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
  
  // Try getting a real address from Dogecoin Core node
  let address: string = '';
  let isSimulated = false;

  const { result: rpcAddress, error: rpcErr } = await callDogeRpc<string>('getnewaddress', [`arcade_play_${sessionId}`]);

  if (rpcAddress && !rpcErr) {
    address = rpcAddress;
  } else {
    // Generate valid-format Dogecoin fallback address
    address = generateFallbackDogeAddress(config.network);
    isSimulated = true;
  }

  const session: ArcadeSession = {
    id: sessionId,
    address,
    amountRequired: config.priceDoge,
    amountReceived: 0,
    status: 'WAITING',
    createdAt: Date.now(),
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins to pay
    isSimulated,
  };

  activeSessions.set(sessionId, session);

  res.json({
    session,
    nodeConnected: !isSimulated,
    dogeUri: `dogecoin:${address}?amount=${config.priceDoge}&label=Arcade%20Play`,
  });
});

// 5. Check payment status for a session
app.get('/api/arcade/check-payment/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: 'Session not found or expired' });
    return;
  }

  if (session.status === 'PAID') {
    res.json({
      paid: true,
      session,
      game: session.gameAssigned,
    });
    return;
  }

  // Check if session has expired
  if (Date.now() > session.expiresAt) {
    session.status = 'EXPIRED';
    res.json({ paid: false, expired: true, session });
    return;
  }

  // If node is connected, query getreceivedbyaddress
  if (!session.isSimulated) {
    const { result: receivedAmount } = await callDogeRpc<number>('getreceivedbyaddress', [
      session.address,
      config.minConfirmations,
    ]);

    if (receivedAmount !== null && receivedAmount !== undefined) {
      session.amountReceived = receivedAmount;
      if (receivedAmount >= session.amountRequired) {
        session.status = 'PAID';
        // Pick a random SWF game from catalog (including any in public/games/)
        const availableGames = scanAndGetGames();
        const randomIndex = Math.floor(Math.random() * availableGames.length);
        session.gameAssigned = availableGames[randomIndex];

        paymentLogs.unshift({
          id: 'pay_' + Date.now(),
          timestamp: Date.now(),
          address: session.address,
          amount: receivedAmount,
          gameTitle: session.gameAssigned.title,
          status: 'CONFIRMED',
        });
      }
    }
  }

  res.json({
    paid: session.status === 'PAID',
    session,
    game: session.gameAssigned,
  });
});

// 6. Simulate test payment (For instant test bench & UI testing without losing mainnet funds)
app.post('/api/arcade/simulate-payment', (req: Request, res: Response) => {
  const { sessionId } = req.body;
  const session = activeSessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  session.status = 'PAID';
  session.amountReceived = session.amountRequired;
  
  // Pick random SWF game from scanned catalog
  const availableGames = scanAndGetGames();
  const randomIndex = Math.floor(Math.random() * availableGames.length);
  session.gameAssigned = availableGames[randomIndex];

  paymentLogs.unshift({
    id: 'sim_' + Date.now(),
    timestamp: Date.now(),
    address: session.address,
    amount: session.amountRequired,
    gameTitle: session.gameAssigned.title,
    status: 'SIMULATED',
  });

  res.json({
    success: true,
    session,
    game: session.gameAssigned,
  });
});

// 7. Get games catalog (Scans public/games/ folder dynamically)
app.get('/api/arcade/games', (_req: Request, res: Response) => {
  const allGames = scanAndGetGames();
  res.json({
    games: allGames,
    total: allGames.length,
    binFolder: 'public/games/',
  });
});

// 8. Upload or register a new SWF game
app.post('/api/arcade/upload-game', (req: Request, res: Response) => {
  const { title, filename, category, description, controls, base64Content } = req.body;

  if (!title || !filename) {
    res.status(400).json({ error: 'Title and filename are required' });
    return;
  }

  let finalUrl = `/games/${filename}`;

  // If binary SWF base64 provided, write to disk in public/games
  if (base64Content) {
    try {
      const buffer = Buffer.from(base64Content.replace(/^data:.*?;base64,/, ''), 'base64');
      const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = path.join(publicGamesDir, safeFilename);
      fs.writeFileSync(filePath, buffer);
      finalUrl = `/games/${safeFilename}`;
    } catch (e: any) {
      console.error('Failed to write SWF file to disk:', e);
    }
  }

  const newGame: SwfGame = {
    id: 'game_' + Date.now(),
    title,
    filename,
    url: finalUrl,
    category: category || 'Arcade Flash',
    year: '2026',
    description: description || 'Custom player uploaded SWF game.',
    controls: controls || 'Arrow keys / Mouse / Spacebar',
    isBuiltIn: false,
  };

  customGames.unshift(newGame);
  res.json({ success: true, game: newGame, total: customGames.length });
});

// 9. Payment history logs
app.get('/api/arcade/logs', (_req: Request, res: Response) => {
  res.json({ logs: paymentLogs.slice(0, 50) });
});

// 10. Generate full .ZIP download package for LAN / Arcade Network installation
app.get('/api/arcade/download-zip', async (_req: Request, res: Response) => {
  try {
    const zip = new JSZip();

    // 1. dogecoin.conf template
    const dogecoinConf = `# ===================================================================
# DOGECOIN CORE 1.14.9 CONFIGURATION FOR DOGE ARCADE CABINET
# Place this file in:
#   Linux:   ~/.dogecoin/dogecoin.conf
#   Windows: %APPDATA%\\Dogecoin\\dogecoin.conf
#   macOS:   ~/Library/Application Support/Dogecoin/dogecoin.conf
# ===================================================================

# Enable JSON-RPC server
server=1

# RPC credentials (matches your arcade server configuration)
rpcuser=${config.user}
rpcpassword=${config.password}

# Default RPC port (22555 for mainnet, 44555 for testnet)
rpcport=${config.port}

# Allow local machine and LAN devices to connect to RPC
rpcallowip=127.0.0.1
rpcallowip=192.168.*.*
rpcallowip=10.*.*.*
rpcallowip=172.16.*.*

# Network selection
# testnet=1 # Uncomment to test without spending real DOGE

# Wallet settings
disablewallet=0
txindex=1

# Optional: Run in background
daemon=1
`;

    zip.file('dogecoin.conf', dogecoinConf);

    // 2. Comprehensive INSTALL_INSTRUCTIONS.md
    const installInstructions = `# DOGECOIN ARCADE CABINET (25 DOGE TO PLAY)
## Complete Network Installation & Deployment Guide for Dogecoin Core 1.14.9

Welcome to DogeArcade! This system turns any PC, mini-PC, or Raspberry Pi into a real Dogecoin-powered arcade cabinet. When a player pays 25 DOGE, Dogecoin Core confirms the payment and automatically unlocks the screen to run a random .SWF Flash game via Ruffle emulator.

---

### 🎮 WHERE TO FILL YOUR .SWF GAMES ("THE SWF BIN")
**THE SWF BIN FOLDER IS:**
\`\`\`
doge-arcade/public/games/
\`\`\`

1. Inside your extracted arcade folder, go into:
   \`public/games/\`
2. **Drop your 20 .swf files right in there!**
   For example:
   - \`public/games/game1.swf\`
   - \`public/games/game2.swf\`
   - \`public/games/game3.swf\`
   ... and so on.
3. **Whenever you get more .swf games in the future, simply drop them into \`public/games/\`!**
4. The DogeArcade server automatically scans the \`public/games/\` bin dynamically:
   - No server restart needed.
   - Any new \`.swf\` file is immediately added to the 25 DOGE random rotation!
   - You can also drag & drop .swf files directly onto the arcade screen in your web browser!

---

### 🐕 STEP 1: CONFIGURE DOGECOIN CORE 1.14.9

Your Dogecoin Core credentials are pre-configured in this package:
- **RPC Host:** 127.0.0.1 (or LOCALHOST)
- **RPC Port:** 22555
- **RPC User:** elshaddai
- **RPC Password:** DAaB6QuYcEmuGmYENZRD4vdM9BFKt1zz8x
- **Price per play:** 25 DOGE
- **Min Confirmations:** 6 (or set to 0 in .env for instant 1-second arcade play!)

1. Copy the included \`dogecoin.conf\` file to your Dogecoin Core data directory:
   - **Linux:**   \`~/.dogecoin/dogecoin.conf\`
   - **Windows:** \`%APPDATA%\\Dogecoin\\dogecoin.conf\` (C:\\Users\\<YourName>\\AppData\\Roaming\\Dogecoin\\dogecoin.conf)
   - **macOS:**   \`~/Library/Application Support/Dogecoin/dogecoin.conf\`

2. Your \`dogecoin.conf\` file contains:
   \`\`\`ini
   server=1
   rpcuser=elshaddai
   rpcpassword=DAaB6QuYcEmuGmYENZRD4vdM9BFKt1zz8x
   rpcport=22555
   rpcallowip=127.0.0.1
   rpcallowip=192.168.*.*
   rpcallowip=10.*.*.*
   disablewallet=0
   txindex=1
   daemon=1
   \`\`\`

3. Start Dogecoin Core 1.14.9:
   \`\`\`bash
   # Linux daemon:
   dogecoind -daemon

   # Or Windows / GUI:
   dogecoin-qt -server
   \`\`\`

4. Verify RPC is communicating:
   \`\`\`bash
   dogecoin-cli -rpcuser=elshaddai -rpcpassword=DAaB6QuYcEmuGmYENZRD4vdM9BFKt1zz8x getnetworkinfo
   \`\`\`

---

### 🕹️ STEP 2: INSTALL & RUN DOGEARCADE

1. Extract this .ZIP package on your arcade machine:
   \`\`\`bash
   unzip doge-arcade-cabinet-v1.14.9.zip -d doge-arcade
   cd doge-arcade
   \`\`\`

2. Install dependencies (Node.js 18+ required):
   \`\`\`bash
   npm install
   \`\`\`

3. Drop your 20 .swf files into:
   \`\`\`bash
   public/games/
   \`\`\`

4. Start the arcade server:
   \`\`\`bash
   # On Linux:
   ./start-arcade.sh
   # (or: npm run build && npm start)

   # On Windows:
   double click: start-arcade.bat
   \`\`\`

5. Open your browser to:
   \`\`\`
   http://localhost:3000
   \`\`\`

---

### 🖥️ STEP 3: KIOSK FULLSCREEN ARCADE MODE (AUTO-BOOT)

#### Linux / Raspberry Pi:
\`\`\`bash
google-chrome --kiosk --incognito --app=http://localhost:3000
\`\`\`

#### Windows (start-kiosk.bat):
\`\`\`batch
start msedge --kiosk http://localhost:3000 --edge-kiosk-type=fullscreen
\`\`\`

---

### ⚡ NOTE ON CONFIRMATIONS (0-CONF VS 6-CONF)
- With \`DOGE_MIN_CONFIRMATIONS=6\`, Dogecoin Core waits for 6 blockchain blocks (~6 minutes) before unlocking the screen.
- If you want **instant arcade play** (player scans QR, sends 25 DOGE, and screen opens in 2 seconds when TX hits the mempool), change \`DOGE_MIN_CONFIRMATIONS=0\` in \`.env\`.


---

### STEP 3: RUN IN RETRO ARCADE KIOSK MODE

To lock the cabinet into fullscreen arcade mode on boot:

#### Linux / Raspberry Pi:
\`\`\`bash
google-chrome --kiosk --incognito --app=http://localhost:3000
\`\`\`

#### Windows (start-kiosk.bat):
\`\`\`batch
start msedge --kiosk http://localhost:3000 --edge-kiosk-type=fullscreen
\`\`\`

---

### HOW THE PAYMENT LOOP WORKS
1. Player presses "INSERT 25 DOGE" or presses the coin slot button.
2. The arcade backend calls Dogecoin Core RPC \`getnewaddress "arcade_play"\`.
3. Dogecoin Core returns a unique receiving address (e.g., \`D7w4k...\`).
4. The cabinet displays a high-contrast QR code and payment URI (\`dogecoin:D...?\`).
5. Player scans with their mobile Dogecoin wallet and sends 25 DOGE.
6. The cabinet polls \`getreceivedbyaddress\` every 2 seconds.
7. As soon as payment is detected, the CRT screen blossoms open with arcade chime sound!
8. A random .SWF game from your library mounts in Ruffle and starts immediately.

Much Arcade. Very Flash. Wow!
`;

    zip.file('INSTALL_INSTRUCTIONS.md', installInstructions);

    // 3. Linux launcher script
    const startSh = `#!/usr/bin/env bash
echo "=========================================="
echo " Starting DogeArcade Cabinet 25 DOGE Machine"
echo "=========================================="

if ! command -v node &> /dev/null; then
    echo "Node.js not found! Please install Node.js v18+."
    exit 1
fi

npm run build
npm start
`;
    zip.file('start-arcade.sh', startSh, { unixPermissions: '755' });

    // 4. Windows launcher script
    const startBat = `@echo off
echo ==========================================
echo  Starting DogeArcade Cabinet 25 DOGE Machine
echo ==========================================
node -v >nul 2>&1
if errorlevel 1 (
    echo Node.js is required! Please install Node.js v18+ from https://nodejs.org
    pause
    exit /b 1
)
call npm run build
call npm start
pause
`;
    zip.file('start-arcade.bat', startBat);

    // 5. Sample .env file
    const envFile = `DOGE_RPC_HOST=${config.host}
DOGE_RPC_PORT=${config.port}
DOGE_RPC_USER=${config.user}
DOGE_RPC_PASSWORD=${config.password}
DOGE_PRICE_PER_PLAY=${config.priceDoge}
DOGE_MIN_CONFIRMATIONS=${config.minConfirmations}
DOGE_NETWORK=${config.network}
PORT=3000
`;
    zip.file('.env', envFile);

    // 6. Source files & configs
    const packageJsonContent = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
    zip.file('package.json', packageJsonContent);

    const tsconfigContent = fs.readFileSync(path.join(__dirname, 'tsconfig.json'), 'utf8');
    zip.file('tsconfig.json', tsconfigContent);

    const viteConfigContent = fs.readFileSync(path.join(__dirname, 'vite.config.ts'), 'utf8');
    zip.file('vite.config.ts', viteConfigContent);

    const indexHtmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    zip.file('index.html', indexHtmlContent);

    const serverTsContent = fs.readFileSync(path.join(__dirname, 'server.ts'), 'utf8');
    zip.file('server.ts', serverTsContent);

    // Add src directory files
    const srcDir = path.join(__dirname, 'src');
    function addDirToZip(dirPath: string, zipFolder: any) {
      if (!fs.existsSync(dirPath)) return;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          const subFolder = zipFolder.folder(entry.name);
          addDirToZip(fullPath, subFolder);
        } else {
          zipFolder.file(entry.name, fs.readFileSync(fullPath));
        }
      }
    }
    const srcFolder = zip.folder('src');
    addDirToZip(srcDir, srcFolder);

    // Add public directory (including public/games SWF bin)
    const publicDir = path.join(__dirname, 'public');
    const publicFolder = zip.folder('public');
    addDirToZip(publicDir, publicFolder);

    // Generate zip buffer
    const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="doge-arcade-cabinet-v1.14.9.zip"');
    res.send(content);
  } catch (err: any) {
    console.error('ZIP generation error:', err);
    res.status(500).json({ error: 'Failed to generate ZIP package: ' + err.message });
  }
});

// Vite middleware for development or static build for production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🕹️ DogeArcade Server running on http://localhost:${PORT}`);
    console.log(`🐕 Configured Dogecoin Core 1.14.9 RPC: ${config.host}:${config.port}`);
  });
}

startServer();
