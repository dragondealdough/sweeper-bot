
import { useCallback, useRef } from 'react';
import { GameStatus, Inventory, WorldItem } from '../types';
import { TutorialState } from './useTutorial';

interface WorldUpdateParams {
  status: GameStatus;
  dayTime: number;
  setDayTime: React.Dispatch<React.SetStateAction<number>>;
  timeRef: React.MutableRefObject<number>;
  handlePassOut: () => void;
  inventory: Inventory;
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  wellIncomeRef: React.MutableRefObject<number>;
  recyclingRef: React.MutableRefObject<{ queue: number; timer: number }>;
  RECYCLE_TIME_MS: number;
  RECYCLER_X: number;
  OVERWORLD_FLOOR_Y: number;
  setWorldItems: React.Dispatch<React.SetStateAction<WorldItem[]>>;
  setMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setRecyclingDisplay: React.Dispatch<React.SetStateAction<{ queue: number; progress: number }>>;
  tutorialState?: TutorialState;
}

export const useWorldUpdates = () => {
  const updateTimers = useCallback((params: WorldUpdateParams, delta: number) => {
    const {
      status,
      timeRef,
      dayTime,
      setDayTime,
      handlePassOut,
      inventory,
      setCoins,
      wellIncomeRef,
      recyclingRef,
      RECYCLE_TIME_MS,
      RECYCLER_X,
      OVERWORLD_FLOOR_Y,
      setWorldItems,
      setMessage,
      setRecyclingDisplay,
      tutorialState
    } = params;

    if (status !== GameStatus.PLAYING) return;

    // --- WORLD TIMERS ---
    // Only run timer if tutorial allows it (tutorial is skipped/completed OR past timer reveal point)
    const timerShouldRun = !tutorialState || 
                           !tutorialState.isActive || 
                           tutorialState.currentStep === 'COMPLETED' ||
                           ['MINE_INTRO_2', 'MINE_INTRO_3', 'MINE_INTRO_4', 'MINE_INTRO_5', 'MINE_INTRO_6', 'MINE_INTRO_7', 'MINE_INTRO_8', 'MINE_INTRO_9', 'MINE_HIT_MINE_1', 'MINE_HIT_MINE_2', 'MINE_EXPLAIN_NUMBERS'].includes(tutorialState.currentStep);
    
    if (timerShouldRun) {
      timeRef.current -= delta;
      if (timeRef.current <= 0) {
        timeRef.current = 0;
        handlePassOut();
      }
      if (Math.floor(timeRef.current / 1000) !== Math.floor(dayTime / 1000)) {
        setDayTime(timeRef.current);
      }
    }

    // --- WISHING WELL INCOME ---
    if (inventory.wishingWellBuilt) {
      wellIncomeRef.current -= delta;
      if (wellIncomeRef.current <= 0) {
        setCoins(c => c + 1);
        wellIncomeRef.current = 60000;
      }
    }

    // --- RECYCLING LOGIC ---
    if (recyclingRef.current.queue > 0) {
      recyclingRef.current.timer -= delta;
      if (recyclingRef.current.timer <= 0) {
        const scrapId = `scrap-${Date.now()}-${Math.random()}`;
        setWorldItems(prev => [...prev, { id: scrapId, x: RECYCLER_X, y: OVERWORLD_FLOOR_Y, vy: 0, type: 'SCRAP' }]);
        
        recyclingRef.current.queue -= 1;
        recyclingRef.current.timer = RECYCLE_TIME_MS;
        setMessage("RECYCLING COMPLETE: SCRAP READY");
        setTimeout(() => setMessage(null), 1500);
      }
    } else {
      recyclingRef.current.timer = RECYCLE_TIME_MS;
    }

    setRecyclingDisplay({
      queue: recyclingRef.current.queue,
      progress: 1 - (Math.max(0, recyclingRef.current.timer) / RECYCLE_TIME_MS)
    });
  }, []);

  return { updateTimers };
};

