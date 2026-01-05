
import { useState, useRef } from 'react';
import { PlayerPosition, GameStatus, Direction, Inventory, WorldItem } from '../types';
import { DAY_DURATION_MS, RECYCLE_TIME_MS } from '../constants';

export const useGameState = () => {
  const [player, setPlayer] = useState<PlayerPosition>({ x: -2, y: -2, vx: 0, vy: 0, facing: Direction.DOWN, isClimbing: false });
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [depth, setDepth] = useState(0);
  const [coins, setCoins] = useState(0);
  const [inventory, setInventory] = useState<Inventory>({ 
    silverBlocks: 0, stone: 0, disarmKits: 1, disarmCharges: 3, defusedMines: 0, scrapMetal: 0, gems: 0, coal: 0,
    deck: [], collection: [], wishingWellBuilt: false, wishingWellProgress: { stone: 0, silver: 0 },
    hasPickaxe: false
  });
  const [ropeLength, setRopeLength] = useState(5);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isRecyclerOpen, setIsRecyclerOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isConstructionOpen, setIsConstructionOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [worldItems, setWorldItems] = useState<WorldItem[]>([]);
  const [recyclingDisplay, setRecyclingDisplay] = useState({ queue: 0, progress: 0 });
  const [dayTime, setDayTime] = useState(DAY_DURATION_MS);
  const [dayCount, setDayCount] = useState(1);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [screenShake, setScreenShake] = useState(0);
  const [playerHitFlash, setPlayerHitFlash] = useState(false);

  const recyclingRef = useRef({ queue: 0, timer: RECYCLE_TIME_MS });
  const cameraRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef<number>(DAY_DURATION_MS);
  const wellIncomeRef = useRef<number>(60000);
  const keys = useRef<Record<string, boolean>>({});
  const playerRef = useRef<PlayerPosition>({ x: -2, y: -2, vx: 0, vy: 0, facing: Direction.DOWN, isClimbing: false });
  const requestRef = useRef<number>(0);
  const canJumpRef = useRef<boolean>(true);

  return {
    player, setPlayer,
    status, setStatus,
    depth, setDepth,
    coins, setCoins,
    inventory, setInventory,
    ropeLength, setRopeLength,
    isShopOpen, setIsShopOpen,
    isRecyclerOpen, setIsRecyclerOpen,
    isInventoryOpen, setIsInventoryOpen,
    isConstructionOpen, setIsConstructionOpen,
    message, setMessage,
    worldItems, setWorldItems,
    recyclingDisplay, setRecyclingDisplay,
    dayTime, setDayTime,
    dayCount, setDayCount,
    camera, setCamera,
    screenShake, setScreenShake,
    playerHitFlash, setPlayerHitFlash,
    recyclingRef,
    cameraRef,
    timeRef,
    wellIncomeRef,
    keys,
    playerRef,
    requestRef,
    canJumpRef
  };
};

