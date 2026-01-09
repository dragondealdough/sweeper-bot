
import React, { useEffect, useCallback } from 'react';
import { GameStatus, Direction, PlayerPosition, Inventory } from '../types';
import { TutorialState } from './useTutorial';

interface KeyboardParams {
  status: GameStatus;
  isShopOpen: boolean;
  isRecyclerOpen: boolean;
  isInventoryOpen: boolean;
  isConstructionOpen: boolean;
  playerRef: React.MutableRefObject<PlayerPosition>;
  ropeLength: number;
  inventory: Inventory;
  timeRef: React.MutableRefObject<number>;
  EVENING_THRESHOLD_MS: number;
  HOUSE_X: number;
  SHOP_X: number;
  RECYCLER_X: number;
  CONSTRUCTION_X: number;
  ROPE_X: number;
  OVERWORLD_FLOOR_Y: number;
  keys: React.MutableRefObject<Record<string, boolean>>;
  setIsInventoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsShopOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRecyclerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsConstructionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMessage: React.Dispatch<React.SetStateAction<string | null>>;
  revealTileAt: (x: number, y: number, inventory: Inventory, depth: number, isInitial?: boolean) => void;
  startClimbing: (direction: 'UP' | 'DOWN') => void;
  handleFlagAction: (tx: number, ty: number, status: GameStatus, isMenuOpen: boolean) => void;
  handleSleep: () => void;
  onShopOpen?: () => void;
  onConstructionOpen?: () => void;
  onConstructionClosed?: () => void;
  onRecyclerOpen?: () => void;
  tutorialState?: TutorialState;
  depth: number;
  selectedTarget?: { x: number, y: number } | null;
  isInputBlocked?: boolean;
}

