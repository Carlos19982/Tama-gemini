import React, { useState, useEffect } from 'react';
import { ViewState, PetStats, PetAppearance, InventoryItem, ShopItem, ItemCategory } from './types';
import { JOBS, ALL_SHOP_ITEMS, MAX_STAT, DECAY_RATES, DECAY_TICK_RATE_MS, AGE_TICK_INCREMENT } from './constants';
import { PetRender } from './components/PetRender';
import { FlappyWork } from './components/FlappyWork';
import { ShowerGame } from './components/ShowerGame';
import { CatchGame } from './components/CatchGame';
import { ShoppingBag, Briefcase, Utensils, Bath, Home, Coins, Heart, Clock, Gamepad2, Shirt, Glasses, User } from 'lucide-react';
import { sounds } from './SoundManager';

const INITIAL_STATS: PetStats = {
  hunger: 80,
  hygiene: 80,
  happiness: 80,
  health: 100,
  money: 100, // Started with a bit more for shopping
  jobId: 0,
  highScore: 0,
  lastUpdate: Date.now(),
  age: 0,
  poops: 0
};

const INITIAL_APPEARANCE: PetAppearance = {
  color: '#facc15', // Yellow
};

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [stats, setStats] = useState<PetStats>(() => {
    const saved = localStorage.getItem('tamagotchi_stats');
    if (saved) {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_STATS, ...parsed };
    }
    return INITIAL_STATS;
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('tamagotchi_inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [appearance, setAppearance] = useState<PetAppearance>(() => {
    const saved = localStorage.getItem('tamagotchi_appearance');
    return saved ? JSON.parse(saved) : INITIAL_APPEARANCE;
  });

  const [notification, setNotification] = useState<string | null>(null);
  const [shopTab, setShopTab] = useState<ItemCategory>('FOOD');
  
  // Cheat State
  const [secretClicks, setSecretClicks] = useState<number[]>([]);

  // Animation States
  const [isPooping, setIsPooping] = useState(false);

  // Feeding Animation State
  const [feedingState, setFeedingState] = useState<{
    active: boolean;
    item: InventoryItem | null;
    phase: 'spawn' | 'moving' | 'chewing' | 'done';
  }>({ active: false, item: null, phase: 'done' });

  // Persistence
  useEffect(() => {
    localStorage.setItem('tamagotchi_stats', JSON.stringify(stats));
    localStorage.setItem('tamagotchi_inventory', JSON.stringify(inventory));
    localStorage.setItem('tamagotchi_appearance', JSON.stringify(appearance));
  }, [stats, inventory, appearance]);

  // Decay & Growth Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => {
        // Don't decay if playing a game
        if (view === ViewState.WORK || view === ViewState.SHOWER || view === ViewState.PLAY) return prev; 

        // Poop Logic: Random small chance per tick to poop
        const shouldPoop = !isPooping && prev.poops < 3 && Math.random() < 0.01; 

        if (shouldPoop) {
          setTimeout(() => handlePoopSequence(), 0); 
        }

        return {
          ...prev,
          hunger: Math.max(0, prev.hunger - DECAY_RATES.hunger),
          hygiene: Math.max(0, prev.hygiene - (prev.poops > 0 ? DECAY_RATES.hygiene * 3 : DECAY_RATES.hygiene)),
          happiness: Math.max(0, prev.happiness - (prev.poops > 0 ? DECAY_RATES.happiness * 2 : DECAY_RATES.happiness)),
          age: prev.age + AGE_TICK_INCREMENT, // Grow older slowly
          lastUpdate: Date.now()
        };
      });
    }, DECAY_TICK_RATE_MS);

    return () => clearInterval(interval);
  }, [view, isPooping]);

  // Helpers
  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePoopSequence = () => {
    setIsPooping(true);
    setView(ViewState.HOME); // Force look at pet
    sounds.play('loose');
    
    setTimeout(() => {
      setIsPooping(false);
      setStats(prev => ({
        ...prev,
        poops: prev.poops + 1,
        hygiene: Math.max(0, prev.hygiene - 20) 
      }));
      showNotif("Oops! 💩");
    }, 2000);
  };

  const getJob = (id: number) => JOBS.find(j => j.id === id) || JOBS[0];
  const currentJob = getJob(stats.jobId);

  // Helper to determine mood
  const getMood = () => {
    if (feedingState.phase === 'chewing' || feedingState.phase === 'done') return 'excited'; 
    if (stats.poops > 0 && stats.hygiene < 40) return 'sad'; 
    if (stats.happiness < 40) return 'sad';
    if (stats.happiness > 80) return 'excited';
    if (stats.happiness > 50) return 'happy';
    return 'neutral';
  };

  const changeView = (newView: ViewState) => {
    if (view !== newView) {
      sounds.play('click');
      setView(newView);
    }
  };

  // Actions
  const handleBuy = (item: ShopItem) => {
    if (stats.money >= item.cost) {
      sounds.play('coin');
      setStats(prev => ({ ...prev, money: prev.money - item.cost }));
      
      setInventory(prev => {
        const existing = prev.find(i => i.id === item.id);
        if (existing) {
          if (item.category !== 'FOOD') {
            showNotif(`You already have ${item.name}!`);
            return prev; // Don't buy duplicate clothes
          }
          return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        showNotif(`Bought ${item.name}!`);
        return [...prev, { ...item, quantity: 1 }];
      });
      
    } else {
      sounds.play('crash');
      showNotif("Not enough money!");
    }
  };

  const handleUseItem = (item: InventoryItem) => {
    if (item.category === 'FOOD') {
      triggerFeedingAnimation(item);
    } else {
      sounds.play('pop');
      const slot = item.slot;
      let currentEquippedId = '';

      if (slot === 'HAT') currentEquippedId = appearance.hat || '';
      if (slot === 'BODY') currentEquippedId = appearance.outfit || '';
      if (slot === 'FACE') currentEquippedId = appearance.accessory || '';
      if (slot === 'HAND') currentEquippedId = appearance.accessory || ''; 

      const isEquipped = currentEquippedId === item.id;

      if (isEquipped) {
        setAppearance(prev => ({
          ...prev,
          hat: slot === 'HAT' ? undefined : prev.hat,
          outfit: slot === 'BODY' ? undefined : prev.outfit,
          accessory: (slot === 'FACE' || slot === 'HAND') ? undefined : prev.accessory,
        }));
        showNotif(`Removed ${item.name}`);
      } else {
        setAppearance(prev => ({
          ...prev,
          hat: slot === 'HAT' ? item.id : prev.hat,
          outfit: slot === 'BODY' ? item.id : prev.outfit,
          accessory: (slot === 'FACE' || slot === 'HAND') ? item.id : prev.accessory,
        }));
        showNotif(`Equipped ${item.name}`);
      }
    }
  };

  const handleWorkComplete = (score: number) => {
    if (score > 0) sounds.play('coin');
    const moneyEarned = score * currentJob.baseSalary;
    
    let newJobId = stats.jobId;
    let newHighScore = Math.max(stats.highScore, score);
    
    const eligibleJob = [...JOBS].reverse().find(j => newHighScore >= j.requiredScore);
    if (eligibleJob && eligibleJob.id > newJobId) {
       newJobId = eligibleJob.id;
       sounds.play('success');
       showNotif(`Promoted to ${eligibleJob.title}!`);
    }

    setStats(prev => ({
      ...prev,
      money: prev.money + moneyEarned,
      jobId: newJobId,
      highScore: newHighScore,
      happiness: Math.max(0, prev.happiness - 10) 
    }));
    setView(ViewState.HOME);
  };

  const handleShowerComplete = () => {
    sounds.play('success');
    setStats(prev => ({
      ...prev,
      hygiene: MAX_STAT,
      poops: 0, 
      happiness: Math.min(MAX_STAT, prev.happiness + 10)
    }));
    showNotif("Squeaky clean!");
    setView(ViewState.HOME);
  };

  const handlePlayComplete = (score: number) => {
    if (score > 0) sounds.play('powerup');
    const happinessGain = Math.min(30, Math.ceil(score / 5));
    
    setStats(prev => ({
      ...prev,
      happiness: Math.min(MAX_STAT, prev.happiness + happinessGain),
      hunger: Math.max(0, prev.hunger - 5) 
    }));
    
    showNotif(`Fun! +${happinessGain} Happy`);
    setView(ViewState.HOME);
  };

  const triggerFeedingAnimation = (item: InventoryItem) => {
    if (feedingState.active) return;
    
    sounds.play('pop');

    setView(ViewState.HOME);
    
    setFeedingState({ active: true, item, phase: 'spawn' });

    setTimeout(() => {
      setFeedingState(prev => ({ ...prev, phase: 'moving' }));
    }, 100);

    setTimeout(() => {
      setFeedingState(prev => ({ ...prev, phase: 'chewing' }));
      sounds.play('eat');
      
      setStats(prev => ({
        ...prev,
        hunger: Math.min(MAX_STAT, prev.hunger + (item.hungerRestored || 10)),
        health: Math.min(MAX_STAT, Math.max(0, prev.health + (item.healthImpact || 0))),
        happiness: Math.min(MAX_STAT, prev.happiness + 5)
      }));

      setInventory(prev => {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
      });

      showNotif(`Ate ${item.name}!`);

    }, 1000); 

    setTimeout(() => {
      setFeedingState({ active: false, item: null, phase: 'done' });
    }, 2500);
  };

  const handleSecretClick = () => {
    sounds.play('click');
    const now = Date.now();
    const newClicks = [...secretClicks, now].filter(time => now - time < 2000);
    
    if (newClicks.length >= 5) {
      sounds.play('success');
      setStats(prev => ({ ...prev, money: prev.money + 5000 }));
      showNotif("🤑 ADMIN CHEAT: +5000 🤑");
      setSecretClicks([]); 
    } else {
      setSecretClicks(newClicks);
    }
  };

  const changeShopTab = (tab: ItemCategory) => {
    sounds.play('click');
    setShopTab(tab);
  };

  const renderStatBar = (label: string, value: number, color: string, icon: React.ReactNode) => (
    <div className="mb-2">
      <div className="flex justify-between text-xs font-bold mb-1 items-center">
        <span className="flex items-center gap-1">{icon} {label.toUpperCase()}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
        <div 
          className={`h-full ${color} transition-all duration-500`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] w-full bg-slate-900 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Game Boy Shell - Flex Container */}
      <div className="w-full max-w-md h-full max-h-[900px] flex flex-col bg-purple-100 rounded-[2rem] p-3 shadow-2xl border-[8px] border-purple-300 relative">
        
        {/* Screen Bezel & Content - Flex Grow */}
        <div className="bg-slate-800 rounded-xl flex-1 flex flex-col p-4 pb-4 shadow-inner relative overflow-hidden">
          
          {/* Notification Toast */}
          {notification && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-full text-sm animate-bounce whitespace-nowrap border border-white/20">
              {notification}
            </div>
          )}

          {/* MAIN SCREEN AREA - Takes available space */}
          <div className="bg-amber-50 flex-1 w-full rounded-lg overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] relative border-4 border-slate-700/50 flex flex-col">
            
            {/* Header / Top Bar */}
            {view === ViewState.HOME && (
              <div className="absolute top-0 w-full p-2 flex justify-between items-start z-10 bg-gradient-to-b from-black/10 to-transparent pointer-events-none">
                <div className="bg-white/80 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-slate-700 flex flex-col gap-1 border border-slate-200 pointer-events-auto">
                  <div 
                    onClick={handleSecretClick}
                    className="flex items-center gap-1 text-yellow-600 cursor-pointer select-none active:scale-95 transition-transform"
                  >
                    <Coins size={12}/> {Math.floor(stats.money)}
                  </div>
                  <div className={`flex items-center gap-1 ${currentJob.color}`}><Briefcase size={12}/> {currentJob.title}</div>
                  <div className="flex items-center gap-1 text-slate-500"><Clock size={12}/> Age: {Math.floor(stats.age)}y</div>
                </div>
              </div>
            )}

            {/* --- VIEWS --- */}

            {/* HOME VIEW */}
            {view === ViewState.HOME && (
              <div className="h-full flex flex-col">
                {/* Pet Area - Expands */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                  <PetRender 
                    appearance={appearance} 
                    age={stats.age}
                    mood={getMood()} 
                    isDirty={stats.hygiene < 40}
                    hasPoop={stats.poops > 0}
                    isHungry={stats.hunger < 40}
                    isPooping={isPooping}
                    isEating={feedingState.active}
                    mouthOpen={feedingState.active && (feedingState.phase === 'spawn' || feedingState.phase === 'moving')}
                    className="w-48 h-48 z-10"
                  />

                  {/* Feeding Animation Item */}
                  {feedingState.active && feedingState.item && (
                    <div 
                      className={`absolute text-5xl transition-all duration-[900ms] ease-in-out z-20
                        ${feedingState.phase === 'spawn' ? 'right-4 opacity-100 scale-100' : ''}
                        ${feedingState.phase === 'moving' ? 'right-1/2 translate-x-1/2 scale-50 opacity-100' : ''} 
                        ${feedingState.phase === 'chewing' || feedingState.phase === 'done' ? 'right-1/2 translate-x-1/2 scale-0 opacity-0' : ''}
                      `}
                      style={{ top: '48%' }}
                    >
                      {feedingState.item.image}
                    </div>
                  )}
                </div>
                
                {/* Stats Footer - Fixed Height */}
                <div className="bg-white/90 p-3 border-t-2 border-slate-200 backdrop-blur-sm shrink-0">
                  {renderStatBar("Hunger", stats.hunger, "bg-orange-400", <Utensils size={10}/>)}
                  {renderStatBar("Hygiene", stats.hygiene, "bg-blue-400", <Bath size={10}/>)}
                  {renderStatBar("Happy", stats.happiness, "bg-pink-400", <Heart size={10}/>)}
                </div>
              </div>
            )}

            {/* WORK VIEW */}
            {view === ViewState.WORK && (
              <FlappyWork 
                salaryMultiplier={currentJob.baseSalary} 
                currentJobTitle={currentJob.title}
                onExit={handleWorkComplete} 
              />
            )}

            {/* SHOWER VIEW */}
            {view === ViewState.SHOWER && (
              <ShowerGame 
                appearance={appearance} 
                age={stats.age} 
                onComplete={handleShowerComplete} 
              />
            )}

            {/* PLAY VIEW */}
            {view === ViewState.PLAY && (
              <CatchGame 
                appearance={appearance}
                age={stats.age}
                onExit={handlePlayComplete}
              />
            )}

            {/* SHOP VIEW */}
            {view === ViewState.SHOP && (
              <div className="h-full bg-white flex flex-col overflow-hidden">
                <div className="p-3 bg-purple-500 text-white flex justify-between items-center shadow-md shrink-0">
                  <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingBag size={18}/> Mini Mart</h2>
                  <div className="flex items-center gap-1 bg-purple-700 px-2 py-1 rounded text-sm"><Coins size={14}/> {Math.floor(stats.money)}</div>
                </div>

                {/* Categories */}
                <div className="flex bg-purple-100 p-2 gap-2 overflow-x-auto shrink-0 touch-pan-x">
                  <button onClick={() => changeShopTab('FOOD')} className={`flex-1 min-w-[60px] py-1 rounded-md text-sm font-bold border-2 transition-colors ${shopTab === 'FOOD' ? 'bg-orange-400 text-white border-orange-600' : 'bg-white text-purple-600 border-purple-200'}`}>Food</button>
                  <button onClick={() => changeShopTab('CLOTHES_BOY')} className={`flex-1 min-w-[60px] py-1 rounded-md text-sm font-bold border-2 transition-colors ${shopTab === 'CLOTHES_BOY' ? 'bg-blue-400 text-white border-blue-600' : 'bg-white text-purple-600 border-purple-200'}`}>Boy</button>
                  <button onClick={() => changeShopTab('CLOTHES_GIRL')} className={`flex-1 min-w-[60px] py-1 rounded-md text-sm font-bold border-2 transition-colors ${shopTab === 'CLOTHES_GIRL' ? 'bg-pink-400 text-white border-pink-600' : 'bg-white text-purple-600 border-purple-200'}`}>Girl</button>
                  <button onClick={() => changeShopTab('ACCESSORY')} className={`flex-1 min-w-[60px] py-1 rounded-md text-sm font-bold border-2 transition-colors ${shopTab === 'ACCESSORY' ? 'bg-teal-400 text-white border-teal-600' : 'bg-white text-purple-600 border-purple-200'}`}>Accs</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 pb-20 grid grid-cols-2 gap-3 touch-pan-y">
                  {ALL_SHOP_ITEMS.filter(i => i.category === shopTab).map(item => {
                    const alreadyOwned = item.category !== 'FOOD' && inventory.some(i => i.id === item.id);
                    return (
                      <button 
                        key={item.id} 
                        onClick={() => !alreadyOwned && handleBuy(item)}
                        disabled={alreadyOwned && item.category !== 'FOOD'}
                        className={`flex flex-col items-center p-3 border-2 rounded-xl transition-all active:scale-95 group relative ${alreadyOwned ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-white border-gray-200 hover:border-purple-400 hover:bg-purple-50'}`}
                      >
                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{item.image}</div>
                        <div className="font-bold text-slate-700 text-sm">{item.name}</div>
                        
                        {item.category === 'FOOD' && (
                          <div className="text-[10px] text-gray-500 mb-2">{item.type === 'HEALTHY' ? '+HP' : '-HP'}</div>
                        )}
                        
                        {alreadyOwned ? (
                           <div className="bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-bold mt-2">OWNED</div>
                        ) : (
                          <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold border border-green-200 mt-2">${item.cost}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                   <button onClick={() => changeView(ViewState.HOME)} className="bg-gray-200 text-gray-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-gray-300">Leave</button>
                </div>
              </div>
            )}

            {/* INVENTORY VIEW */}
            {view === ViewState.INVENTORY && (
               <div className="h-full bg-orange-50 flex flex-col">
                  <div className="p-3 bg-orange-400 text-white flex justify-between items-center shadow-md shrink-0">
                    <h2 className="font-bold text-lg flex items-center gap-2"><Utensils size={18}/> Inventory</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 pb-20 touch-pan-y">
                    {inventory.length === 0 ? (
                      <div className="text-center text-gray-400 mt-20">Your inventory is empty.<br/>Go to the shop!</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {inventory.map(item => {
                           const isEquipped = appearance.hat === item.id || appearance.outfit === item.id || appearance.accessory === item.id;
                           return (
                           <button 
                            key={item.id}
                            onClick={() => handleUseItem(item)}
                            disabled={feedingState.active}
                            className={`flex items-center justify-between p-3 rounded-xl shadow-sm border transition-all ${isEquipped ? 'bg-green-100 border-green-400 ring-2 ring-green-300' : 'bg-white border-orange-100 hover:border-orange-400'}`}
                           >
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">{item.image}</span>
                                <div className="text-left">
                                   <div className="font-bold text-slate-700">{item.name}</div>
                                   {item.category === 'FOOD' ? (
                                     <div className="text-xs text-orange-400">Restores {item.hungerRestored} Hunger</div>
                                   ) : (
                                     <div className="text-xs text-blue-400">{isEquipped ? 'EQUIPPED' : 'Click to Wear'}</div>
                                   )}
                                </div>
                              </div>
                              {item.category === 'FOOD' && (
                                <div className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">x{item.quantity}</div>
                              )}
                              {item.category !== 'FOOD' && isEquipped && (
                                <div className="bg-green-500 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">✓</div>
                              )}
                           </button>
                        )})}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <button onClick={() => changeView(ViewState.HOME)} className="bg-gray-200 text-gray-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-gray-300">Back</button>
                  </div>
               </div>
            )}

          </div>
        </div>

        {/* PHYSICAL BUTTONS - Fixed Height Container */}
        <div className="mt-4 shrink-0 h-[120px] flex items-center justify-center px-4">
             {view === ViewState.HOME ? (
                <div className="relative grid grid-cols-2 gap-x-12 gap-y-6 w-full max-w-[280px] mx-auto">
                    
                    {/* CENTER PLAY BUTTON */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                         <button 
                           onClick={() => changeView(ViewState.PLAY)}
                           disabled={feedingState.active}
                           className="w-16 h-16 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-[0_4px_0_rgb(157,23,77)] active:shadow-none active:translate-y-1 transition-all border-4 border-pink-400 group disabled:opacity-50 touch-none"
                         >
                            <Gamepad2 size={28} className="drop-shadow-md group-hover:scale-110 transition-transform"/>
                         </button>
                    </div>

                     {/* Top Left */}
                     <button onClick={() => changeView(ViewState.INVENTORY)} disabled={feedingState.active} className="flex flex-col items-center gap-1 group disabled:opacity-50 touch-none">
                       <div className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-[0_4px_0_rgb(30,41,59)] active:shadow-none active:translate-y-1 transition-all group-hover:bg-slate-600 border-2 border-slate-500">
                          <User size={20} />
                       </div>
                       <span className="text-xs font-bold text-slate-500 tracking-wider">ITEMS</span>
                     </button>

                     {/* Top Right */}
                     <button onClick={() => changeView(ViewState.SHOWER)} disabled={feedingState.active} className="flex flex-col items-center gap-1 group disabled:opacity-50 touch-none">
                       <div className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-[0_4px_0_rgb(30,41,59)] active:shadow-none active:translate-y-1 transition-all group-hover:bg-slate-600 border-2 border-slate-500">
                          <Bath size={20} />
                       </div>
                       <span className="text-xs font-bold text-slate-500 tracking-wider">BATH</span>
                     </button>

                     {/* Bottom Left */}
                     <button onClick={() => changeView(ViewState.WORK)} disabled={feedingState.active} className="flex flex-col items-center gap-1 group disabled:opacity-50 touch-none">
                       <div className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-[0_4px_0_rgb(30,41,59)] active:shadow-none active:translate-y-1 transition-all group-hover:bg-slate-600 border-2 border-slate-500">
                          <Briefcase size={20} />
                       </div>
                       <span className="text-xs font-bold text-slate-500 tracking-wider">WORK</span>
                     </button>

                     {/* Bottom Right */}
                     <button onClick={() => changeView(ViewState.SHOP)} disabled={feedingState.active} className="flex flex-col items-center gap-1 group disabled:opacity-50 touch-none">
                       <div className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-[0_4px_0_rgb(30,41,59)] active:shadow-none active:translate-y-1 transition-all group-hover:bg-slate-600 border-2 border-slate-500">
                          <ShoppingBag size={20} />
                       </div>
                       <span className="text-xs font-bold text-slate-500 tracking-wider">SHOP</span>
                     </button>
                </div>
             ) : (
                <div className="flex justify-center">
                  <button 
                    onClick={() => changeView(ViewState.HOME)} 
                    className="w-14 h-14 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center shadow-[0_4px_0_rgb(161,98,7)] active:shadow-none active:translate-y-1 transition-all border-4 border-yellow-200 touch-none"
                  >
                    <Home size={24} />
                  </button>
                </div>
             )}
          </div>

        <div className="absolute bottom-1 left-0 w-full text-center opacity-30 text-[10px] text-purple-800 font-mono pointer-events-none">
           TAMAGOTCHI LIFE v1.0
        </div>
      </div>
    </div>
  );
}