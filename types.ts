
export enum ViewState {
  HOME = 'HOME',
  WORK = 'WORK',
  SHOP = 'SHOP',
  SHOWER = 'SHOWER',
  EAT = 'EAT',
  INVENTORY = 'INVENTORY',
  PLAY = 'PLAY'
}

export interface Job {
  id: number;
  title: string;
  baseSalary: number; // Coins per point in Flappy Bird
  requiredScore: number;
  color: string;
}

export type ItemCategory = 'FOOD' | 'CLOTHES_BOY' | 'CLOTHES_GIRL' | 'ACCESSORY';
export type ItemSlot = 'HAT' | 'FACE' | 'BODY' | 'HAND' | 'LEGS' | 'FEET' | 'NONE';

export interface ShopItem {
  id: string;
  name: string;
  category: ItemCategory;
  slot: ItemSlot; // New property to determine where it renders
  cost: number;
  image: string;
  // Food specific properties (optional)
  hungerRestored?: number;
  healthImpact?: number; 
  type?: 'HEALTHY' | 'FAST_FOOD'; // Legacy support
}

export interface PetStats {
  hunger: number; // 0-100 (0 is starving)
  hygiene: number; // 0-100 (0 is filthy)
  happiness: number; // 0-100
  health: number; // 0-100
  money: number;
  jobId: number;
  highScore: number;
  lastUpdate: number;
  age: number; // Internal age counter
  poops: number; // Number of poop piles on floor
}

export interface PetAppearance {
  color: string;
  hat?: string; // ID of the hat item (e.g., 'bc1')
  accessory?: string; // ID of the accessory item
  outfit?: string; // ID of the outfit item (Shirt)
  pants?: string; // ID of the pants item
  shoes?: string; // ID of the shoes item
}

export interface InventoryItem extends ShopItem {
  quantity: number;
}
