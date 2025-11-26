
import React, { useEffect, useState, useId } from 'react';
import { PetAppearance } from '../types';
import { MAX_GROWTH_AGE } from '../constants';

interface PetRenderProps {
  appearance: PetAppearance;
  mood: 'happy' | 'sad' | 'neutral' | 'dead' | 'excited';
  age?: number;
  isDirty?: boolean;
  hasPoop?: boolean;
  isHungry?: boolean;
  isPooping?: boolean; // Active state of pooping
  isEating?: boolean; // Active state of eating
  mouthOpen?: boolean; // New prop for feeding animation
  disableJump?: boolean; // New prop to stop idle bouncing
  className?: string;
}

export const PetRender: React.FC<PetRenderProps> = ({ 
  appearance, 
  mood, 
  age = 0, 
  isDirty, 
  hasPoop,
  isHungry,
  isPooping,
  isEating,
  mouthOpen = false,
  disableJump = false,
  className 
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const clipId = useId(); // Unique ID for the clipPath to avoid conflicts

  // Blinking Logic
  useEffect(() => {
    if (mood === 'dead' || isPooping || isEating) return;

    const scheduleBlink = () => {
      const delay = Math.random() * 3000 + 2000; // Blink every 2-5 seconds
      return setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          timer = scheduleBlink(); // Schedule next blink
        }, 150); // Blink duration
      }, delay);
    };

    let timer = scheduleBlink();
    return () => clearTimeout(timer);
  }, [mood, isPooping, isEating]);

  // Animation class logic
  // Default to bouncing unless disableJump is true
  let animationClass = disableJump ? '' : 'animate-[bounce_3s_infinite]';
  
  if (mood === 'dead') animationClass = 'grayscale opacity-50';
  else if (mood === 'excited') animationClass = 'animate-[bounce_1s_infinite]';
  
  if (isPooping) animationClass = 'translate-y-4 scale-y-90 scale-x-105'; // Squatting
  
  // STOP jumping when eating. 
  // If mouth is closed but still eating, we are chewing (add slight squash/stretch)
  if (isEating) {
    if (mouthOpen) {
      animationClass = 'transform-none'; // Static while waiting for food
    } else {
      animationClass = 'animate-[pulse_0.5s_infinite]'; // Chewing motion
    }
  }

  // Calculate Growth Scale (0.6 for baby, 1.0 for adult)
  const growthStage = Math.min(age, MAX_GROWTH_AGE) / MAX_GROWTH_AGE;
  const scale = 0.6 + (0.4 * growthStage);

  // --- HELPER: Arm Color based on Outfit ---
  const getArmColor = () => {
    switch (appearance.outfit) {
      case 'bc2': return '#3b82f6'; // Blue T-Shirt
      case 'gc_tshirt': return '#ec4899'; // Pink T-Shirt
      case 'bc_stripe': 
      case 'gc_stripe': return '#ef4444'; // Red (Striped Shirt Sleeve main color)
      case 'bc5': return 'white'; // Shirt/Tie
      case 'gc2': return '#ec4899'; // Dress sleeves
      default: return appearance.color; // Skin color
    }
  };
  const armColor = getArmColor();
  const hasSleeves = armColor !== appearance.color;

  // --- RENDER HELPERS ---
  const renderEyes = () => {
    // Eye Y base = 85
    const eyeY = 85; 

    if (mood === 'dead') {
      return (
         <g stroke="black" strokeWidth="4">
           <line x1="70" y1={eyeY-10} x2="90" y2={eyeY+10} />
           <line x1="90" y1={eyeY-10} x2="70" y2={eyeY+10} />
           <line x1="110" y1={eyeY-10} x2="130" y2={eyeY+10} />
           <line x1="130" y1={eyeY-10} x2="110" y2={eyeY+10} />
         </g>
      );
    }

    if (isEating) {
       // Happy eyes when eating
       return (
        <g fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round">
           <path d={`M 70 ${eyeY} Q 80 ${eyeY-10} 90 ${eyeY}`} />
           <path d={`M 110 ${eyeY} Q 120 ${eyeY-10} 130 ${eyeY}`} />
        </g>
       );
    }

    if (isPooping) {
      return (
        <g stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none">
           <path d={`M 70 ${eyeY-5} L 80 ${eyeY+5} L 70 ${eyeY+15}`} />
           <path d={`M 130 ${eyeY-5} L 120 ${eyeY+5} L 130 ${eyeY+15}`} />
        </g>
      );
    }

    if (isHungry && mood !== 'excited') {
       return (
         <g stroke="#1e293b" strokeWidth="3" fill="none">
            <circle cx="80" cy={eyeY} r="10" />
            <circle cx="80" cy={eyeY} r="4" />
            <circle cx="120" cy={eyeY} r="10" />
            <circle cx="120" cy={eyeY} r="4" />
         </g>
       );
    }

    if (mood === 'excited' && !isBlinking) {
      return (
        <g fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round">
           <path d={`M 70 ${eyeY} Q 80 ${eyeY-10} 90 ${eyeY}`} />
           <path d={`M 110 ${eyeY} Q 120 ${eyeY-10} 130 ${eyeY}`} />
        </g>
      );
    }

    if (isBlinking) {
       return (
        <g fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round">
          <line x1="72" y1={eyeY} x2="88" y2={eyeY} />
          <line x1="112" y1={eyeY} x2="128" y2={eyeY} />
        </g>
       );
    }

    return (
      <g fill="#1e293b">
        <ellipse cx="80" cy={eyeY} rx="7" ry="10" />
        <ellipse cx="120" cy={eyeY} rx="7" ry="10" />
        <circle cx="82" cy={eyeY-3} r="3" fill="white" />
        <circle cx="122" cy={eyeY-3} r="3" fill="white" />
      </g>
    );
  };

  const renderMouth = () => {
    const mouthY = 105;

    if (mouthOpen) {
      return <circle cx="100" cy={mouthY} r="12" fill="#374151" />;
    }
    
    // Chewing look
    if (isEating && !mouthOpen) {
       return <ellipse cx="100" cy={mouthY} rx="10" ry="5" fill="#374151" />;
    }

    if (isPooping) {
      return <path d={`M 85 ${mouthY+5} Q 100 ${mouthY-5} 115 ${mouthY+5}`} stroke="#1e293b" strokeWidth="3" fill="none" />;
    }

    if (isHungry && mood !== 'excited') {
      return (
        <g>
          <circle cx="100" cy={mouthY} r="5" fill="#7f1d1d" />
          <path d={`M 100 ${mouthY+5} Q 102 ${mouthY+12} 106 ${mouthY+9}`} stroke="#3b82f6" strokeWidth="2" fill="none" />
        </g>
      );
    }

    if (mood === 'excited') {
       return <path d={`M 85 ${mouthY-5} Q 100 ${mouthY+15} 115 ${mouthY-5} Z`} fill="#374151" />;
    }

    if ((isDirty || hasPoop) && mood !== 'happy') {
      return <path d={`M 85 ${mouthY} Q 92 ${mouthY-10} 100 ${mouthY} T 115 ${mouthY}`} stroke="#1e293b" strokeWidth="3" fill="none" />;
    }

    return (
      <g fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round">
        {mood === 'happy' && <path d={`M 85 ${mouthY-5} Q 100 ${mouthY+10} 115 ${mouthY-5}`} />}
        {(mood === 'sad') && <path d={`M 85 ${mouthY+5} Q 100 ${mouthY-10} 115 ${mouthY+5}`} />}
        {mood === 'neutral' && <line x1="90" y1={mouthY} x2="110" y2={mouthY} />}
      </g>
    );
  };

  // --- CLOTHING RENDERERS ---
  const renderOutfit = () => {
    if (!appearance.outfit) return null;

    // WAISTLINE is approx Y=155. Shirts should stop there.

    switch (appearance.outfit) {
      // Boy Clothes (Basic T-Shirt) - SOLID BLUE
      case 'bc2': 
        return (
          <g>
            {/* Sleeves - Adjusted to overlap with rounded shoulders */}
            <path d="M 70 115 Q 40 120 35 135 L 50 145 Q 60 135 70 135 Z" fill="#3b82f6" stroke="#2563eb" strokeWidth="1"/>
            <path d="M 130 115 Q 160 120 165 135 L 150 145 Q 140 135 130 135 Z" fill="#3b82f6" stroke="#2563eb" strokeWidth="1"/>
            
            {/* Main Shirt Body - Clipped to Body Shape for perfect fit */}
            <g clipPath={`url(#${clipId})`}>
               <rect x="50" y="100" width="100" height="60" fill="#3b82f6" />
               {/* Neckline */}
               <path d="M 80 120 Q 100 135 120 120" stroke="#2563eb" strokeWidth="2" fill="none" />
               {/* Bottom Hem Shadow */}
               <path d="M 50 155 Q 100 165 150 155" stroke="#1d4ed8" strokeWidth="2" fill="none" opacity="0.3"/>
            </g>
          </g>
        );
      
      // Girl Clothes (Pink Basic T-Shirt)
      case 'gc_tshirt':
        return (
          <g>
             {/* Sleeves */}
            <path d="M 70 115 Q 40 120 35 135 L 50 145 Q 60 135 70 135 Z" fill="#ec4899" stroke="#db2777" strokeWidth="1" />
            <path d="M 130 115 Q 160 120 165 135 L 150 145 Q 140 135 130 135 Z" fill="#ec4899" stroke="#db2777" strokeWidth="1" />
            
            {/* Main Shirt Body */}
            <g clipPath={`url(#${clipId})`}>
               <rect x="50" y="100" width="100" height="60" fill="#ec4899" />
               <path d="M 80 120 Q 100 135 120 120" stroke="#db2777" strokeWidth="2" fill="none" />
               <path d="M 50 155 Q 100 165 150 155" stroke="#be185d" strokeWidth="2" fill="none" opacity="0.3"/>
            </g>
          </g>
        );

      // RED & WHITE STRIPED SHIRT (Unisex style)
      case 'bc_stripe':
      case 'gc_stripe':
        const stripes = (
          <g>
            <rect x="50" y="100" width="100" height="10" fill="#ef4444" />
            <rect x="50" y="120" width="100" height="10" fill="#ef4444" />
            <rect x="50" y="140" width="100" height="10" fill="#ef4444" />
            {/* Sleeves detail */}
            <line x1="35" y1="125" x2="70" y2="125" stroke="#ef4444" strokeWidth="3" />
            <line x1="35" y1="135" x2="70" y2="135" stroke="#ef4444" strokeWidth="3" />
            <line x1="130" y1="125" x2="165" y2="125" stroke="#ef4444" strokeWidth="3" />
            <line x1="130" y1="135" x2="165" y2="135" stroke="#ef4444" strokeWidth="3" />
          </g>
        );
        return (
          <g>
             {/* Sleeves (White base) */}
            <path d="M 70 115 Q 40 120 35 135 L 50 145 Q 60 135 70 135 Z" fill="white" stroke="#d1d5db" strokeWidth="1" />
            <path d="M 130 115 Q 160 120 165 135 L 150 145 Q 140 135 130 135 Z" fill="white" stroke="#d1d5db" strokeWidth="1" />
            
            {/* Main Shirt Body (White base) */}
            <g clipPath={`url(#${clipId})`}>
               <rect x="50" y="100" width="100" height="60" fill="white" />
               {stripes}
               {/* Neckline */}
               <path d="M 80 120 Q 100 135 120 120" stroke="#ef4444" strokeWidth="2" fill="none" />
               <path d="M 50 155 Q 100 165 150 155" stroke="#991b1b" strokeWidth="2" fill="none" opacity="0.3"/>
            </g>
          </g>
        );
        
      case 'bc5': // Tie & Shirt
        return (
          <g>
             {/* Sleeves */}
             <path d="M 70 115 Q 40 120 35 135 L 50 145 Q 60 135 70 135 Z" fill="white" />
             <path d="M 130 115 Q 160 120 165 135 L 150 145 Q 140 135 130 135 Z" fill="white" />
             
             {/* Main Shirt Body - Clipped */}
             <g clipPath={`url(#${clipId})`}>
                <rect x="50" y="100" width="100" height="60" fill="white" />
             </g>

             {/* Tie (Overlay on top of shirt) */}
             <path d="M 100 120 L 92 155 L 100 165 L 108 155 Z" fill="#dc2626" />
             <path d="M 95 120 L 105 120 L 103 130 L 97 130 Z" fill="#b91c1c" />
          </g>
        );

      case 'gc2': // Dress (Full Body - Override waist)
        return (
          <g>
            {/* Puffy Sleeves */}
            <circle cx="65" cy="125" r="14" fill="#ec4899" />
            <circle cx="135" cy="125" r="14" fill="#ec4899" />
            
            {/* Bodice - Clipped for fit */}
            <g clipPath={`url(#${clipId})`}>
                <rect x="50" y="100" width="100" height="60" fill="#db2777" />
            </g>

            {/* Skirt (Flared out, sitting on top of legs) */}
            <path d="M 60 150 L 40 185 Q 100 200 160 185 L 140 150 Z" fill="#ec4899" />
            {/* Hem Detail */}
            <path d="M 40 185 Q 100 200 160 185" stroke="#be185d" strokeWidth="2" fill="none" />
            {/* Belt/Waist */}
            <path d="M 60 150 L 140 150" stroke="#831843" strokeWidth="3" />
          </g>
        );
      
      // Accessory as body (Scarf)
      case 'ac3': // Scarf
         return (
           <g filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.3))">
             <path d="M 70 125 Q 100 145 130 125" stroke="#ef4444" strokeWidth="18" strokeLinecap="round" fill="none" />
             <path d="M 120 125 L 120 165" stroke="#ef4444" strokeWidth="14" strokeLinecap="round" />
             <path d="M 120 160 L 115 170" stroke="#b91c1c" strokeWidth="2" />
             <path d="M 125 160 L 125 170" stroke="#b91c1c" strokeWidth="2" />
           </g>
         );

      default:
         return null;
    }
  };

  const renderPants = () => {
     if (!appearance.pants) return null;
     
     let color = '#3b82f6';
     let stroke = '#1d4ed8';

     if (appearance.pants === 'bc_jeans') {
        color = '#3b82f6'; // Blue Jeans
        stroke = '#1d4ed8';
     } else if (appearance.pants === 'gc_jeans') {
        color = '#a855f7'; // Purple Pants
        stroke = '#7e22ce';
     }

     return (
        <g clipPath={`url(#${clipId})`}>
           {/* Pants Body - covering bottom half of the capsule from waist down */}
           <rect x="50" y="150" width="100" height="50" fill={color} />
           
           {/* Waistline detail (curved slightly to match shirt hem) */}
           <path d="M 50 150 Q 100 160 150 150" stroke={stroke} strokeWidth="2" fill="none" opacity="0.3"/>
           
           {/* Center seam (zipper/fly area) */}
           <line x1="100" y1="150" x2="100" y2="190" stroke={stroke} strokeWidth="1" opacity="0.3" />
        </g>
     );
  };

  const renderShoes = () => {
    if (appearance.shoes === 'bc4' || appearance.shoes === 'sneakers') {
         return (
          <g>
            {/* Left Shoe */}
            <path d="M 65 185 Q 60 200 80 200 Q 95 200 95 185 Z" fill="#ef4444" />
            <path d="M 65 190 L 85 190" stroke="white" strokeWidth="2" />
            {/* Right Shoe */}
            <path d="M 105 185 Q 105 200 120 200 Q 140 200 135 185 Z" fill="#ef4444" />
            <path d="M 115 190 L 135 190" stroke="white" strokeWidth="2" />
          </g>
        );
    }
    return null;
  }

  const renderHat = () => {
    if (!appearance.hat) return null;
    switch(appearance.hat) {
      case 'bc1': // Legacy Blue Cap
      case 'ac_cap': // New Cap Accessory
        return (
          <g filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.3))">
            {/* Crown of the cap: Structured dome */}
            <path 
                d="M 65 72 Q 65 38 100 38 Q 135 38 135 72 Z" 
                fill="#2563eb" 
            />
            {/* Front seam detail to make it look constructed */}
            <path d="M 100 38 L 100 72" stroke="#1e40af" strokeWidth="1" opacity="0.5"/>

            {/* Button on top */}
            <circle cx="100" cy="38" r="3" fill="#1e3a8a" />
            
            {/* Visor/Brim - Distinct crescent shape protruding forward */}
            <path 
                d="M 60 70 Q 100 95 140 70 Q 100 80 60 70 Z" 
                fill="#1e3a8a" 
                stroke="#172554"
                strokeWidth="0.5"
            />
          </g>
        );
      case 'bc7': // Headphones
        return (
           <g>
             <path d="M 50 90 A 50 50 0 0 1 150 90" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
             <rect x="40" y="80" width="20" height="35" rx="6" fill="#475569" stroke="#1e293b" strokeWidth="2" />
             <rect x="140" y="80" width="20" height="35" rx="6" fill="#475569" stroke="#1e293b" strokeWidth="2" />
           </g>
        );
      case 'gc1': // Pink Bow
        return (
          <g transform="translate(100, 55)">
            <path d="M 0 0 L -20 -10 L -20 10 Z" fill="#ec4899" />
            <path d="M 0 0 L 20 -10 L 20 10 Z" fill="#ec4899" />
            <circle cx="0" cy="0" r="5" fill="#db2777" />
          </g>
        );
      case 'gc3': // Crown
        return (
          <g transform="translate(0, 10)">
             <path d="M 70 60 L 70 40 L 85 55 L 100 30 L 115 55 L 130 40 L 130 60 Q 100 65 70 60 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
             <circle cx="70" cy="40" r="3" fill="#ef4444" />
             <circle cx="100" cy="30" r="3" fill="#3b82f6" />
             <circle cx="130" cy="40" r="3" fill="#ef4444" />
          </g>
        );
      case 'ac6': // Top Hat
        return (
          <g transform="translate(0, 10)">
             <ellipse cx="100" cy="80" rx="35" ry="10" fill="#1e293b" />
             <rect x="75" y="40" width="50" height="40" fill="#1e293b" />
             <rect x="75" y="70" width="50" height="5" fill="#ef4444" />
          </g>
        );
      case 'ac7': // Grad Cap
        return (
          <g transform="translate(0, 10)">
             <path d="M 100 40 L 140 60 L 100 80 L 60 60 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
             <path d="M 140 60 L 140 80 L 100 95 L 100 80 Z" fill="#1e293b" /> {/* Cap base */}
             <circle cx="100" cy="60" r="2" fill="#facc15" />
             <line x1="100" y1="60" x2="135" y2="75" stroke="#facc15" strokeWidth="2" />
             <circle cx="135" cy="75" r="3" fill="#facc15" />
          </g>
        );
      default:
        // Generic hat
        return <path d="M 70 60 L 130 60 L 100 30 Z" fill="#10b981" />;
    }
  };

  const renderAccessory = () => {
    if (!appearance.accessory) return null;
    switch(appearance.accessory) {
      case 'ac1': // Sunglasses
        return (
          <g transform="translate(0, 5)">
            <path d="M 65 80 Q 80 80 95 80 L 95 95 Q 80 100 65 95 Z" fill="#000" opacity="0.9" />
            <path d="M 105 80 Q 120 80 135 80 L 135 95 Q 120 100 105 95 Z" fill="#000" opacity="0.9" />
            <line x1="95" y1="85" x2="105" y2="85" stroke="#000" strokeWidth="3" />
            <line x1="65" y1="85" x2="55" y2="80" stroke="#000" strokeWidth="2" />
            <line x1="135" y1="85" x2="145" y2="80" stroke="#000" strokeWidth="2" />
          </g>
        );
      case 'ac2': // Glasses
        return (
          <g stroke="#1e293b" strokeWidth="3" fill="none" transform="translate(0, 5)">
             <circle cx="80" cy="90" r="14" fill="white" fillOpacity="0.3" />
             <circle cx="120" cy="90" r="14" fill="white" fillOpacity="0.3" />
             <line x1="94" y1="90" x2="106" y2="90" strokeWidth="2" />
             <line x1="66" y1="90" x2="55" y2="85" strokeWidth="2" />
             <line x1="134" y1="90" x2="145" y2="85" strokeWidth="2" />
          </g>
        );
      case 'ac4': // Mask
        return (
           <rect x="70" y="95" width="60" height="25" rx="8" fill="white" stroke="#94a3b8" strokeWidth="2" />
        );
      case 'gc7': // Lipstick
         return (
             <path d="M 90 110 Q 100 115 110 110 Q 100 120 90 110" fill="#be185d" />
         );
      case 'gc5': // Purse (Hand)
        return (
          <g>
            <rect x="150" y="150" width="24" height="18" rx="4" fill="#be185d" stroke="#831843" strokeWidth="2" />
            <path d="M 155 150 L 155 140 Q 162 135 169 140 L 169 150" stroke="#831843" strokeWidth="2" fill="none" />
          </g>
        );
      case 'ac5': // Ring (Hand)
        return (
           <circle cx="155" cy="140" r="4" fill="none" stroke="#facc15" strokeWidth="3" />
        );
      default:
        return null;
    }
  };

  const renderEffects = () => {
    return (
      <>
        {/* TEARS (Sad mood) - Adjusted for new head pos */}
        {mood === 'sad' && !isPooping && (
          <g fill="#60a5fa" opacity="0.8">
            <circle cx="75" cy="100" r="3">
              <animate attributeName="cy" values="100;120" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="125" cy="100" r="3">
              <animate attributeName="cy" values="100;120" dur="1s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="opacity" values="1;0" dur="1s" repeatCount="indefinite" begin="0.5s" />
            </circle>
          </g>
        )}

        {/* STINK LINES (Dirty or Poop) */}
        {(isDirty || hasPoop) && !isPooping && (
          <g stroke="#65a30d" strokeWidth="2" fill="none" opacity="0.7">
             <path d="M 40 90 Q 30 70 40 50">
               <animate attributeName="d" values="M 40 90 Q 30 70 40 50; M 40 80 Q 50 60 40 40; M 40 90 Q 30 70 40 50" dur="3s" repeatCount="indefinite" />
             </path>
             <path d="M 160 90 Q 170 70 160 50">
                <animate attributeName="d" values="M 160 90 Q 170 70 160 50; M 160 80 Q 150 60 160 40; M 160 90 Q 170 70 160 50" dur="3s" repeatCount="indefinite" begin="1.5s" />
             </path>
          </g>
        )}
      </>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`w-full h-full drop-shadow-xl transition-all duration-500 relative ${animationClass}`}
      >
        <svg viewBox="0 0 200 220" className="w-full h-full" shapeRendering="geometricPrecision">
          <defs>
             <clipPath id={clipId}>
                 {/* Body + Legs capsule shape. Adjusted rx to match new body definition (rx=45) */}
                <rect x="55" y="100" width="90" height="85" rx="45" />
             </clipPath>
          </defs>
          <g transform={`translate(100, 110) scale(${scale}) translate(-100, -110)`}>
            
            {/* --- BODY SHAPE --- */}
            
            {/* Arms (Behind Body) - Updated to match Outfit color */}
            {/* Left Arm */}
            <g transform="rotate(20 50 130)">
               <ellipse cx="50" cy="130" rx="10" ry="25" fill={armColor} />
               {hasSleeves && (
                 <circle cx="50" cy="155" r="8" fill={appearance.color} /> 
               )}
            </g>
            {/* Right Arm */}
            <g transform="rotate(-20 150 130)">
               <ellipse cx="150" cy="130" rx="10" ry="25" fill={armColor} />
               {hasSleeves && (
                 <circle cx="150" cy="155" r="8" fill={appearance.color} />
               )}
            </g>

            {/* Feet (Moved Down for Pants space) */}
            <ellipse cx="80" cy="190" rx="14" ry="10" fill={appearance.color} />
            <ellipse cx="120" cy="190" rx="14" ry="10" fill={appearance.color} />
            
            {/* Shoes Layer */}
            {renderShoes()}

            {/* Main Body (Long Capsule for Shirt + Pants) */}
            {/* From Neck (100) to Bottom (185) */}
            <rect 
              x="55" 
              y="100" 
              width="90" 
              height="85" 
              rx="45"
              fill={appearance.color} 
              className="transition-colors duration-500"
            />

            {/* Pants Layer (Bottom half of body) */}
            {renderPants()}
            
            {/* OUTFIT LAYER (Top half of body) */}
            {renderOutfit()}

            {/* Head (Sits on top) */}
            <circle 
              cx="100" 
              cy="90" 
              r="40" 
              fill={appearance.color} 
              className="transition-colors duration-500" 
            />

            {/* --- FACIAL FEATURES --- */}
            {renderEyes()}
            {renderMouth()}

            {/* Cheeks */}
            {(!isDirty && !hasPoop && !isHungry) && (
              <>
                <circle cx="70" cy="100" r="5" fill="#f472b6" opacity="0.6" />
                <circle cx="130" cy="100" r="5" fill="#f472b6" opacity="0.6" />
              </>
            )}
            
            {/* ACCESSORIES (Glasses, etc) */}
            {renderAccessory()}

            {/* HAT LAYER */}
            {renderHat()}

            {/* Dynamic Effects */}
            {renderEffects()}
          </g>
        </svg>
      </div>
      
      {/* Dirt Overlay for Hygiene (On Body) */}
      {isDirty && !isPooping && (
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-1/4 left-1/4 text-amber-800/60 text-2xl animate-pulse">🦠</div>
           <div className="absolute bottom-1/3 right-1/4 text-amber-800/40 text-lg">🦠</div>
        </div>
      )}

      {/* Poop on floor */}
      {hasPoop && !isPooping && (
        <div className="absolute bottom-4 right-6 text-4xl drop-shadow-md animate-[bounce_2s_infinite]">
          💩
        </div>
      )}
    </div>
  );
};
