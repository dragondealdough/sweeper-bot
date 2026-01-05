
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
import { useWorldUpdates } from './hooks/useWorldUpdates';
import { usePhysics } from './hooks/usePhysics';
import { useMining } from './hooks/useMining';
import { useGameActions } from './hooks/useGameActions';
import { useKeyboard } from './hooks/useKeyboard';
import { useGameState } from './hooks/useGameState';
import { useTutorial } from './hooks/useTutorial';
import { useGameSettings } from './hooks/useGameSettings';
import { useSaveGame } from './hooks/useSaveGame';
import { useMusic } from './hooks/useMusic';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import TouchControls from './components/TouchControls';

const App: React.FC = () => {
  const state = useGameState();
  const tutorial = useTutorial();
  const { isMobile } = useDeviceDetection();
  const { settings, updateSetting, resetSettings } = useGameSettings();
  const saveSystem = useSaveGame();
  const { startMusic, startMenuMusic } = useMusic({
    masterVolume: settings.masterVolume,
    musicVolume: settings.musicVolume,
  });
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  // Check for save game on mount
  useEffect(() => {
    setHasSave(saveSystem.hasSaveGame());
  }, [saveSystem]);

  // Virtual game dimensions (must match the values in render)
  const VIRTUAL_WIDTH = 1200;
  const VIRTUAL_HEIGHT = 800;

  // Responsive scaling - calculates scale factor based on viewport size
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
      setScale(Math.max(0.4, Math.min(1.5, newScale)));
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

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

  const mining = useMining(
    ROPE_X, state.setDepth, state.setStatus, state.setInventory,
    state.setMessage, () => actions.handlePlayerDeath(state.dayCount),
    state.setWorldItems,
    tutorial.tutorialState,
    tutorial.onMineHit,
    tutorial.onTileRevealed,
    tutorial.onMineCollected,
    state.setScreenShake,
    state.setPlayerHitFlash,
    tutorial.onMineAttemptInterrupt,
    tutorial.onTileFlagged
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

  const { getTargetTile } = useKeyboard({
    status: state.status, isShopOpen: state.isShopOpen, isRecyclerOpen: state.isRecyclerOpen,
    isInventoryOpen: state.isInventoryOpen, isConstructionOpen: state.isConstructionOpen,
    playerRef: state.playerRef, ropeLength: state.ropeLength, inventory: state.inventory,
    timeRef: state.timeRef, EVENING_THRESHOLD_MS, HOUSE_X, SHOP_X, RECYCLER_X,
    CONSTRUCTION_X, ROPE_X, OVERWORLD_FLOOR_Y, keys: state.keys,
    setIsInventoryOpen: state.setIsInventoryOpen, setIsShopOpen: state.setIsShopOpen,
    setIsRecyclerOpen: state.setIsRecyclerOpen, setIsConstructionOpen: state.setIsConstructionOpen,
    setMessage: state.setMessage, revealTileAt: mining.revealTileAt, startClimbing,
    handleFlagAction: mining.handleFlagAction,
    handleSleep: () => actionsWithGrid.handleSleep(false, state.dayCount),
    onShopOpen: tutorial.onShopOpened,
    onConstructionOpen: tutorial.onConstructionOpened,
    onConstructionClosed: tutorial.onConstructionClosed,
    onRecyclerOpen: tutorial.onRecyclerOpened,
    tutorialState: tutorial.tutorialState,
    depth: state.depth
  });

  const initGame = useCallback(() => {
    mining.initGrid();
    const startPos = { x: HOUSE_X, y: OVERWORLD_FLOOR_Y, vx: 0, vy: 0, facing: Direction.DOWN, isClimbing: false };
    state.playerRef.current = startPos;
    state.setPlayer(startPos);
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
  }, [mining, state, OVERWORLD_FLOOR_Y, HOUSE_X, startMusic]);

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
    // viewportRef is on the game area (after sidebar), so use directly
    const vw = viewportRef.current?.clientWidth || (VIRTUAL_WIDTH - 256);
    const vh = viewportRef.current?.clientHeight || VIRTUAL_HEIGHT;

    const p = state.playerRef.current;

    // Mine center for camera targeting
    const MINE_CENTER = (GRID_CONFIG.COLUMNS * GRID_CONFIG.TILE_SIZE) / 2; // 320px

    // Default: Center on the mine grid
    let targetCamX = MINE_CENTER;

    // If in Overworld (y < 0), track player horizontally.
    if (p.y < 0) {
      targetCamX = (p.x * GRID_CONFIG.TILE_SIZE) + (GRID_CONFIG.TILE_SIZE / 2);
    }

    // Convert world target to camera position (top-left of screen)
    const idealX = targetCamX - (vw / 2);
    const idealY = p.y * GRID_CONFIG.TILE_SIZE - (vh / 2);

    // Clamp Y to game bounds
    const minCamY = -10 * GRID_CONFIG.TILE_SIZE;
    const maxCamY = (GRID_CONFIG.ROWS * GRID_CONFIG.TILE_SIZE) - vh + 100;
    const clampedY = Math.max(minCamY, Math.min(idealY, maxCamY));

    // Smooth Lerp
    state.cameraRef.current.x += (idealX - state.cameraRef.current.x) * 0.1;
    state.cameraRef.current.y += (clampedY - state.cameraRef.current.y) * 0.2;

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
        onMenuClick={startMenuMusic}
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
  const showRopePrompt = canClimb;
  const ropePromptText = Math.abs(state.player.y - OVERWORLD_FLOOR_Y) < 0.5 ? "DESCEND [E]" : "ASCEND [E]";

  const showShopPrompt = state.player.y < 0 && Math.abs(state.player.x - SHOP_X) < 1.5 && !state.isShopOpen;
  const showHousePrompt = state.player.y < 0 && Math.abs(state.player.x - HOUSE_X) < 1.5;
  const housePromptText = state.timeRef.current <= EVENING_THRESHOLD_MS ? "SLEEP [E]" : "DAYLIGHT REMAINING";
  const showRecyclerPrompt = state.player.y < 0 && Math.abs(state.player.x - RECYCLER_X) < 1.5 && !state.isRecyclerOpen;
  const showConstructionPrompt = state.player.y < 0 && Math.abs(state.player.x - CONSTRUCTION_X) < 2 && !state.isConstructionOpen;

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
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
            <GameHUD coins={state.coins} dayTime={state.dayTime} dayCount={state.dayCount} EVENING_THRESHOLD_MS={EVENING_THRESHOLD_MS} formatTime={formatTime} depth={state.depth} inventory={state.inventory} setIsInventoryOpen={state.setIsInventoryOpen} message={state.message} flashTimer={tutorial.tutorialState.flashTimer} highlightDisarmKit={tutorial.tutorialState.highlightDisarmKit} isMobile={isMobile} />

            {/* Game content area - positioned after sidebar, extends to screen edge to eliminate right border */}
            <div ref={viewportRef} className="absolute left-64 top-0 bottom-0 pt-20 overflow-hidden bg-black" style={{ right: 0 }}>
              {/* Rendering: Applies calculated X and Y as a negative translation */}
              <div
                className="w-full h-full will-change-transform"
                style={{ transform: `translate3d(${-state.camera.x}px, ${-state.camera.y}px, 0)` }}
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
                    prompts={{
                      showRopePrompt, ropePromptText,
                      showShopPrompt, showHousePrompt, housePromptText,
                      showRecyclerPrompt, showConstructionPrompt,
                      canSleep: state.timeRef.current <= EVENING_THRESHOLD_MS
                    }}
                    foundMinePosition={tutorial.tutorialState.foundMinePosition}
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
      />}
      {state.isRecyclerOpen && <RecyclingOverlay inventory={state.inventory} onRecycle={(q) => {
        state.setInventory(p => ({ ...p, defusedMines: p.defusedMines - q }));
        state.recyclingRef.current.queue += q;
        tutorial.onRecyclingStarted();
      }} onClose={() => state.setIsRecyclerOpen(false)} onOpen={() => tutorial.checkRecyclerMines(state.inventory.defusedMines)} />}
      {state.isInventoryOpen && <InventoryOverlay inventory={state.inventory} onClose={() => state.setIsInventoryOpen(false)} />}
      {state.isConstructionOpen && <ConstructionOverlay inventory={state.inventory} onContribute={actionsWithGrid.handleContribute} onClose={() => { tutorial.onConstructionClosed(); state.setIsConstructionOpen(false); }} tutorialState={tutorial.tutorialState} onTutorialAdvance={tutorial.dismissMessage} />}

      {/* Tutorial Overlay */}
      {state.status === GameStatus.PLAYING && (
        <TutorialOverlay
          tutorialState={tutorial.tutorialState}
          onDismiss={tutorial.dismissMessage}
          onSkip={() => tutorial.skipTutorial(() => state.setInventory(inv => ({ ...inv, hasPickaxe: true })))}
          onSelectChoice={tutorial.selectPostShopChoice}
          onDismissHint={tutorial.dismissHint}
          SHOP_X={SHOP_X}
          CONSTRUCTION_X={CONSTRUCTION_X}
          ROPE_X={ROPE_X}
          RECYCLER_X={RECYCLER_X}
          playerX={state.player.x}
          camera={state.camera}
          scale={scale}
          isShopOpen={state.isShopOpen}
          isConstructionOpen={state.isConstructionOpen}
          isRecyclerOpen={state.isRecyclerOpen}
          isInventoryOpen={state.isInventoryOpen}
          isMobile={isMobile}
        />
      )}

      {(state.status === GameStatus.LOST || state.status === GameStatus.WON) && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-10 text-center animate-in fade-in zoom-in">
          <h2 className={`text-4xl font-black mb-4 uppercase ${state.status === GameStatus.LOST ? 'text-red-500' : 'text-green-500'}`}>{state.status === GameStatus.LOST ? 'Critical Failure' : 'Mission Complete'}</h2>
          <p className="text-lg mb-12 text-stone-400">Final Log Depth: <span className="text-white">{state.depth * 10}m</span></p>
          <button onClick={initGame} className="bg-white text-black px-16 py-4 font-black uppercase tracking-widest border-b-4 border-stone-400 hover:scale-105 transition-all">Re-Deploy</button>
        </div>
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
      <TouchControls visible={isMobile} />

    </div>
  );
};

export default App;
