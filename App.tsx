
import React, { useEffect, useCallback, useRef, useState } from 'react';
import { GameStatus, Direction, ItemType } from './types';
import { GRID_CONFIG, COLORS, CARD_DEFINITIONS, INITIAL_ROPE_LENGTH, DAY_DURATION_MS, EVENING_THRESHOLD_MS, RECYCLE_TIME_MS } from './constants';
import ShopOverlay from './components/ShopOverlay';
import InventoryOverlay from './components/InventoryOverlay';
import RecyclingOverlay from './components/RecyclingOverlay';
import ConstructionOverlay from './components/ConstructionOverlay';
import OptionsOverlay from './components/OptionsOverlay';
import MainMenu from './components/MainMenu';
import OverworldSection from './components/overworld/OverworldSection';
import MiningSection from './components/MiningSection';
import GameHUD from './components/GameHUD';
import TutorialOverlay from './components/TutorialOverlay';
import DevToolsOverlay from './components/DevToolsOverlay';
import DeathScreen, { DeathPhase } from './components/DeathScreen';
import { useWorldUpdates } from './hooks/useWorldUpdates';
import { usePhysics } from './hooks/usePhysics';
import { useMining } from './hooks/useMining';
import { useGameActions } from './hooks/useGameActions';
import { useKeyboard } from './hooks/useKeyboard';
import { useGameState } from './hooks/useGameState';
import { useTutorial } from './hooks/useTutorial';
import { useTutorialGuard } from './hooks/useTutorialGuard';
import { useGameSettings } from './hooks/useGameSettings';
import { useSaveGame } from './hooks/useSaveGame';
import { useMusic } from './hooks/useMusic';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import TutorialController from './components/TutorialController';
import { WorldOverlay } from './components/WorldOverlay';
import TouchControls from './components/TouchControls';
import ErrorBoundary from './components/ErrorBoundary';

const DEBUG_MODE = true;