export const useKeyboard = (params: KeyboardParams) => {
  // Use a ref to store current params so the useEffect event listener doesn't need to re-bind
  // on every render (which causes dropped inputs if the re-bind happens during a key event).
  const paramsRef = React.useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const { playerRef } = params;

  const getTargetTile = useCallback(() => {
    const p = playerRef.current;
    let tx = Math.floor(p.x + 0.5), ty = Math.floor(p.y + 0.5);
    if (p.facing === Direction.UP) ty -= 1;
    else if (p.facing === Direction.DOWN) ty += 1;
    else if (p.facing === Direction.LEFT) tx -= 1;
    else if (p.facing === Direction.RIGHT) tx += 1;
    return { x: tx, y: ty };
  }, [playerRef]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Always use current params from ref
      const currentParams = paramsRef.current;
      const {
        keys, status, isShopOpen, isRecyclerOpen, isInventoryOpen, isConstructionOpen,
        setIsInventoryOpen, setIsShopOpen, inventory, setMessage, revealTileAt, depth,
        selectedTarget, handleFlagAction, tutorialState, playerRef, ROPE_X, OVERWORLD_FLOOR_Y, ropeLength,
        startClimbing, HOUSE_X, SHOP_X, RECYCLER_X, CONSTRUCTION_X, timeRef, EVENING_THRESHOLD_MS,
        handleSleep, setIsRecyclerOpen, onRecyclerOpen, setIsConstructionOpen, onConstructionOpen, onConstructionClosed,
        onShopOpen
      } = currentParams;

      // Check if input should be blocked by tutorial logic
      if (currentParams.isInputBlocked) {
        return;
      }

      keys.current[e.key] = true;

      // Re-calculate target here to ensure freshness (though getTargetTile uses ref, so it's fine)
      const p = playerRef.current;
      let tx = Math.floor(p.x + 0.5), ty = Math.floor(p.y + 0.5);
      if (p.facing === Direction.UP) ty -= 1;
      else if (p.facing === Direction.DOWN) ty += 1;
      else if (p.facing === Direction.LEFT) tx -= 1;
      else if (p.facing === Direction.RIGHT) tx += 1;
      const target = { x: tx, y: ty };

      const isMenuOpen = isShopOpen || isRecyclerOpen || isInventoryOpen || isConstructionOpen;

      if (e.key.toLowerCase() === 'i' && status === GameStatus.PLAYING && !isShopOpen && !isRecyclerOpen && !isConstructionOpen) {
        setIsInventoryOpen(prev => !prev);
      }

      if (e.key === ' ' && status === GameStatus.PLAYING && !isMenuOpen && target.y >= 0) {
        if (!inventory.hasPickaxe) {
          setMessage("NO PICKAXE! Visit the Commissary first.");
          setTimeout(() => setMessage(null), 2000);
        } else {
          revealTileAt(target.x, target.y, inventory, depth, true);
        }
      }

      if ((e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'x') && status === GameStatus.PLAYING && !isMenuOpen) {
        // Prioritize manually selected target (e.g. from touch/mouse) over facing direction
        const flagTarget = selectedTarget || target;
        handleFlagAction(flagTarget.x, flagTarget.y, status, isMenuOpen);
      }

      if (e.key.toLowerCase() === 'e' && status === GameStatus.PLAYING && !isMenuOpen) {
        // Block building interactions when tutorial messages or choices are showing
        const isTutorialMessageShowing = tutorialState?.showingMessage && tutorialState?.currentMessage;
        const isTutorialChoiceShowing = tutorialState?.showingChoice;
        if ((isTutorialMessageShowing || isTutorialChoiceShowing) && tutorialState?.currentStep !== 'CONSTRUCTION_HIGHLIGHT_CLOSE' && tutorialState?.currentStep !== 'SHOP_HIGHLIGHT_CLOSE') {
          // Allow E key to be handled by tutorial overlay, don't process building interactions
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        const p = playerRef.current;
        const nearRope = Math.abs(p.x - ROPE_X) < 1.0;
        const atOverworldRope = nearRope && Math.abs(p.y - OVERWORLD_FLOOR_Y) < 0.5;
        const onRopeInMine = nearRope && p.y <= ropeLength && p.y > OVERWORLD_FLOOR_Y && p.y >= 0;

        // Rope interactions take priority
        if (!p.isClimbing && atOverworldRope) {
          // Block mine entry during early tutorial phases
          if (tutorialState?.isActive) {
            const step = tutorialState.currentStep;
            const earlyPhases = ['WELCOME_1', 'WELCOME_2', 'WELCOME_3', 'WELCOME_4', 'WELCOME_5', 'ARROW_TO_SHOP',
              'SHOP_INTRO_1', 'SHOP_INTRO_2', 'SHOP_INTRO_3', 'SHOP_PICKAXE_BOUGHT',
              'SHOP_CLOSE_MENU_1', 'SHOP_CLOSE_MENU_2', 'SHOP_HIGHLIGHT_CLOSE',
              'POST_SHOP_1', 'POST_SHOP_2', 'POST_SHOP_CHOICE', 'POST_SHOP_RESPONSE_ROADS',
              'POST_SHOP_RESPONSE_ROADS_2', 'POST_SHOP_RESPONSE_ATTRACTIONS',
              'POST_SHOP_RESPONSE_ROBOTS', 'POST_SHOP_RESPONSE_ROBOTS_2',
              'POST_SHOP_FINAL_1', 'POST_SHOP_FINAL_2', 'ARROW_TO_CONSTRUCTION',
              'CONSTRUCTION_INTRO_1', 'CONSTRUCTION_INTRO_2', 'CONSTRUCTION_INTRO_3',
              'CONSTRUCTION_INTRO_4', 'CONSTRUCTION_INTRO_5', 'CONSTRUCTION_INTRO_6',
              'CONSTRUCTION_HIGHLIGHT_CLOSE'];
            if (earlyPhases.includes(step)) {
              // Unique messages based on which building is expected
              let message = "Whoa there, miner! You'll need proper equipment from the Commissary first.";
              if (['POST_SHOP_1', 'POST_SHOP_2', 'POST_SHOP_CHOICE', 'POST_SHOP_RESPONSE_ROADS',
                'POST_SHOP_RESPONSE_ROADS_2', 'POST_SHOP_RESPONSE_ATTRACTIONS',
                'POST_SHOP_RESPONSE_ROBOTS', 'POST_SHOP_RESPONSE_ROBOTS_2',
                'POST_SHOP_FINAL_1', 'POST_SHOP_FINAL_2', 'ARROW_TO_CONSTRUCTION',
                'CONSTRUCTION_INTRO_1', 'CONSTRUCTION_INTRO_2', 'CONSTRUCTION_INTRO_3',
                'CONSTRUCTION_INTRO_4', 'CONSTRUCTION_INTRO_5', 'CONSTRUCTION_INTRO_6',
                'CONSTRUCTION_HIGHLIGHT_CLOSE'].includes(step)) {
                message = "The depths can wait! Let's check out what we can build at the Construction Site.";
              }
              setMessage(message);
              setTimeout(() => setMessage(null), 3000);
              return;
            }
          }
          // At overworld rope entrance - descend into mine
          startClimbing('DOWN');
        } else if (!p.isClimbing && onRopeInMine) {
          // On rope in mine - ascend to surface
          startClimbing('UP');
        } else if (p.y < 0) {
          // Overworld building interactions
          const px = p.x;

          // Tutorial building blocking - determine which building is expected
          const getTutorialExpectedBuilding = (): 'shop' | 'construction' | 'mine' | 'recycler' | null => {
            if (!tutorialState?.isActive) return null;
            const step = tutorialState.currentStep;

            // Welcome/Shop phase - expect shop
            if (['WELCOME_1', 'WELCOME_2', 'WELCOME_3', 'WELCOME_4', 'WELCOME_5', 'ARROW_TO_SHOP',
              'SHOP_INTRO_1', 'SHOP_INTRO_2', 'SHOP_INTRO_3', 'SHOP_PICKAXE_BOUGHT',
              'SHOP_CLOSE_MENU_1', 'SHOP_CLOSE_MENU_2', 'SHOP_HIGHLIGHT_CLOSE'].includes(step)) {
              return 'shop';
            }
            // Post-shop and construction phase - expect construction
            if (['POST_SHOP_1', 'POST_SHOP_2', 'POST_SHOP_CHOICE', 'POST_SHOP_RESPONSE_ROADS',
              'POST_SHOP_RESPONSE_ROADS_2', 'POST_SHOP_RESPONSE_ATTRACTIONS',
              'POST_SHOP_RESPONSE_ROBOTS', 'POST_SHOP_RESPONSE_ROBOTS_2',
              'POST_SHOP_FINAL_1', 'POST_SHOP_FINAL_2', 'ARROW_TO_CONSTRUCTION',
              'CONSTRUCTION_INTRO_1', 'CONSTRUCTION_INTRO_2', 'CONSTRUCTION_INTRO_3',
              'CONSTRUCTION_INTRO_4', 'CONSTRUCTION_INTRO_5', 'CONSTRUCTION_INTRO_6',
              'CONSTRUCTION_HIGHLIGHT_CLOSE'].includes(step)) {
              return 'construction';
            }
            // Mine phase - expect mine
            if (['ARROW_TO_MINE', 'MINE_INTRO_1', 'MINE_INTRO_2', 'MINE_INTRO_3', 'MINE_INTRO_4',
              'MINE_INTRO_5', 'MINE_INTRO_6', 'MINE_INTRO_7', 'MINE_INTRO_8', 'MINE_INTRO_9',
              'MINE_HIT_MINE_1', 'MINE_HIT_MINE_2', 'MINE_EXPLAIN_NUMBERS',
              'MINE_COLLECT_1', 'MINE_COLLECT_2', 'MINE_COLLECTED',
              'MINE_CHARGES_1', 'MINE_CHARGES_2'].includes(step)) {
              return 'mine';
            }
            // Recycler phase - expect recycler
            if (['ARROW_TO_RECYCLER', 'RECYCLER_INTRO', 'RECYCLER_PROCESSING',
              'RECYCLER_WAIT_1', 'RECYCLER_WAIT_2', 'RECYCLER_WAIT_3'].includes(step)) {
              return 'recycler';
            }
            return null;
          };

          const expectedBuilding = getTutorialExpectedBuilding();

          // Unique redirect messages for each building/target combination
          const getRedirectMessage = (attemptedBuilding: string, expected: string): string => {
            // Attempted: shop, Expected: something else
            if (attemptedBuilding === 'shop') {
              if (expected === 'construction') return "The Commissary can wait! We've got blueprints to review at the Construction Site.";
              if (expected === 'mine') return "Shopping later! The mine is calling—time to get your hands dirty.";
              if (expected === 'recycler') return "Hold that thought! Let's turn those mines into metal first at the Recycling Center.";
            }
            // Attempted: recycler, Expected: something else
            if (attemptedBuilding === 'recycler') {
              if (expected === 'shop') return "Recycling is for later! First, let's grab some gear at the Commissary.";
              if (expected === 'construction') return "Nice find, but the Construction Site needs you more right now!";
              if (expected === 'mine') return "Nothing to recycle yet! Head to the mine and find some goodies first.";
            }
            // Attempted: construction, Expected: something else
            if (attemptedBuilding === 'construction') {
              if (expected === 'shop') return "Eager to build? I like it! But first, tools await at the Commissary.";
              if (expected === 'mine') return "Plans can wait—adventure calls from the depths of the mine!";
              if (expected === 'recycler') return "Construction dreams aside, the Recycling Center needs attention first.";
            }
            // Attempted: mine, Expected: something else
            if (attemptedBuilding === 'mine') {
              if (expected === 'shop') return "Whoa there, miner! You'll need proper equipment from the Commissary first.";
              if (expected === 'construction') return "The depths can wait! Let's check out what we can build at the Construction Site.";
              if (expected === 'recycler') return "Those mines won't recycle themselves! The Recycling Center awaits.";
            }
            return "One step at a time! Follow the golden arrow.";
          };

          if (Math.abs(px - HOUSE_X) < 1.5) {
            if (timeRef.current <= EVENING_THRESHOLD_MS) handleSleep();
            else {
              setMessage("TOO EARLY TO SLEEP");
              setTimeout(() => setMessage(null), 1000);
            }
          }
          else if (Math.abs(px - SHOP_X) < 1.5) {
            // Block if tutorial expects different building
            if (expectedBuilding && expectedBuilding !== 'shop') {
              setMessage(getRedirectMessage('shop', expectedBuilding));
              setTimeout(() => setMessage(null), 3000);
              return;
            }
            if (!isShopOpen) {
              setIsShopOpen(true);
              onShopOpen?.(); // Trigger tutorial when opening
            } else {
              setIsShopOpen(false);
            }
          }
          else if (Math.abs(px - RECYCLER_X) < 1.5) {
            // Block if tutorial expects different building
            if (expectedBuilding && expectedBuilding !== 'recycler') {
              setMessage(getRedirectMessage('recycler', expectedBuilding));
              setTimeout(() => setMessage(null), 3000);
              return;
            }
            setIsRecyclerOpen(prev => {
              if (!prev) {
                onRecyclerOpen?.(); // Trigger tutorial when opening
              }
              return !prev;
            });
          }
          else if (Math.abs(px - CONSTRUCTION_X) < 2) {
            // Block if tutorial expects different building
            if (expectedBuilding && expectedBuilding !== 'construction') {
              setMessage(getRedirectMessage('construction', expectedBuilding));
              setTimeout(() => setMessage(null), 3000);
              return;
            }
            if (!isConstructionOpen) {
              setIsConstructionOpen(true);
              onConstructionOpen?.(); // Trigger tutorial when opening
            } else {
              onConstructionClosed?.(); // Trigger tutorial callback when closing
              setIsConstructionOpen(false);
            }
          }
        } else if (p.y >= 0 && !nearRope) {
          // In mine but not near rope
          setMessage("Signal too weak. Return to surface.");
          setTimeout(() => setMessage(null), 2000);
        }
      }
    };

    const up = (e: KeyboardEvent) => {
      // Access params from ref
      const currentParams = paramsRef.current;
      currentParams.keys.current[e.key] = false;
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []); // Empty dependency array - listeners attached ONCE and never re-bound

  return { getTargetTile };
};

