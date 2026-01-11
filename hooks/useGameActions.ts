
import { useCallback } from 'react';
import { GameStatus, Inventory, Direction, PlayerPosition } from '../types';
import { DAY_DURATION_MS, GRID_CONFIG, CHARGES_PER_KIT, HOUSE_X, ROPE_X, OVERWORLD_FLOOR_Y } from '../constants';

export const useGameActions = (
  setCoins: React.Dispatch<React.SetStateAction<number>>,
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>,
  setMessage: React.Dispatch<React.SetStateAction<string | null>>,
  setDayTime: React.Dispatch<React.SetStateAction<number>>,
  setDayCount: React.Dispatch<React.SetStateAction<number>>,
  setRopeLength: React.Dispatch<React.SetStateAction<number>>,
  playerRef: React.MutableRefObject<PlayerPosition>,
  setPlayer: React.Dispatch<React.SetStateAction<PlayerPosition>>,
  timeRef: React.MutableRefObject<number>,
  gridRef: React.MutableRefObject<any[][]>
) => {
  const handleSleep = useCallback((forced = false, currentDayCount: number) => {
    timeRef.current = DAY_DURATION_MS;
    setDayTime(DAY_DURATION_MS);
    setDayCount(prev => prev + 1);
    const startPos = { x: HOUSE_X, y: OVERWORLD_FLOOR_Y, vx: 0, vy: 0, facing: Direction.DOWN, isClimbing: false };
    playerRef.current = startPos;
    setPlayer(startPos);
    // Replenish armor each day
    setInventory(prev => ({ ...prev, armorHitsRemaining: prev.armorLevel }));
    if (!forced) {
      setMessage("WELL RESTED - DAY " + (currentDayCount + 1));
      setTimeout(() => setMessage(null), 2000);
    }
  }, [setDayTime, setDayCount, setPlayer, setMessage, setInventory, timeRef, OVERWORLD_FLOOR_Y, playerRef]);

  const handlePassOut = useCallback((currentCoins: number, currentDayCount: number) => {
    setMessage("EXHAUSTION - SKIPPING TO NEXT DAY");
    setCoins(Math.max(0, currentCoins - 20));
    setTimeout(() => {
      setMessage(null);
      handleSleep(true, currentDayCount);
    }, 2000);
  }, [setCoins, setMessage, handleSleep]);

  const handlePlayerDeath = useCallback((currentDayCount: number) => {
    // Calculate item loss - lose half of each, rounded down
    // Formula: Math.floor(count / 2) items are lost
    setInventory(prev => ({
      ...prev,
      silverBlocks: Math.ceil(prev.silverBlocks / 2),
      stone: Math.ceil(prev.stone / 2),
      defusedMines: Math.ceil(prev.defusedMines / 2),
      scrapMetal: Math.ceil(prev.scrapMetal / 2),
      gems: Math.ceil(prev.gems / 2),
      coal: Math.ceil(prev.coal / 2),
      // Disarm kits and charges are kept (equipment)
      // Pickaxe is kept (permanent upgrade)
    }));

    // Also lose some coins
    setCoins(c => Math.floor(c * 0.75));

    // Don't call handleSleep here - let the death sequence manage the transition
  }, [setCoins, setInventory]);

  const handleShopBuy = useCallback((id: any, price: number, coins: number, ropeLength: number, inventory: Inventory) => {
    if (coins < price) return;

    // Validate Charge Cap
    if (id === 'CHARGE' && inventory.disarmCharges >= CHARGES_PER_KIT) {
      setMessage("KIT ALREADY FULL (MAX " + CHARGES_PER_KIT + ")");
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    if (id === 'ROPE') {
      const extensionAmount = 5;
      let obstructed = false;
      for (let i = 0; i < extensionAmount; i++) {
        const ty = ropeLength + i;
        if (ty >= GRID_CONFIG.ROWS || !gridRef.current[ty]?.[ROPE_X]?.isRevealed || gridRef.current[ty]?.[ROPE_X]?.item === 'SILVER_BLOCK') {
          obstructed = true;
          break;
        }
      }
      if (obstructed) {
        setMessage("PATH OBSTRUCTED - CLEAR ROCK FIRST");
        setTimeout(() => setMessage(null), 2000);
        return;
      }
      setRopeLength(prev => prev + extensionAmount);
    }

    // Deduct coins
    if (price > 0) setCoins(c => c - price);

    // Grant Item
    if (id === 'CHARGE') setInventory(prev => ({ ...prev, disarmCharges: prev.disarmCharges + 1 }));
    if (id === 'KIT') {
      setInventory(prev => {
        // If charges are empty, auto-equip the kit
        if (prev.disarmCharges === 0) {
          setMessage("KIT EQUIPPED - 3 CHARGES READY");
          setTimeout(() => setMessage(null), 2000);
          return { ...prev, disarmCharges: CHARGES_PER_KIT };
        }
        // Otherwise add to reserves
        return { ...prev, disarmKits: prev.disarmKits + 1 };
      });
    }
    if (id === 'PICKAXE') {
      setInventory(prev => ({ ...prev, hasPickaxe: true }));
      setMessage("+1 PICKAXE ⛏️ - YOU CAN NOW MINE!");
      setTimeout(() => setMessage(null), 2000);
    }
    // Token purchases
    if (id === 'TOKEN_STONE') {
      setInventory(prev => ({ ...prev, ownedTokens: [...prev.ownedTokens, 'STONE_TOKEN'] }));
      setMessage("+1 STONE TOKEN 🪨 - EQUIP IN INVENTORY!");
      setTimeout(() => setMessage(null), 2000);
    }
  }, [setCoins, setInventory, setMessage, setRopeLength, gridRef]);

  const handleShopSell = useCallback((id: 'SCRAP' | 'GEM' | 'COAL', price: number) => {
    setInventory(prev => {
      if (id === 'SCRAP' && prev.scrapMetal > 0) { setCoins(c => c + price); return { ...prev, scrapMetal: prev.scrapMetal - 1 }; }
      if (id === 'GEM' && prev.gems > 0) { setCoins(c => c + price); return { ...prev, gems: prev.gems - 1 }; }
      if (id === 'COAL' && prev.coal > 0) { setCoins(c => c + price); return { ...prev, coal: prev.coal - 1 }; }
      return prev;
    });
  }, [setCoins, setInventory]);

  const handleContribute = useCallback((id: string, material: 'stone' | 'silver') => {
    setInventory(prev => {
      const newInv = { ...prev };

      if (id === 'WISHING_WELL') {
        const requirements = { stone: 10, silver: 4 };
        const progress = { ...prev.wishingWellProgress };

        if (material === 'stone' && prev.stone > 0 && progress.stone < requirements.stone) {
          newInv.stone = prev.stone - 1;
          progress.stone += 1;
          setMessage(`+1 STONE CONTRIBUTED (${progress.stone}/${requirements.stone})`);
        } else if (material === 'silver' && prev.silverBlocks > 0 && progress.silver < requirements.silver) {
          newInv.silverBlocks = prev.silverBlocks - 1;
          progress.silver += 1;
          setMessage(`+1 SILVER CONTRIBUTED (${progress.silver}/${requirements.silver})`);
        } else {
          return prev; // No change
        }

        newInv.wishingWellProgress = progress;

        // Check if complete
        if (progress.stone >= requirements.stone && progress.silver >= requirements.silver) {
          newInv.wishingWellBuilt = true;
          setTimeout(() => {
            setMessage("⛲ WISHING WELL CONSTRUCTED!");
            setTimeout(() => setMessage(null), 3000);
          }, 500);
        } else {
          setTimeout(() => setMessage(null), 1500);
        }
      }

      return newInv;
    });
  }, [setInventory, setMessage]);

  return { handleSleep, handlePassOut, handlePlayerDeath, handleShopBuy, handleShopSell, handleContribute };
};