const App: React.FC = () => {
  const state = useGameState();
  const tutorial = useTutorial();
  const { isMobile, isLandscape } = useDeviceDetection();
  const { settings, updateSetting, resetSettings } = useGameSettings();
  const saveSystem = useSaveGame();
  const { startMusic, startMenuMusic, toggleMute, isMuted } = useMusic({
    masterVolume: settings.masterVolume,
    musicVolume: settings.musicVolume,
  });
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [gameFadingIn, setGameFadingIn] = useState(false);

  // Death sequence state
  const [deathPhase, setDeathPhase] = useState<DeathPhase>('NONE');
  const [deathDepth, setDeathDepth] = useState(0);
  const [furthestDepth, setFurthestDepth] = useState(0);

  // Camera State Ref for sticky mode (Mine vs Overworld)
  const isMineModeRef = useRef(false);
  // Scale Ref for camera calculations (to avoid closure staleness)
  const scaleRef = useRef(1);

  // Check for save game on mount
  useEffect(() => {
    setHasSave(saveSystem.hasSaveGame());
  }, [saveSystem]);

  // Virtual game dimensions (must match the values in render)
  const VIRTUAL_WIDTH = 1200;
  const VIRTUAL_HEIGHT = 800;

  // Responsive scaling - calculates scale factor based on viewport size
  // Enhanced "Compact Mode" check: Treat as mobile layout if strict isMobile is true OR screen width is small (< 1024px)
  // This ensures the layout adapts (hides sidebar, full width) even if touch detection fails or on small desktop windows
  const isCompact = isMobile || (typeof window !== 'undefined' && window.innerWidth < 1024);

  useEffect(() => {
    const calculateScale = () => {
      const padding = 20; // Small padding around the game
      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - padding;

      // Calculate scale factors for both dimensions
      const scaleX = availableWidth / VIRTUAL_WIDTH;
      const scaleY = availableHeight / VIRTUAL_HEIGHT;

      // Use the smaller scale to maintain aspect ratio
      const newScale = Math.min(scaleX, scaleY);

      // Clamp between 0.4 (minimum readable) and 1.5 (slight upscale allowed)
      // On mobile, Apply a 1.6x zoom multiplier to get the camera closer (User request)
      const mobileMultiplier = isMobile ? 1.6 : 1;

      // Dynamic Zoom: Zoom in ~45% more when inside the mine (y >= 0)
      // Base mobile zoom 1.6 * 1.2 = 1.92. New request: "Another 20%" -> 1.44 mine multiplier.
      const mineMultiplier = isMineModeRef.current ? 1.44 : 1.0;

      const finalScale = Math.max(0.4, Math.min(1.5, newScale * mobileMultiplier * mineMultiplier));
      setScale(finalScale);
      scaleRef.current = finalScale;
    };

    calculateScale();
    calculateScale();
    window.addEventListener('resize', calculateScale);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', calculateScale);
    }
    return () => {
      window.removeEventListener('resize', calculateScale);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', calculateScale);
      }
    };
  }, [isMobile, state.player.y]); // Added dependency on player.y to trigger zoom change

  const ROPE_X = 8;
  const HOUSE_X = -2;  // Moved left to make room for rope mechanism
  const RECYCLER_X = -8;
  const SHOP_X = 13.5;
  const CONSTRUCTION_X = 22;
  const OVERWORLD_FLOOR_Y = -2;

  const { updateTimers } = useWorldUpdates();
  const { updatePhysics } = usePhysics();

  const actions = useGameActions(
    state.setCoins, state.setInventory, state.setMessage, state.setDayTime,
    state.setDayCount, state.setRopeLength, state.playerRef, state.setPlayer,
    state.timeRef, { current: [] } as any, ROPE_X, OVERWORLD_FLOOR_Y
  );

  // Flash effect state for mine explosion
  const [explosionFlash, setExplosionFlash] = useState(false);

  // Death sequence trigger - handles the full death animation flow
  const triggerDeathSequence = useCallback(() => {
    // Record depth at death
    const currentDepth = state.depth;
    setDeathDepth(currentDepth);

    // Update furthest depth record
    setFurthestDepth(prev => Math.max(prev, currentDepth));

    // Apply item loss via actions
    actions.handlePlayerDeath(state.dayCount);

    // If in tutorial, mark as died so we can show resurrection message
    if (tutorial.tutorialState.isActive) {
      tutorial.onTutorialDeath();
    }

    // Start death sequence: IMPACT phase
    setDeathPhase('IMPACT');
    if (state.setScreenShake) state.setScreenShake(1);
    setExplosionFlash(true);

    // After 800ms, transition to FADE
    setTimeout(() => {
      if (state.setScreenShake) state.setScreenShake(0);
      setExplosionFlash(false);
      setDeathPhase('FADE');

      // After fade (600ms), show REPAIRING screen
      setTimeout(() => {
        setDeathPhase('REPAIRING');
      }, 600);
    }, 800);
  }, [state.depth, state.dayCount, state.setScreenShake, actions]);

  // Intercept the tutorial's mine hit handler to inject visual effects first
  const handleMineHitWithEffects = useCallback(() => {
    // 1. Trigger Screen Shake
    if (state.setScreenShake) state.setScreenShake(1);

    // 2. Trigger White Flash
    setExplosionFlash(true);

    // 3. Wait for effects to subside (1s) before showing tutorial text
    setTimeout(() => {
      if (state.setScreenShake) state.setScreenShake(0);
      setExplosionFlash(false);
      tutorial.onMineHit();
    }, 1200);
  }, [state.setScreenShake, tutorial.onMineHit]);

  const mining = useMining(
    ROPE_X, state.setDepth, state.setStatus, state.setInventory,
    state.setMessage, triggerDeathSequence,
    state.setWorldItems,
    tutorial.tutorialState,
    handleMineHitWithEffects, // Use our intercepted handler
    tutorial.onTileRevealed,
    tutorial.onMineCollected,
    state.setScreenShake,
    state.setPlayerHitFlash,
    tutorial.onMineAttemptInterrupt,
    tutorial.onTileFlagged,
    tutorial.onObviousMineIgnored
  );

  // Injected real gridRef into actions
  const actionsWithGrid = useGameActions(
    state.setCoins, state.setInventory, state.setMessage, state.setDayTime,
    state.setDayCount, state.setRopeLength, state.playerRef, state.setPlayer,
    state.timeRef, mining.gridRef, ROPE_X, OVERWORLD_FLOOR_Y
  );

  const isSolid = useCallback((cx: number, cy: number) => {
    if (cy < -8) return true;
    if (cy < 0) return cy >= -1;
    const tx = Math.floor(cx), ty = Math.floor(cy);
    if (tx < 0 || tx >= GRID_CONFIG.COLUMNS || ty >= GRID_CONFIG.ROWS) return true;
    const tile = mining.gridRef.current[ty]?.[tx];
    return !tile || !tile.isRevealed || tile.item === 'SILVER_BLOCK';
  }, [mining.gridRef]);

  const startClimbing = useCallback((direction: 'UP' | 'DOWN') => {
    state.playerRef.current.isClimbing = true;
    state.playerRef.current.vx = 0; state.playerRef.current.vy = 0; state.playerRef.current.x = ROPE_X;
    const targetY = direction === 'UP' ? OVERWORLD_FLOOR_Y : 0, startY = state.playerRef.current.y;
    const distance = Math.abs(targetY - startY), duration = Math.max(500, distance * 150), startTime = Date.now();
    const climbFrame = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      state.playerRef.current.y = startY + (targetY - startY) * (1 - Math.pow(1 - progress, 3));
      state.setPlayer({ ...state.playerRef.current });
      if (progress < 1) requestAnimationFrame(climbFrame);
      else { state.playerRef.current.isClimbing = false; state.playerRef.current.y = targetY; state.playerRef.current.vy = 0; state.canJumpRef.current = false; state.setPlayer({ ...state.playerRef.current }); }
    };
    requestAnimationFrame(climbFrame);
  }, [ROPE_X, OVERWORLD_FLOOR_Y, state.playerRef, state.setPlayer, state.canJumpRef]);

  // Rope interaction is now handled by E key in useKeyboard
  const checkRopeInteraction = useCallback(() => {
    // No-op - kept for compatibility with usePhysics
  }, []);

  // Smart flag handler: if target tile is already revealed (or invalid), try flagging the tile under the player
  // This helps when the player is standing ON the mine they want to flag
  const smartHandleFlagAction = useCallback((tx: number, ty: number, status: GameStatus, isMenuOpen: boolean) => {
    const grid = mining.gridRef.current;
    if (!grid) return;

    const targetTile = grid[ty]?.[tx];

    // If target is valid and HIDDEN, flag it normally
    if (targetTile && !targetTile.isRevealed) {
      // Check range for manual target (prevent infinite range flagging)
      const p = state.playerRef.current;
      const dx = Math.abs(tx - p.x);
      const dy = Math.abs(ty - p.y);
      if (dx < 1.8 && dy < 1.8) {
        mining.handleFlagAction(tx, ty, status, isMenuOpen);
      }
      return;
    }

    // Fallback: Check player tile
    const p = state.playerRef.current;
    const pTx = Math.floor(p.x + 0.5);
    const pTy = Math.floor(p.y + 0.5);
    const playerTile = grid[pTy]?.[pTx];

    // If player is standing on a hidden tile, flag that instead
    if (playerTile && !playerTile.isRevealed) {
      mining.handleFlagAction(pTx, pTy, status, isMenuOpen);
      return;
    }

    // Otherwise try target anyway (standard behavior) but strict range
    const dist = Math.sqrt(Math.pow(tx - p.x, 2) + Math.pow(ty - p.y, 2));
    if (dist < 1.8) {
      mining.handleFlagAction(tx, ty, status, isMenuOpen);
    }
  }, [mining.handleFlagAction, mining.gridRef, state.playerRef]);



  const initGame = useCallback(() => {
    // Start with fade-in effect
    setGameFadingIn(true);

    mining.initGrid();
    const startPos = { x: HOUSE_X, y: OVERWORLD_FLOOR_Y, vx: 0, vy: 0, facing: Direction.DOWN, isClimbing: false };
    state.playerRef.current = startPos;
    state.setPlayer(startPos);

    // Initialize camera to center on player's starting position
    // Use a rough estimate for initial centering (will be refined by update loop)
    const initialCamX = (startPos.x * GRID_CONFIG.TILE_SIZE) + (GRID_CONFIG.TILE_SIZE / 2) - (VIRTUAL_WIDTH / 2);
    const initialCamY = (startPos.y * GRID_CONFIG.TILE_SIZE) - (VIRTUAL_HEIGHT / 2);
    state.cameraRef.current = { x: initialCamX, y: initialCamY };
    state.setCamera({ x: initialCamX, y: initialCamY });

    // Reset mine mode ref to false (we're in overworld)
    isMineModeRef.current = false;

    state.setStatus(GameStatus.PLAYING);
    state.setDepth(0);
    state.setCoins(0);
    state.setInventory({
      silverBlocks: 0, stone: 0, disarmKits: 1, disarmCharges: 3, defusedMines: 0, scrapMetal: 0, gems: 0, coal: 0,
      deck: [], collection: [], wishingWellBuilt: false, wishingWellProgress: { stone: 0, silver: 0 },
      hasPickaxe: false
    });
    state.setWorldItems([]);
    state.recyclingRef.current = { queue: 0, timer: RECYCLE_TIME_MS };
    state.setRecyclingDisplay({ queue: 0, progress: 0 });
    state.timeRef.current = DAY_DURATION_MS;
    state.setDayTime(DAY_DURATION_MS);
    state.setDayCount(1);
    state.wellIncomeRef.current = 60000;
    startMusic(); // Start background music

    // Clear fade-in after animation completes
    setTimeout(() => setGameFadingIn(false), 600);

    // Check for tutorial resurrection message on day start
    tutorial.checkResurrection();

    // Reset tutorial state for fresh run (important for New Game from menu)
    tutorial.resetTutorial();
  }, [mining, state, OVERWORLD_FLOOR_Y, HOUSE_X, startMusic, tutorial]);

  // Handle "Next Day" after death sequence
  const handleDeathNextDay = useCallback(() => {
    // Reset death phase
    setDeathPhase('NONE');

    // Advance to next day using sleep (forced)
    actionsWithGrid.handleSleep(true, state.dayCount);

    // Regenerate mine grid for new day
    mining.initGrid();

    // Start fade-in
    setGameFadingIn(true);
    setTimeout(() => setGameFadingIn(false), 600);
  }, [actionsWithGrid, state.dayCount, mining]);

  // Trigger tutorial when shop opens
  useEffect(() => {
    if (state.isShopOpen) {
      tutorial.onShopOpened();
    }
  }, [state.isShopOpen, tutorial]);

  // Track previous player y position to detect mine entry
  const prevPlayerYRef = useRef<number>(state.player.y);

  // Trigger mine tutorial when player first enters the mine, or re-show arrow when leaving
  useEffect(() => {
    const wasInOverworld = prevPlayerYRef.current < 0;
    const wasInMine = prevPlayerYRef.current >= 0;
    const isInMine = state.player.y >= 0;
    const isInOverworld = state.player.y < 0;

    // Entering mine from overworld
    if (wasInOverworld && isInMine && tutorial.tutorialState.currentStep === 'ARROW_TO_MINE') {
      // Start the timer (it should already be running, but ensure it's active)
      // The timer callback will be called when MINE_INTRO_2 is reached
      tutorial.onMineEntered(() => {
        // Reset and start the timer when MINE_INTRO_2 is reached
        state.timeRef.current = DAY_DURATION_MS;
        state.setDayTime(DAY_DURATION_MS);
      });
    }

    // Player descends during recycler phase - trigger ascend arrow
    if (wasInOverworld && isInMine && tutorial.tutorialState.currentStep === 'ARROW_TO_RECYCLER') {
      tutorial.onMineEntered(() => { });
    }

    // Leaving mine back to overworld during mine tutorial - re-show arrow
    if (wasInMine && isInOverworld && tutorial.tutorialState.isActive) {
      tutorial.onPlayerReturnedToOverworld();
    }

    prevPlayerYRef.current = state.player.y;
  }, [state.player.y, tutorial]);

  // Dev tools toggle with backtick key
  useEffect(() => {
    const handleDevToolsKey = (e: KeyboardEvent) => {
      if (e.key === '`' && state.status === GameStatus.PLAYING) {
        e.preventDefault();
        setIsDevToolsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleDevToolsKey);
    return () => window.removeEventListener('keydown', handleDevToolsKey);
  }, [state.status]);

  // Instantiate Tutorial Guard
  const tutorialGuard = useTutorialGuard(tutorial.tutorialState, mining.grid);

  // Safe reveal with Tutorial Guard checks
  const safeRevealTileAt = useCallback((x: number, y: number, inventory: Inventory, depth: number, isInitial: boolean = true) => {
    const permission = tutorialGuard.canMine(x, y);
    if (!permission.allowed) {
      if ((permission.reason === 'ANTI_CHEAT' || permission.reason === 'OBVIOUS_MINE_IGNORED') && permission.minePos) {
        tutorial.onObviousMineIgnored(permission.minePos);
      }
      // If reason is TUTORIAL_BLOCK, we just silently block
      return;
    }
    mining.revealTileAt(x, y, inventory, depth, isInitial);
  }, [tutorialGuard, mining.revealTileAt, tutorial.onObviousMineIgnored]);

  // Handle Tile Interaction (Tap/Click)
  const handleTileInteraction = useCallback((x: number, y: number) => {
    // 1. Check bounds and validity
    if (x < 0 || y < 0 || x >= GRID_CONFIG.COLUMNS || y >= GRID_CONFIG.ROWS) return;

    // 2. Check Range
    const dx = Math.abs(x - state.player.x);
    const dy = Math.abs(y - state.player.y);
    const inRange = dx < 1.8 && dy < 1.8;

    // Check for diagonal blocking - if both adjacent tiles are unrevealed, diagonal is blocked
    const isDiagonal = Math.abs(Math.round(x - state.player.x)) === 1 && Math.abs(Math.round(y - state.player.y)) === 1;
    let isDiagonalBlocked = false;
    if (isDiagonal && y >= 0) {
      const playerTileX = Math.round(state.player.x);
      const playerTileY = Math.round(state.player.y);
      const targetTileX = x;
      const targetTileY = y;

      // Get the two adjacent tiles that form the L-path
      const adj1X = playerTileX;
      const adj1Y = targetTileY;
      const adj2X = targetTileX;
      const adj2Y = playerTileY;

      // Check if both adjacent tiles exist and are unrevealed (blocking the diagonal)
      const adj1 = mining.grid[adj1Y]?.[adj1X];
      const adj2 = mining.grid[adj2Y]?.[adj2X];

      // If both adjacent tiles exist and are unrevealed, diagonal is blocked
      if (adj1 && !adj1.isRevealed && adj2 && !adj2.isRevealed) {
        isDiagonalBlocked = true;
      }
    }

    // If tapping the already selected target...
    if (mining.selectedTarget?.x === x && mining.selectedTarget?.y === y) {
      if (inRange && !isDiagonalBlocked) {
        // Confirm Mine
        safeRevealTileAt(x, y, state.inventory, state.depth);
        mining.setSelectedTarget(null);
        // Play dig sound? (implicitly handled by reveal logic or listener?)
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(20);
      } else if (isDiagonalBlocked) {
        // Diagonal blocked feedback
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
      } else {
        // Out of range feedback - shake selection?
        // Just keep selected.
        if (navigator.vibrate) navigator.vibrate(50);
      }
    } else {
      // Select new target (even if blocked, so player can see it's selected)
      mining.setSelectedTarget({ x, y });

      // Clear selection if tapping a revealed tile?
      // Check grid state directly
      if (mining.grid[y] && mining.grid[y][x] && mining.grid[y][x].isRevealed) {
        // If revealed, maybe just ignore or clear?
        // Allow selecting revealed tiles? Maybe to read info? nothing to read really.
        // Better: Only select unrevealed tiles.
        // Unless it's a revealed tile with an item?
      }
    }
  }, [state.player, mining.grid, mining.selectedTarget, safeRevealTileAt, mining.setSelectedTarget, state.inventory, state.depth]);

  const { getTargetTile } = useKeyboard({
    status: state.status, isShopOpen: state.isShopOpen, isRecyclerOpen: state.isRecyclerOpen,
    isInventoryOpen: state.isInventoryOpen, isConstructionOpen: state.isConstructionOpen,
    playerRef: state.playerRef, ropeLength: state.ropeLength, inventory: state.inventory,
    timeRef: state.timeRef, EVENING_THRESHOLD_MS, HOUSE_X, SHOP_X, RECYCLER_X,
    CONSTRUCTION_X, ROPE_X, OVERWORLD_FLOOR_Y, keys: state.keys,
    setIsInventoryOpen: state.setIsInventoryOpen, setIsShopOpen: state.setIsShopOpen,
    setIsRecyclerOpen: state.setIsRecyclerOpen, setIsConstructionOpen: state.setIsConstructionOpen,
    setMessage: state.setMessage, revealTileAt: safeRevealTileAt, startClimbing,
    handleFlagAction: smartHandleFlagAction,
    handleSleep: () => actionsWithGrid.handleSleep(false, state.dayCount),
    onShopOpen: tutorial.onShopOpened,
    onConstructionOpen: tutorial.onConstructionOpened,
    onConstructionClosed: tutorial.onConstructionClosed,
    onRecyclerOpen: tutorial.onRecyclerOpened,
    tutorialState: tutorial.tutorialState,
    depth: state.depth,
    selectedTarget: mining.selectedTarget,
    isInputBlocked: tutorialGuard.isInputBlocked()
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const update = useCallback(() => {
    const delta = 16.66;
    updateTimers({
      status: state.status, dayTime: state.dayTime, setDayTime: state.setDayTime,
      timeRef: state.timeRef, handlePassOut: () => actionsWithGrid.handlePassOut(state.coins, state.dayCount),
      inventory: state.inventory, setInventory: state.setInventory, setCoins: state.setCoins,
      wellIncomeRef: state.wellIncomeRef, recyclingRef: state.recyclingRef,
      RECYCLE_TIME_MS, RECYCLER_X, OVERWORLD_FLOOR_Y, setWorldItems: state.setWorldItems,
      setMessage: state.setMessage, setRecyclingDisplay: state.setRecyclingDisplay,
      tutorialState: tutorial.tutorialState
    }, delta);

    if (state.isShopOpen || state.isRecyclerOpen || state.isInventoryOpen || state.isConstructionOpen) return;

    updatePhysics({
      playerRef: state.playerRef, keys: state.keys, canJumpRef: state.canJumpRef,
      isSolid, setPlayer: state.setPlayer, setWorldItems: state.setWorldItems,
      setInventory: state.setInventory, setCoins: state.setCoins,
      gridRef: mining.gridRef, setGrid: mining.setGrid, checkRopeInteraction,
      setMessage: state.setMessage
    });

    // --- CAMERA LOGIC ---
    const currentScale = scaleRef.current || 1;

    // Calculate the TRUE visible viewport in game units
    // The game container is scaled, so when zoomed in (scale > 1), it overflows the screen
    // What's actually visible on screen:
    // - Screen pixels for game area = window.innerWidth - (sidebar on screen)
    // - Sidebar on screen = 256 * scale (it's inside the scaled container)
    // - Visible game units = screen pixels / scale
    // Simplified: visibleWidth = (window.innerWidth / scale) - 256
    const SIDEBAR_WIDTH = 256;
    const visibleWidth = Math.max(200, (window.innerWidth / currentScale) - SIDEBAR_WIDTH);
    const visibleHeight = Math.max(200, window.innerHeight / currentScale);

    const p = state.playerRef.current;

    // Mine dimensions  
    const MINE_WIDTH = GRID_CONFIG.COLUMNS * GRID_CONFIG.TILE_SIZE;

    // Player's target position in world coordinates (center of player tile)
    let targetCamX = (p.x * GRID_CONFIG.TILE_SIZE) + (GRID_CONFIG.TILE_SIZE / 2);

    // No special clamping - just track player directly

    // Convert world target to camera position (top-left of screen, in game units)
    const idealX = targetCamX - (visibleWidth / 2);
    // Ignore upward movement (jumps) in overworld by clamping Y to 0
    const trackingY = Math.max(0, p.y);
    const idealY = trackingY * GRID_CONFIG.TILE_SIZE - (visibleHeight / 2);

    // Vertical Cam Logic:
    // Sticky Mine Mode: Enter mine mode when deep enough (>2). Exit only when back in overworld (<0).
    // This prevents jitter when jumping near the ceiling.
    if (p.y > 2) isMineModeRef.current = true;
    if (p.y < 0) isMineModeRef.current = false;

    // If in mine mode, strictly clamp Y to 0 (mine entrance). Otherwise allow overworld view (-20 tiles).
    const minCamY = isMineModeRef.current ? 0 : -20 * GRID_CONFIG.TILE_SIZE;
    const maxCamY = (GRID_CONFIG.ROWS * GRID_CONFIG.TILE_SIZE) - (visibleHeight / 2); // Allow scrolling to bottom
    const clampedY = Math.max(minCamY, Math.min(idealY, maxCamY));

    // Smooth Lerp - Faster vertical tracking (0.3) to keep player centered
    state.cameraRef.current.x += (idealX - state.cameraRef.current.x) * 0.1;
    state.cameraRef.current.y += (clampedY - state.cameraRef.current.y) * 0.3;

    state.setCamera({ x: state.cameraRef.current.x, y: state.cameraRef.current.y });
    state.requestRef.current = requestAnimationFrame(update);
  }, [state, mining, updateTimers, actionsWithGrid, updatePhysics, isSolid, checkRopeInteraction, OVERWORLD_FLOOR_Y]);

  useEffect(() => {
    if (state.status === GameStatus.PLAYING) state.requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(state.requestRef.current);
  }, [update, state.status, state.requestRef]);

  // Load saved game
  const loadSavedGame = useCallback(() => {
    const saveData = saveSystem.loadGame();
    if (!saveData) return;

    // Start with fade-in effect
    setGameFadingIn(true);

    state.playerRef.current = saveData.player;
    state.setPlayer(saveData.player);
    state.setCoins(saveData.coins);
    state.setInventory(saveData.inventory);
    state.timeRef.current = saveData.dayTime;
    state.setDayTime(saveData.dayTime);
    state.setDayCount(saveData.dayCount);
    state.setRopeLength(saveData.ropeLength);
    state.setDepth(saveData.depth);
    mining.setGrid(saveData.grid);
    state.setStatus(GameStatus.PLAYING);
    startMusic(); // Start background music
    if (saveData.tutorialCompleted) {
      tutorial.skipTutorial(() => { });
    }

    // Clear fade-in after animation completes
    setTimeout(() => setGameFadingIn(false), 600);
  }, [saveSystem, state, mining, tutorial, startMusic]);

  // Auto-save when day ends or entering buildings
  const performAutoSave = useCallback(() => {
    if (state.status !== GameStatus.PLAYING) return;
    saveSystem.saveGame(
      state.playerRef.current,
      state.coins,
      state.inventory,
      state.timeRef.current,
      state.dayCount,
      state.ropeLength,
      state.depth,
      mining.gridRef.current,
      tutorial.tutorialState.tutorialCompleted
    );
    setHasSave(true);
  }, [saveSystem, state, mining.gridRef, tutorial.tutorialState.tutorialCompleted]);

  // Auto-save on day change
  useEffect(() => {
    if (state.status === GameStatus.PLAYING && state.dayCount > 1) {
      performAutoSave();
    }
  }, [state.dayCount, state.status, performAutoSave]);

  // Enforce Landscape Mode Globally (including Start Screen)
  if (isMobile && !isLandscape) {
    return (
      <div className="fixed inset-0 z-[9999] bg-stone-950 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-300">
        <div className="text-6xl mb-6 animate-pulse">📱</div>
        <h2 className="text-2xl font-black text-amber-500 uppercase tracking-widest mb-4">Rotate Your Device</h2>
        <p className="text-stone-400 font-mono text-sm max-w-xs leading-relaxed">
          Sweeper Bot requires a wider view to detect deep mines safely.
          <br /><br />
          Please rotate to <span className="text-white font-bold">Landscape Mode</span>.
        </p>
      </div>
    );

  }


  // Enforce Zoom Level (Prevent accidental browser/pinch zoom cutting off UI)
  const isZoomed = typeof window !== 'undefined' && window.visualViewport && (window.visualViewport.scale > 1.1 || window.visualViewport.scale < 0.9);
  if (isZoomed) {
    return (
      <div className="fixed inset-0 z-[9999] bg-stone-950 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-300">
        <div className="text-6xl mb-6 animate-pulse">🔍</div>
        <h2 className="text-2xl font-black text-amber-500 uppercase tracking-widest mb-4">Zoom Level Incorrect</h2>
        <p className="text-stone-400 font-mono text-sm max-w-xs leading-relaxed">
          The game view is currently zoomed {window.visualViewport?.scale > 1 ? 'in' : 'out'}, which may break the layout.
          <br /><br />
          Please <span className="text-white font-bold">Reset Zoom</span> to 100% to continue.
        </p>
      </div>
    );
  }

  if (state.status === GameStatus.START) return (
    <>
      <MainMenu
        hasSave={hasSave}
        onStartNewGame={() => {
          if (hasSave) {
            saveSystem.deleteSave();
            setHasSave(false);
          }
          initGame();
        }}
        onContinueGame={loadSavedGame}
        onOpenOptions={() => setIsOptionsOpen(true)}
        startMenuMusic={startMenuMusic}
        toggleMute={toggleMute}
        isMuted={isMuted}
        isOptionsOpen={isOptionsOpen}
        settings={settings}
        onUpdateSetting={updateSetting}
        onResetSettings={resetSettings}
        onCloseOptions={() => setIsOptionsOpen(false)}
      />
      {isOptionsOpen && (
        <OptionsOverlay
          settings={settings}
          onUpdateSetting={updateSetting}
          onResetSettings={resetSettings}
          onClose={() => setIsOptionsOpen(false)}
        />
      )}
    </>
  );

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  // Interaction Prompts
  const canClimb = !state.player.isClimbing && Math.abs(state.player.x - ROPE_X) < 0.5 &&
    (Math.abs(state.player.y - OVERWORLD_FLOOR_Y) < 0.5 || (state.player.y <= state.ropeLength && state.player.y > OVERWORLD_FLOOR_Y && state.player.y >= 0));
  // Ascend prompt ONLY during tutorial (when showArrowToRope is true) AND player is in mine (y >= 0)
  const showRopePrompt = canClimb && tutorial.tutorialState.showArrowToRope && state.player.y >= 0;
  const ropePromptText = Math.abs(state.player.y - OVERWORLD_FLOOR_Y) < 0.5 ? "DESCEND [E]" : "ASCEND [E]";

  const showShopPrompt = state.player.y < 0 && Math.abs(state.player.x - SHOP_X) < 1.5 && !state.isShopOpen;
  const showHousePrompt = state.player.y < 0 && Math.abs(state.player.x - HOUSE_X) < 1.5;
  const housePromptText = state.timeRef.current <= EVENING_THRESHOLD_MS ? "SLEEP [E]" : "DAYLIGHT REMAINING";
  const showRecyclerPrompt = state.player.y < 0 && Math.abs(state.player.x - RECYCLER_X) < 1.5 && !state.isRecyclerOpen;
  const showConstructionPrompt = state.player.y < 0 && Math.abs(state.player.x - CONSTRUCTION_X) < 2 && !state.isConstructionOpen;

  return (
    <div
      className="h-[100dvh] w-screen bg-black overflow-hidden relative"
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#000000',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Scaled game wrapper - centers the scaled content */}
      <div
        className="relative bg-black text-stone-200 font-mono cursor-none overflow-hidden"
        style={{
          width: Math.max(VIRTUAL_WIDTH, window.innerWidth / scale),
          height: Math.max(VIRTUAL_HEIGHT, window.innerHeight / scale),
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div className="flex w-full h-full">
          <div className="flex-1 relative">
            <GameHUD coins={state.coins} dayTime={state.dayTime} dayCount={state.dayCount} EVENING_THRESHOLD_MS={EVENING_THRESHOLD_MS} formatTime={formatTime} depth={state.depth} inventory={state.inventory} setIsInventoryOpen={state.setIsInventoryOpen} message={state.message} flashTimer={tutorial.tutorialState.flashTimer} highlightDisarmKit={tutorial.tutorialState.highlightDisarmKit} isMobile={isCompact} taskMinimized={tutorial.tutorialState.taskMinimized} onToggleTaskMinimized={tutorial.toggleTaskMinimized} onOpenDevTools={() => setIsDevToolsOpen(true)} />

            {/* Game content area - positioned after sidebar, extends to screen edge to eliminate right border */}
            <div ref={viewportRef} className={`absolute ${isCompact ? 'left-0' : 'left-64'} top-0 bottom-0 pt-20 overflow-hidden bg-black`} style={{ right: 0 }}>
              {/* Rendering: Applies calculated X and Y as a negative translation */}
              <div
                className="w-full h-full will-change-transform"
                style={{ transform: `translate3d(${-state.camera.x}px, ${-state.camera.y}px, 0)` }}
                onContextMenu={handleContextMenu}
              >
                <div className={`w-full h-full ${state.screenShake > 0 && settings.screenShake ? 'animate-shake' : ''}`}>
                  <OverworldSection dayTime={state.dayTime} dayCount={state.dayCount} EVENING_THRESHOLD_MS={EVENING_THRESHOLD_MS} DAY_DURATION_MS={DAY_DURATION_MS} ROPE_X={ROPE_X} HOUSE_X={HOUSE_X} SHOP_X={SHOP_X} RECYCLER_X={RECYCLER_X} CONSTRUCTION_X={CONSTRUCTION_X} ropeLength={state.ropeLength} inventory={state.inventory} isShopOpen={state.isShopOpen} isRecyclerOpen={state.isRecyclerOpen} isConstructionOpen={state.isConstructionOpen} recyclingDisplay={state.recyclingDisplay} tutorialState={tutorial.tutorialState} playerX={state.player.x} getSkyGradient={() => {
                    const r = state.dayTime / DAY_DURATION_MS;
                    if (r > 0.3) return `linear-gradient(to bottom, ${COLORS.SKY_TOP}, ${COLORS.SKY_BOTTOM})`;
                    return r > 0.15 ? 'linear-gradient(to bottom, #1e1b4b, #f97316)' : 'linear-gradient(to bottom, #0f172a, #312e81)';
                  }} />
                  <MiningSection
                    grid={mining.grid}
                    player={state.player}
                    worldItems={state.worldItems}
                    currentTarget={getTargetTile()}
                    ropeLength={state.ropeLength}
                    ROPE_X={ROPE_X}
                    playerHitFlash={state.playerHitFlash}
                    isDead={deathPhase === 'IMPACT' || deathPhase === 'FADE'}
                    prompts={{
                      showRopePrompt, ropePromptText,
                      showShopPrompt, showHousePrompt, housePromptText,
                      showRecyclerPrompt, showConstructionPrompt,
                      canSleep: state.timeRef.current <= EVENING_THRESHOLD_MS
                    }}
                    foundMinePosition={tutorial.tutorialState.foundMinePosition}
                    selectedTarget={mining.selectedTarget}
                    onTileClick={handleTileInteraction}
                  />

                  {/* Unified Scaling Overlay - Anchored to World Coordinates */}
                  <WorldOverlay
                    foundMinePosition={tutorial.tutorialState.foundMinePosition}
                    ropeX={ROPE_X}
                    ropeBubbleVisible={showRopePrompt}
                    scale={scale} // Pass global scale for counter-scaling icons
                    isMenuOpen={state.isShopOpen || state.isRecyclerOpen || state.isInventoryOpen || state.isConstructionOpen}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {state.isShopOpen && <ShopOverlay
        coins={state.coins}
        inventory={state.inventory}
        onBuy={(id, p) => {
          if (id === 'PICKAXE' && !tutorial.tutorialState.pickaxeTaken) {
            tutorial.onPickaxeTaken();
          }
          actionsWithGrid.handleShopBuy(id, p, state.coins, state.ropeLength);
        }}
        onSell={actionsWithGrid.handleShopSell}
        onClose={() => state.setIsShopOpen(false)}
        tutorialHighlightPickaxe={tutorial.tutorialState.highlightPickaxe}
        tutorialHighlightCloseButton={tutorial.tutorialState.highlightCloseButton}
        showFreePickaxe={!tutorial.tutorialState.pickaxeTaken}
        tutorialState={tutorial.tutorialState}
        onTutorialAdvance={tutorial.advanceShopTutorial}
        isMobile={isMobile}
      />}
      {state.isRecyclerOpen && <RecyclingOverlay inventory={state.inventory} onRecycle={(q) => {
        state.setInventory(p => ({ ...p, defusedMines: p.defusedMines - q }));
        state.recyclingRef.current.queue += q;
        tutorial.onRecyclingStarted();
      }} onClose={() => state.setIsRecyclerOpen(false)} onOpen={() => tutorial.checkRecyclerMines(state.inventory.defusedMines)} />}
      {state.isInventoryOpen && <InventoryOverlay inventory={state.inventory} onClose={() => state.setIsInventoryOpen(false)} />}
      {state.isConstructionOpen && <ConstructionOverlay inventory={state.inventory} onContribute={actionsWithGrid.handleContribute} onClose={() => { tutorial.onConstructionClosed(); state.setIsConstructionOpen(false); }} tutorialState={tutorial.tutorialState} onTutorialAdvance={tutorial.dismissMessage} isMobile={isMobile} />}

      {/* Explosion White Flash Overlay */}
      <div
        className={`fixed inset-0 bg-white z-[300] pointer-events-none transition-opacity duration-1000 ease-out ${explosionFlash ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Tutorial Overlay - hide during fade-in */}
      {state.status === GameStatus.PLAYING && !gameFadingIn && (
        <TutorialOverlay
          tutorialState={tutorial.tutorialState}
          onDismiss={tutorial.dismissMessage}
          onSkip={() => tutorial.skipTutorial(() => state.setInventory(inv => ({ ...inv, hasPickaxe: true })))}
          onSelectChoice={tutorial.selectPostShopChoice}
          onDismissHint={tutorial.dismissHint}
          onToggleTaskMinimized={tutorial.toggleTaskMinimized}
          SHOP_X={SHOP_X}
          CONSTRUCTION_X={CONSTRUCTION_X}
          ROPE_X={ROPE_X}
          RECYCLER_X={RECYCLER_X}
          playerX={state.player.x}
          playerY={state.player.y}
          camera={state.camera}
          scale={scale}
          isShopOpen={state.isShopOpen}
          isConstructionOpen={state.isConstructionOpen}
          isRecyclerOpen={state.isRecyclerOpen}
          isInventoryOpen={state.isInventoryOpen}
          isMobile={isMobile}
        />
      )}

      {/* Game Fade-in Overlay */}
      <div
        className={`fixed inset-0 bg-black pointer-events-none transition-opacity duration-[600ms] ease-out z-[400]
                   ${gameFadingIn ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Death Screen */}
      {deathPhase !== 'NONE' && (
        <DeathScreen
          phase={deathPhase}
          deathDepth={deathDepth}
          furthestDepth={furthestDepth}
          onNextDay={handleDeathNextDay}
        />
      )}

      {(state.status === GameStatus.LOST || state.status === GameStatus.WON) && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-10 text-center animate-in fade-in zoom-in">
          <h2 className={`text-4xl font-black mb-4 uppercase ${state.status === GameStatus.LOST ? 'text-red-500' : 'text-green-500'}`}>{state.status === GameStatus.LOST ? 'Critical Failure' : 'Mission Complete'}</h2>
          <p className="text-lg mb-12 text-stone-400">Final Log Depth: <span className="text-white">{state.depth * 10}m</span></p>
          <button onClick={initGame} className="bg-white text-black px-16 py-4 font-black uppercase tracking-widest border-b-4 border-stone-400 hover:scale-105 transition-all">Re-Deploy</button>
        </div>
      )}

      {state.status === GameStatus.PLAYING && !tutorial.tutorialState.tutorialCompleted && (
        <TutorialController tutorial={tutorial} />
      )}

      {/* Dev Tools Overlay */}
      <DevToolsOverlay
        isOpen={isDevToolsOpen}
        onClose={() => setIsDevToolsOpen(false)}
        tutorialState={tutorial.tutorialState}
        onSkipToTutorialPhase={(phase) => {
          tutorial.skipToTutorialPhase(phase);
          // Also give pickaxe if skipping past commissary
          if (phase !== 'commissary') {
            state.setInventory(prev => ({ ...prev, hasPickaxe: true }));
          }
        }}
        inventory={state.inventory}
        setInventory={state.setInventory}
        coins={state.coins}
        setCoins={state.setCoins}
        dayTime={state.dayTime}
        setDayTime={state.setDayTime}
        timeRef={state.timeRef}
        DAY_DURATION_MS={DAY_DURATION_MS}
        EVENING_THRESHOLD_MS={EVENING_THRESHOLD_MS}
      />

      {/* Mobile Touch Controls */}
      <TouchControls
        visible={isMobile && !state.isShopOpen && !state.isRecyclerOpen && !state.isInventoryOpen && !state.isConstructionOpen}
        opacity={settings.controlOpacity / 100}
        canInteract={showRopePrompt || showShopPrompt || showRecyclerPrompt || showConstructionPrompt || (showHousePrompt && state.timeRef.current <= EVENING_THRESHOLD_MS)}
        disabled={tutorialGuard.isInputBlocked()}
      />

    </div>
  );
};

const AppWithBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithBoundary;
