import React, { useEffect, useRef, useState } from 'react';
import { SwfGame } from '../types/arcade';

interface BuiltInGameProps {
  game: SwfGame;
  onGameOver?: (score: number) => void;
}

export const BuiltInGameCanvas: React.FC<BuiltInGameProps> = ({ game }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // --- GAME ENGINE SETUP ---
    // If Space Invaders
    const isInvaders = game.filename.includes('invaders');
    const isBreakout = game.filename.includes('breakout');

    let playerX = canvas.width / 2;
    const playerY = canvas.height - 40;
    const playerSpeed = 6;
    let bullets: { x: number; y: number; vy: number }[] = [];
    let enemies: { x: number; y: number; w: number; h: number; alive: boolean; type: number }[] = [];
    let enemyDirection = 1;
    let enemyStepTimer = 0;

    // Breakout specific
    let ballX = canvas.width / 2;
    let ballY = canvas.height - 60;
    let ballVx = 4;
    let ballVy = -4;
    const paddleWidth = 100;
    const bricks: { x: number; y: number; w: number; h: number; active: boolean; color: string }[] = [];

    // Initialize Breakout bricks
    if (isBreakout) {
      const rows = 5;
      const cols = 8;
      const brickW = 68;
      const brickH = 20;
      const pad = 8;
      const colors = ['#f6a821', '#ff5722', '#e91e63', '#9c27b0', '#00e5ff'];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          bricks.push({
            x: 20 + c * (brickW + pad),
            y: 40 + r * (brickH + pad),
            w: brickW,
            h: brickH,
            active: true,
            color: colors[r % colors.length],
          });
        }
      }
    }

    // Initialize Invaders
    if (isInvaders || (!isBreakout)) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          enemies.push({
            x: 60 + c * 60,
            y: 50 + r * 40,
            w: 32,
            h: 24,
            alive: true,
            type: r,
          });
        }
      }
    }

    let localScore = 0;
    let localLives = 3;
    let lastShootTime = 0;

    const gameLoop = (timestamp: number) => {
      // Clear frame
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield background
      ctx.fillStyle = 'rgba(246, 168, 33, 0.2)';
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 97) + timestamp * 0.02) % canvas.width;
        const sy = (i * 73) % canvas.height;
        ctx.fillRect(sx, sy, 2, 2);
      }

      if (isBreakout) {
        // --- BREAKOUT LOGIC ---
        // Player paddle movement
        if (keys['ArrowLeft'] || keys['a']) playerX -= playerSpeed;
        if (keys['ArrowRight'] || keys['d']) playerX += playerSpeed;
        playerX = Math.max(paddleWidth / 2, Math.min(canvas.width - paddleWidth / 2, playerX));

        // Draw paddle
        ctx.fillStyle = '#f6a821';
        ctx.shadowColor = '#f6a821';
        ctx.shadowBlur = 10;
        ctx.fillRect(playerX - paddleWidth / 2, playerY, paddleWidth, 14);
        ctx.shadowBlur = 0;

        // Ball movement
        ballX += ballVx;
        ballY += ballVy;

        // Wall collisions
        if (ballX <= 8 || ballX >= canvas.width - 8) ballVx = -ballVx;
        if (ballY <= 8) ballVy = -ballVy;

        // Paddle collision
        if (
          ballY + 8 >= playerY &&
          ballY - 8 <= playerY + 14 &&
          ballX >= playerX - paddleWidth / 2 &&
          ballX <= playerX + paddleWidth / 2
        ) {
          ballVy = -Math.abs(ballVy);
          const hitOffset = (ballX - playerX) / (paddleWidth / 2);
          ballVx = hitOffset * 6;
        }

        // Brick collisions
        let remainingBricks = 0;
        bricks.forEach((b) => {
          if (b.active) {
            remainingBricks++;
            if (
              ballX >= b.x &&
              ballX <= b.x + b.w &&
              ballY >= b.y &&
              ballY <= b.y + b.h
            ) {
              b.active = false;
              ballVy = -ballVy;
              localScore += 25;
              setScore(localScore);
            }
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
          }
        });

        // Bottom pit check
        if (ballY > canvas.height) {
          localLives--;
          setLives(localLives);
          if (localLives <= 0) {
            setIsGameOver(true);
            return;
          } else {
            ballX = canvas.width / 2;
            ballY = canvas.height - 70;
            ballVy = -4;
          }
        }

        // Draw Doge ball
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('Ð', ballX - 3, ballY + 3);

      } else {
        // --- SPACE INVADERS LOGIC ---
        // Player movement
        if (keys['ArrowLeft'] || keys['a']) playerX -= playerSpeed;
        if (keys['ArrowRight'] || keys['d']) playerX += playerSpeed;
        playerX = Math.max(25, Math.min(canvas.width - 25, playerX));

        // Player shooting
        if (keys[' '] && timestamp - lastShootTime > 260) {
          bullets.push({ x: playerX, y: playerY - 12, vy: -7 });
          lastShootTime = timestamp;
        }

        // Bullets update
        bullets = bullets.filter((b) => {
          b.y += b.vy;
          return b.y > 0;
        });

        // Enemies update
        enemyStepTimer++;
        if (enemyStepTimer > 25) {
          enemyStepTimer = 0;
          let hitEdge = false;
          enemies.forEach((e) => {
            if (e.alive) {
              if ((enemyDirection === 1 && e.x > canvas.width - 50) || (enemyDirection === -1 && e.x < 30)) {
                hitEdge = true;
              }
            }
          });

          if (hitEdge) {
            enemyDirection = -enemyDirection;
            enemies.forEach((e) => { e.y += 14; });
          } else {
            enemies.forEach((e) => { e.x += enemyDirection * 10; });
          }
        }

        // Bullet-Enemy collision
        bullets.forEach((b) => {
          enemies.forEach((e) => {
            if (e.alive && b.x >= e.x && b.x <= e.x + e.w && b.y >= e.y && b.y <= e.y + e.h) {
              e.alive = false;
              b.y = -100;
              localScore += 25;
              setScore(localScore);
            }
          });
        });

        // Draw Player Cannon (Doge spaceship)
        ctx.fillStyle = '#f6a821';
        ctx.beginPath();
        ctx.moveTo(playerX, playerY - 16);
        ctx.lineTo(playerX - 18, playerY + 14);
        ctx.lineTo(playerX + 18, playerY + 14);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(playerX, playerY + 2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw bullets (Laser bones)
        ctx.fillStyle = '#00ffcc';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 6;
        bullets.forEach((b) => {
          ctx.fillRect(b.x - 2, b.y, 4, 10);
        });
        ctx.shadowBlur = 0;

        // Draw alien invaders
        enemies.forEach((e) => {
          if (e.alive) {
            ctx.fillStyle = e.type === 0 ? '#ff3366' : e.type === 1 ? '#ff9900' : '#33ccff';
            ctx.fillRect(e.x, e.y, e.w, e.h);
            // Alien eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(e.x + 6, e.y + 6, 4, 4);
            ctx.fillRect(e.x + e.w - 10, e.y + 6, 4, 4);
          }
        });
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [game]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#07090e]">
      {/* Top HUD */}
      <div className="absolute top-2 left-4 right-4 flex items-center justify-between text-xs font-arcade text-[#f6a821] z-30 pointer-events-none drop-shadow">
        <span>SCORE: {score}</span>
        <span className="text-white/80">CREDIT: 01 (PAID 25 Ð)</span>
        <span>LIVES: {'❤'.repeat(Math.max(0, lives))}</span>
      </div>

      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="max-w-full max-h-full object-contain rounded border border-yellow-500/20 shadow-2xl"
      />

      {isGameOver && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center p-6 z-40">
          <h3 className="text-2xl font-arcade text-red-500 mb-4 animate-arcade-blink">GAME OVER</h3>
          <p className="font-arcade text-sm text-[#f6a821] mb-6">FINAL SCORE: {score} POINTS</p>
          <button
            onClick={() => {
              setIsGameOver(false);
              setLives(3);
              setScore(0);
            }}
            className="px-6 py-3 bg-[#f6a821] hover:bg-[#e59510] text-black font-arcade text-xs rounded transition-transform active:scale-95 shadow-lg"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Control hints */}
      <div className="absolute bottom-2 text-[10px] font-retro text-zinc-500 tracking-wider">
        CONTROLS: {game.controls}
      </div>
    </div>
  );
};
