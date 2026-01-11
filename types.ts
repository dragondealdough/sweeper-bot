
export enum FlagType {
  NONE = 'NONE',
  // SAFE removed as per request
  MINE = 'MINE',
}

export type ItemType = 'COIN' | 'SILVER_BLOCK' | 'SILVER' | 'SCRAP' | 'GEM' | 'COAL' | 'STONE';

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export interface TileState {
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isDisarmed?: boolean; // True if flagged with a disarm charge - mine cannot explode
  flag: FlagType;
  neighborMines: number;
  item?: ItemType;
}

export interface PlayerPosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Direction;
  isClimbing?: boolean;
}

export interface WorldItem {
  id: string;
  x: number;
  y: number;
  vy: number;
  type: ItemType;
}

export enum GameStatus {
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
  START = 'START'
}

export enum CardType {
  BOMBER = 'BOMBER',
  RUBBLE = 'RUBBLE',
  LEECH = 'LEECH',
  PICKAXE = 'PICKAXE',
  BOMB_DISPOSAL = 'BOMB_DISPOSAL',
  SNIPER = 'SNIPER',
  ASSASSIN = 'ASSASSIN',
  SABOTEUR = 'SABOTEUR',
  MORTAR = 'MORTAR',
  SHIELD_BEARER = 'SHIELD_BEARER',
  FIELD_MEDIC = 'FIELD_MEDIC',
  BUNKER = 'BUNKER',
  REINFORCEMENT = 'REINFORCEMENT',
  VETERAN = 'VETERAN',
  SCAVENGER = 'SCAVENGER',
  MIMIC = 'MIMIC',
  SPY = 'SPY'
}

export type PlayerSide = 'PLAYER' | 'ENEMY';

export interface CardDefinition {
  type: CardType;
  name: string;
  description: string;
  baseValue: number;
}

export interface CardInstance {
  id: string;
  def: CardDefinition;
  owner: PlayerSide;
  currentValue: number;
  timer?: number;
  isDefused?: boolean;
}

export type TokenId = 'STONE_TOKEN';

export interface Inventory {
  silverBlocks: number;
  stone: number;
  disarmKits: number;
  disarmCharges: number;
  defusedMines: number;
  scrapMetal: number;
  gems: number;
  coal: number;
  deck: CardInstance[];
  collection: CardInstance[];
  // Construction progress
  wishingWellBuilt: boolean;
  wishingWellProgress: { stone: number; silver: number };
  // Tutorial items
  hasPickaxe: boolean;
  // Blueprint/Token system
  foundBlueprints: TokenId[];
  ownedTokens: TokenId[];
  equippedTokens: TokenId[];
  minesDisarmedTotal: number;
}

export interface BattleState {
  grid: (CardInstance | null)[];
  playerHand: CardInstance[];
  playerDeck: CardInstance[];
  enemyHand: CardInstance[];
  enemyDeck: CardInstance[];
  turn: PlayerSide;
  turnCount: number;
  gameLog: string[];
  gameOver: boolean;
  winner: PlayerSide | 'DRAW' | null;
}
