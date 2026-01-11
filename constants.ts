
import { CardType, CardDefinition } from './types';

export const GRID_CONFIG = {
  COLUMNS: 16,
  ROWS: 100, // Deeper mines for more discoveries
  INITIAL_MINE_COUNT: 450,
  TILE_SIZE: 40,
  OVERWORLD_HEIGHT_TILES: 10,
};

export const PHYSICS = {
  GRAVITY: 0.022,
  JUMP_POWER: -0.48,
  MOVE_ACCEL: 0.06,
  MAX_MOVE_SPEED: 0.24,
  FRICTION: 0.82,
  MAX_FALL: 0.9,
  CLIMB_SPEED: 0.1,
};

export const COLORS = {
  DIRT_HIDDEN: '#4b2c20',
  DIRT_REVEALED: '#1e110c',
  SILVER_BLOCK: '#a1a1aa',
  GOLD_COIN: '#fbbf24',
  SAFE_FLAG: '#22c55e',
  MINE_FLAG: '#ef4444',
  MINE_TEXT: [
    '', '#60a5fa', '#4ade80', '#f87171', '#c084fc', '#fbbf24', '#22d3ee', '#ffffff', '#9ca3af',
  ],
  SKY_TOP: '#38bdf8',
  SKY_BOTTOM: '#bae6fd',
  GRASS: '#4ade80',
  ROPE: '#a16207'
};

export const INITIAL_ROPE_LENGTH = 5;
export const SAFE_ROWS = 4;
export const DAY_DURATION_MS = 15 * 60 * 1000;
export const EVENING_THRESHOLD_MS = 3 * 60 * 1000;
export const RECYCLE_TIME_MS = 20000;
export const OVERWORLD_MIN_X = -12;
export const OVERWORLD_MAX_X = 28;
export const APP_VERSION = 'v1.3.52';

export const CARD_DEFINITIONS: Record<CardType, CardDefinition> = {
  [CardType.BOMBER]: { type: CardType.BOMBER, name: 'Bomber', description: 'Explodes dealing damage.', baseValue: 3 },
  [CardType.RUBBLE]: { type: CardType.RUBBLE, name: 'Rubble', description: 'Useless debris.', baseValue: 0 },
  [CardType.LEECH]: { type: CardType.LEECH, name: 'Leech', description: 'Steals health.', baseValue: 2 },
  [CardType.PICKAXE]: { type: CardType.PICKAXE, name: 'Pickaxe', description: 'Reduces enemy value.', baseValue: 1 },
  [CardType.BOMB_DISPOSAL]: { type: CardType.BOMB_DISPOSAL, name: 'Disposal', description: 'Defuses bombs.', baseValue: 2 },
  [CardType.SNIPER]: { type: CardType.SNIPER, name: 'Sniper', description: 'High precision damage.', baseValue: 5 },
  [CardType.ASSASSIN]: { type: CardType.ASSASSIN, name: 'Assassin', description: 'Kills high value targets.', baseValue: 4 },
  [CardType.SABOTEUR]: { type: CardType.SABOTEUR, name: 'Saboteur', description: 'Disrupts enemy lines.', baseValue: 3 },
  [CardType.MORTAR]: { type: CardType.MORTAR, name: 'Mortar', description: 'Area damage.', baseValue: 4 },
  [CardType.SHIELD_BEARER]: { type: CardType.SHIELD_BEARER, name: 'Shield', description: 'Protects neighbors.', baseValue: 2 },
  [CardType.FIELD_MEDIC]: { type: CardType.FIELD_MEDIC, name: 'Medic', description: 'Heals units.', baseValue: 2 },
  [CardType.BUNKER]: { type: CardType.BUNKER, name: 'Bunker', description: 'High defense.', baseValue: 6 },
  [CardType.REINFORCEMENT]: { type: CardType.REINFORCEMENT, name: 'Backup', description: 'Calls more units.', baseValue: 2 },
  [CardType.VETERAN]: { type: CardType.VETERAN, name: 'Veteran', description: 'Experienced fighter.', baseValue: 4 },
  [CardType.SCAVENGER]: { type: CardType.SCAVENGER, name: 'Scavenger', description: 'Finds items.', baseValue: 2 },
  [CardType.MIMIC]: { type: CardType.MIMIC, name: 'Mimic', description: 'Copies other units.', baseValue: 1 },
  [CardType.SPY]: { type: CardType.SPY, name: 'Spy', description: 'Reveals enemy cards.', baseValue: 1 },
};


export const CHARGES_PER_KIT = 3;

export const ROPE_X = 8;
export const HOUSE_X = -2;
export const RECYCLER_X = -8;
export const SHOP_X = 13.5;
export const CONSTRUCTION_X = 22;
export const OVERWORLD_FLOOR_Y = -2;

export const MAX_EQUIPPED_TOKENS = 3;

export interface TokenDefinition {
  name: string;
  icon: string;
  description: string;
  baseDropChance: number;
  dropChancePerDisarm: number;
  shopPrice: number;
}

export const TOKEN_DEFINITIONS: Record<string, TokenDefinition> = {
  STONE_TOKEN: {
    name: 'Stone Token',
    icon: '🪨',
    description: '+20% stone from all tiles',
    baseDropChance: 0.10,
    dropChancePerDisarm: 0.01,
    shopPrice: 50
  }
};
