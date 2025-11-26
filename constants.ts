
import { ShopItem, Job } from './types';

export const MAX_STAT = 100;
export const DECAY_TICK_RATE_MS = 10000; // Stats decay every 10 seconds
export const MAX_GROWTH_AGE = 18; // Age at which the pet is fully grown (years)
export const AGE_TICK_INCREMENT = 0.005; // Age gained per tick (approx 33 mins per year)

// Decay amounts per tick (Slower rates for longer gameplay)
export const DECAY_RATES = {
  hunger: 0.2,    // Was 1. Now takes ~1.5 hours to starve from full
  hygiene: 0.15,  // Was 0.8
  happiness: 0.1, // Was 0.5
  health: 0.05    // Was 0.2
};

export const JOBS: Job[] = [
  { id: 0, title: "Intern", baseSalary: 1, requiredScore: 0, color: "text-gray-400" },
  { id: 1, title: "Junior Dev", baseSalary: 2, requiredScore: 5, color: "text-green-400" },
  { id: 2, title: "Senior Dev", baseSalary: 4, requiredScore: 15, color: "text-blue-400" },
  { id: 3, title: "Manager", baseSalary: 8, requiredScore: 30, color: "text-purple-400" },
  { id: 4, title: "CEO", baseSalary: 15, requiredScore: 50, color: "text-yellow-400" },
];

export const FOOD_ITEMS: ShopItem[] = [
  // Fast Food
  { id: 'ff1', name: 'Burger', category: 'FOOD', slot: 'NONE', type: 'FAST_FOOD', cost: 15, hungerRestored: 30, healthImpact: -5, image: '🍔' },
  { id: 'ff2', name: 'Pizza', category: 'FOOD', slot: 'NONE', type: 'FAST_FOOD', cost: 20, hungerRestored: 40, healthImpact: -8, image: '🍕' },
  { id: 'ff3', name: 'Fries', category: 'FOOD', slot: 'NONE', type: 'FAST_FOOD', cost: 10, hungerRestored: 15, healthImpact: -3, image: '🍟' },
  { id: 'ff4', name: 'Cola', category: 'FOOD', slot: 'NONE', type: 'FAST_FOOD', cost: 8, hungerRestored: 10, healthImpact: -5, image: '🥤' },
  { id: 'ff5', name: 'Hotdog', category: 'FOOD', slot: 'NONE', type: 'FAST_FOOD', cost: 12, hungerRestored: 25, healthImpact: -6, image: '🌭' },
  // Healthy Food
  { id: 'hf1', name: 'Apple', category: 'FOOD', slot: 'NONE', type: 'HEALTHY', cost: 10, hungerRestored: 15, healthImpact: 5, image: '🍎' },
  { id: 'hf2', name: 'Salad', category: 'FOOD', slot: 'NONE', type: 'HEALTHY', cost: 25, hungerRestored: 35, healthImpact: 10, image: '🥗' },
  { id: 'hf3', name: 'Carrot', category: 'FOOD', slot: 'NONE', type: 'HEALTHY', cost: 8, hungerRestored: 10, healthImpact: 4, image: '🥕' },
  { id: 'hf4', name: 'Broccoli', category: 'FOOD', slot: 'NONE', type: 'HEALTHY', cost: 12, hungerRestored: 20, healthImpact: 8, image: '🥦' },
  { id: 'hf5', name: 'Water', category: 'FOOD', slot: 'NONE', type: 'HEALTHY', cost: 5, hungerRestored: 5, healthImpact: 5, image: '💧' },
];

export const BOY_CLOTHES: ShopItem[] = [
  { id: 'bc2', name: 'Camiseta Azul', category: 'CLOTHES_BOY', slot: 'BODY', cost: 50, image: '🟦' },
  { id: 'bc_stripe', name: 'Camiseta Rayas', category: 'CLOTHES_BOY', slot: 'BODY', cost: 75, image: '💈' },
];

export const GIRL_CLOTHES: ShopItem[] = [
  { id: 'gc_tshirt', name: 'Camiseta Rosa', category: 'CLOTHES_GIRL', slot: 'BODY', cost: 50, image: '👚' },
  { id: 'gc_stripe', name: 'Camiseta Rayas', category: 'CLOTHES_GIRL', slot: 'BODY', cost: 75, image: '💈' },
];

export const ACCESSORIES: ShopItem[] = [
  { id: 'ac_cap', name: 'Gorra', category: 'ACCESSORY', slot: 'HAT', cost: 50, image: '🧢' },
];

export const ALL_SHOP_ITEMS = [...FOOD_ITEMS, ...BOY_CLOTHES, ...GIRL_CLOTHES, ...ACCESSORIES];
