import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { sounds } from '../SoundManager';

interface FlappyWorkProps {
  salaryMultiplier: number;
  currentJobTitle: string;
  onExit: (score: number) => void;
}

export const FlappyWork: React.FC<FlappyWorkProps> = ({ salaryMultiplier, currentJobTitle, onExit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  // Tick state to force React to re-render
  const [, setTick] = useState(0);

  // Game refs (Mutable state for physics)
  const birdPos = useRef(200);
  const birdVelocity = useRef(0);
  const pipes = useRef<{x: number, gapTop: number}[]>([]);
  const requestRef = useRef<number>();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameOverRef = useRef(false);
  
  // Time management for 60FPS lock
  const lastTimeRef = useRef<number>(0);
  const TARGET_FPS = 60;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  const GRAVITY = 0.6;
  const JUMP = -8.5;
  const PIPE_SPEED = 3.5;
  const PIPE_SPACING = 220; 
  const GAP_SIZE = 140; 
  
  // Logical dimensions for physics consistency
  const GAME_HEIGHT = 500;
  const GAME_WIDTH = 400;

  const resetGame = () => {
    sounds.play('click');
    birdPos.current = 200;
    birdVelocity.current = 0;
    pipes.current = [];
    setScore(0);
    setGameOver(false);
    gameOverRef.current = false;
    setIsPlaying(true);
    setTick(0);
    lastTimeRef.current = performance.now();
  };

  const jump = useCallback(() => {
    if (!isPlaying || gameOverRef.current) return;
    birdVelocity.current = JUMP;
    sounds.play('jump');
  }, [isPlaying]);

  const gameLoop = useCallback((timestamp: number) => {
    if (gameOverRef.current) return;

    requestRef.current = requestAnimationFrame(gameLoop);

    const elapsed = timestamp - lastTimeRef.current;

    if (elapsed > FRAME_INTERVAL) {
        lastTimeRef.current = timestamp - (elapsed % FRAME_INTERVAL);

        // --- Physics Logic (Runs at 60Hz) ---
        birdVelocity.current += GRAVITY;
        birdPos.current += birdVelocity.current;

        // --- Boundaries ---
        if (birdPos.current > GAME_HEIGHT - 35 || birdPos.current < 0) {
            gameOverRef.current = true;
            setGameOver(true);
            setIsPlaying(false);
            sounds.play('crash');
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            return; 
        }

        // --- Pipe Logic ---
        const lastPipe = pipes.current[pipes.current.length - 1];
        if (!lastPipe || (GAME_WIDTH - lastPipe.x >= PIPE_SPACING)) {
            const minPipeHeight = 50;
            const maxPipeHeight = GAME_HEIGHT - GAP_SIZE - minPipeHeight;
            const randomY = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
            
            pipes.current.push({
                x: GAME_WIDTH,
                gapTop: randomY
            });
        }

        // Move pipes
        pipes.current.forEach(pipe => {
            pipe.x -= PIPE_SPEED;
        });

        // Remove off-screen pipes
        if (pipes.current.length > 0 && pipes.current[0].x < -60) {
            pipes.current.shift();
            setScore(s => {
                if ((s + 1) % 5 === 0) sounds.play('pop');
                return s + 1;
            });
        }

        // --- Collision Detection ---
        const birdRect = { 
            left: 50 + 5,   
            right: 80 - 5,  
            top: birdPos.current + 5, 
            bottom: birdPos.current + 30 - 5 
        };
        
        for (const pipe of pipes.current) {
            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + 50; 
            
            if (birdRect.right > pipeLeft && birdRect.left < pipeRight) {
                if (birdRect.top < pipe.gapTop || birdRect.bottom > pipe.gapTop + GAP_SIZE) {
                    gameOverRef.current = true;
                    setGameOver(true);
                    setIsPlaying(false);
                    sounds.play('crash');
                    if (requestRef.current) cancelAnimationFrame(requestRef.current);
                    return;
                }
            }
        }

        setTick(t => t + 1);
    }
  }, [isPlaying, FRAME_INTERVAL]); 

  useEffect(() => {
    if (isPlaying && !gameOver) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, gameOver, gameLoop]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); 
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  // --- RENDER HELPERS (Percent Conversion) ---
  const toPctX = (val: number) => `${(val / GAME_WIDTH) * 100}%`;
  const toPctY = (val: number) => `${(val / GAME_HEIGHT) * 100}%`;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-sky-300 relative overflow-hidden select-none font-mono touch-none">
      {/* Background Decor */}
      <div className="absolute bottom-0 w-full h-[8%] bg-green-500 border-t-4 border-green-700 z-10"></div>
      <div className="absolute bottom-10 left-10 text-6xl opacity-30 animate-pulse">☁️</div>
      <div className="absolute top-10 right-20 text-5xl opacity-30 animate-pulse delay-700">☁️</div>

      {/* Game Area - Full Size Responsive */}
      <div 
        ref={gameContainerRef}
        className="relative w-full h-full bg-sky-200 border-4 border-slate-700 overflow-hidden shadow-2xl cursor-pointer"
        onMouseDown={(e) => { e.preventDefault(); jump(); }}
        onTouchStart={(e) => { e.preventDefault(); jump(); }}
      >
        {/* Start Screen */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 text-white backdrop-blur-sm">
            <h2 className="text-3xl font-bold mb-2 text-yellow-300 drop-shadow-md">Work Mode</h2>
            <p className="mb-4 text-center px-4">Role: <span className="text-yellow-200">{currentJobTitle}</span></p>
            <p className="text-sm mb-6 opacity-90 bg-black/30 px-3 py-1 rounded">Press Space or Tap to Fly</p>
            <button 
              onClick={(e) => { e.stopPropagation(); resetGame(); }}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-bold transition-transform active:scale-95 shadow-lg border-b-4 border-green-700"
            >
              <Play size={24} fill="currentColor" /> START SHIFT
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onExit(0); }} 
              className="mt-6 text-white hover:text-red-300 hover:underline text-sm"
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-slate-900/90 text-white backdrop-blur-md">
            <h2 className="text-4xl font-bold text-red-400 mb-2">SHIFT ENDED</h2>
            
            <div className="bg-slate-800 p-6 rounded-xl border-2 border-slate-600 text-center mb-6 w-64 shadow-xl">
              <div className="mb-4">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Performance</p>
                <p className="text-5xl font-mono text-yellow-400 drop-shadow-lg">{score}</p>
              </div>
              <div className="h-px bg-slate-600 w-full mb-4"></div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Earned</p>
                <p className="text-3xl font-mono text-green-400 flex items-center justify-center gap-1">
                  <span className="text-xl">$</span>{score * salaryMultiplier}
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); resetGame(); }}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-bold border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all"
              >
                <RotateCcw size={18} /> RETRY
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onExit(score); }}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-bold border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all"
              >
                CASH OUT
              </button>
            </div>
          </div>
        )}

        {/* Bird */}
        <div 
          className="absolute bg-yellow-400 rounded-full border-2 border-black z-20 flex items-center justify-center shadow-sm"
          style={{ 
            top: toPctY(birdPos.current), 
            left: toPctX(50),
            width: '30px', 
            height: '30px',
            transform: `rotate(${Math.min(Math.max(birdVelocity.current * 4, -25), 25)}deg)`,
            transition: 'transform 0.1s ease-out' 
          }}
        >
          {/* Eye */}
          <div className="absolute right-[6px] top-[6px] w-3 h-3 bg-white rounded-full border border-black/20">
            <div className="absolute right-[1px] top-[2px] w-1.5 h-1.5 bg-black rounded-full"></div>
          </div>
          {/* Beak */}
          <div className="absolute -right-2 top-4 w-3 h-2 bg-orange-500 rounded-full border border-black/20"></div>
          {/* Wing */}
          <div className="absolute left-[-2px] top-[14px] w-4 h-3 bg-white/40 rounded-full"></div>
        </div>

        {/* Pipes */}
        {pipes.current.map((pipe, i) => (
          <React.Fragment key={i}>
            {/* Top Pipe */}
            <div 
              className="absolute bg-green-600 border-x-4 border-green-800"
              style={{ left: toPctX(pipe.x), top: 0, height: toPctY(pipe.gapTop), width: '50px' }}
            >
              {/* Pipe Cap */}
              <div className="absolute bottom-0 w-[58px] -left-[4px] h-8 bg-green-600 border-4 border-green-800 rounded-sm"></div>
              {/* Highlight */}
              <div className="absolute top-0 right-2 w-2 h-full bg-green-500/30"></div>
            </div>
            
            {/* Bottom Pipe */}
            <div 
              className="absolute bg-green-600 border-x-4 border-green-800"
              style={{ left: toPctX(pipe.x), top: toPctY(pipe.gapTop + GAP_SIZE), bottom: 0, width: '50px' }}
            >
              {/* Pipe Cap */}
              <div className="absolute top-0 w-[58px] -left-[4px] h-8 bg-green-600 border-4 border-green-800 rounded-sm"></div>
              {/* Highlight */}
              <div className="absolute top-0 right-2 w-2 h-full bg-green-500/30"></div>
            </div>
          </React.Fragment>
        ))}
        
        {/* Live Score */}
        {isPlaying && (
          <div className="absolute top-8 w-full text-center z-20 pointer-events-none">
             <span className="text-5xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] stroke-black tracking-widest">
               {score}
             </span>
          </div>
        )}
      </div>
    </div>
  );
};