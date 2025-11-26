
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PetRender } from './PetRender';
import { PetAppearance } from '../types';
import { Heart, Bomb, Trophy, X } from 'lucide-react';
import { sounds } from '../SoundManager';

interface CatchGameProps {
  appearance: PetAppearance;
  age: number;
  onExit: (score: number) => void;
}

interface GameObject {
  id: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: 'heart' | 'bomb';
  caught: boolean;
}

export const CatchGame: React.FC<CatchGameProps> = ({ appearance, age, onExit }) => {
  // State for rendering
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
  const [petX, setPetX] = useState(50); // For rendering

  // Refs for Game Logic (Sources of Truth to avoid stale closures)
  const petXRef = useRef(50);
  const scoreRef = useRef(0);
  const gameStateRef = useRef<'playing' | 'gameover'>('playing');
  
  // Game Loop Refs
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const objectsRef = useRef<GameObject[]>([]);
  const spawnTimerRef = useRef<number>(0);
  
  // Force render trigger
  const [, setTick] = useState(0);

  const GAME_SPEED = 0.6; // Vertical speed factor

  // Sync refs when state changes externally (initialization mostly)
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Initial Countdown
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('gameover');
          gameStateRef.current = 'gameover'; // Sync ref immediately
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  // Movement Logic
  const movePet = useCallback((direction: 'left' | 'right') => {
    if (gameStateRef.current !== 'playing') return;
    
    setPetX((prev) => {
      const newVal = direction === 'left' ? Math.max(15, prev - 20) : Math.min(85, prev + 20);
      petXRef.current = newVal; // Sync Ref immediately for collision logic
      return newVal;
    });
  }, []);

  // Main Loop
  const gameLoop = useCallback((timestamp: number) => {
    if (gameStateRef.current !== 'playing') return;
    
    // Initialize lastTimeRef on first frame
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;

    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // 1. Spawn Objects (every ~700ms)
    spawnTimerRef.current += deltaTime;
    if (spawnTimerRef.current > 700) {
      spawnTimerRef.current = 0;
      objectsRef.current.push({
        id: Math.random(),
        x: Math.random() * 70 + 15, // Keep mostly within playable bounds (15-85)
        y: -10,
        type: Math.random() > 0.3 ? 'heart' : 'bomb', // 70% hearts
        caught: false
      });
    }

    // 2. Move Objects
    objectsRef.current.forEach(obj => {
      obj.y += GAME_SPEED * (deltaTime / 16); 
    });

    // 3. Collision Detection
    // Pet hitbox based on CURRENT Ref position
    const currentPetX = petXRef.current;
    const petHitbox = { 
        l: currentPetX - 15, 
        r: currentPetX + 15, 
        t: 75, // Top of pet head (approx)
        b: 100 // Bottom of screen
    };
    
    objectsRef.current.forEach(obj => {
      if (obj.caught) return;

      // Check vertical intersection
      if (obj.y > petHitbox.t && obj.y < petHitbox.b) {
        // Check horizontal intersection
        if (obj.x > petHitbox.l && obj.x < petHitbox.r) {
          obj.caught = true;
          
          if (obj.type === 'heart') {
            scoreRef.current += 10;
            setScore(scoreRef.current);
            sounds.play('coin');
          } else {
            scoreRef.current = Math.max(0, scoreRef.current - 20);
            setScore(scoreRef.current);
            sounds.play('crash');
          }
        }
      }
    });

    // 4. Cleanup (Remove objects off screen)
    objectsRef.current = objectsRef.current.filter(obj => obj.y < 120 && !obj.caught);

    setTick(t => t + 1); // Force render update
    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameLoop, gameState]);

  return (
    <div className="relative w-full h-full bg-pink-100 overflow-hidden select-none">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
         <div className="absolute top-10 left-10 text-pink-300 animate-pulse">❤️</div>
         <div className="absolute top-40 right-20 text-pink-300 animate-pulse delay-75">❤️</div>
         <div className="absolute bottom-20 left-1/2 text-pink-300 animate-pulse delay-150">❤️</div>
      </div>

      {/* UI Layer */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-30">
        <div className="bg-white/80 backdrop-blur px-3 py-1 rounded-full font-bold text-pink-600 border-2 border-pink-200 shadow-sm flex items-center gap-2">
           <Heart size={16} fill="currentColor" /> {score}
        </div>
        
        <div className="flex gap-2">
            <div className="bg-white/80 backdrop-blur px-3 py-1 rounded-full font-bold text-slate-600 border-2 border-slate-200 shadow-sm">
            {timeLeft}s
            </div>
            <button 
                onClick={() => onExit(score)}
                className="bg-white/80 backdrop-blur p-1 rounded-full text-slate-400 border-2 border-slate-200 hover:text-red-500 hover:border-red-200"
            >
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Game Over Overlay */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <Trophy size={48} className="text-yellow-400 mb-2" />
          <h2 className="text-4xl font-bold mb-2">TIME UP!</h2>
          <p className="text-xl mb-6">Score: {score}</p>
          <button 
            onClick={() => onExit(score)}
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition active:scale-95 border-b-4 border-pink-700"
          >
            Collect Happiness
          </button>
        </div>
      )}

      {/* Game Area */}
      {/* Falling Objects */}
      {objectsRef.current.map(obj => (
        <div 
          key={obj.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-none will-change-transform"
          style={{ 
            left: `${obj.x}%`, 
            top: `${obj.y}%`,
          }}
        >
          {obj.type === 'heart' ? (
            <Heart fill="#ec4899" className="text-pink-500 w-8 h-8 drop-shadow-md" />
          ) : (
            <Bomb fill="#1e293b" className="text-slate-800 w-8 h-8 drop-shadow-md animate-pulse" />
          )}
        </div>
      ))}

      {/* Player Character */}
      <div 
        className="absolute bottom-4 transform -translate-x-1/2 transition-all duration-200 ease-out z-20 will-change-transform"
        style={{ left: `${petX}%`, width: '30%' }}
      >
        <PetRender 
           appearance={appearance} 
           age={age} 
           mood={score > 50 ? 'excited' : 'happy'} 
           className="w-full"
        />
        {/* Shadow */}
        <div className="w-2/3 h-4 bg-black/10 rounded-[100%] absolute bottom-2 left-1/2 -translate-x-1/2 blur-sm -z-10" />
      </div>

      {/* Touch Controls (Invisible Overlay) */}
      <div className="absolute inset-0 z-10 flex">
        {/* Left Control */}
        <div 
            className="w-1/2 h-full active:bg-white/10 transition-colors" 
            onPointerDown={() => movePet('left')} 
        />
        {/* Right Control */}
        <div 
            className="w-1/2 h-full active:bg-white/10 transition-colors" 
            onPointerDown={() => movePet('right')} 
        />
      </div>
      
      <div className="absolute bottom-2 w-full text-center text-pink-400/50 text-xs font-bold pointer-events-none">
        TAP LEFT / RIGHT TO MOVE
      </div>
    </div>
  );
};
