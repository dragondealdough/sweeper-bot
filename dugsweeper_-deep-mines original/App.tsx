
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TileState, PlayerPosition, FlagType, GameStatus, Direction, Inventory, CardType } from './types';
import { GRID_CONFIG, PHYSICS, COLORS, CARD_DEFINITIONS } from './constants';
import Tile from './components/Tile';
import ShopOverlay from './components/ShopOverlay';
import InventoryOverlay from './components/InventoryOverlay';
import RecyclingOverlay from './components/RecyclingOverlay';

const App: React.FC = () => {
  const [grid, setGrid] = useState<TileState[][]>([]);
  const [player, setPlayer] = useState<PlayerPosition>({ x: 8, y: -2, vx: 0, vy: 0, facing: Direction.DOWN, isClimbing: false });
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [depth, setDepth] = useState(0);
  const [coins, setCoins] = useState(0);
  const [inventory, setInventory] = useState<Inventory>({ 
    silverBlocks: 0, 
    disarmKits: 0, 
    disarmCharges: 3, 
    defusedMines: 0,
    scrapMetal: 0,
    deck: [],
    collection: []
  });
  const [ropeLength, setRopeLength] = useState(5); // Initial rope length in tiles
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isRecyclerOpen, setIsRecyclerOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // Recycling System
  const RECYCLE_TIME_MS = 20000;
  const recyclingRef = useRef({ queue: 0, timer: RECYCLE_TIME_MS });
  const [recyclingDisplay, setRecyclingDisplay] = useState({ queue: 0, progress: 0 });

  // Camera State
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const cameraRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  // Time System
  const DAY_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  const EVENING_THRESHOLD_MS = 3 * 60 * 1000; // Last 3 minutes
  const [dayTime, setDayTime] = useState(DAY_DURATION_MS);
  const [dayCount, setDayCount] = useState(1);
  const timeRef = useRef<number>(DAY_DURATION_MS);

  const keys = useRef<Record<string, boolean>>({});
  const gridRef = useRef<TileState[][]>([]);
  const playerRef = useRef<PlayerPosition>({ x: 8, y: -2, vx: 0, vy: 0, facing: Direction.DOWN, isClimbing: false });
  const requestRef = useRef<number>(0);
  const canJumpRef = useRef<boolean>(true);

  const ROPE_X = 8;
  const HOUSE_X = 2.5;
  const RECYCLER_X = -6;
  const SHOP_X = 13.5;
  const OVERWORLD_FLOOR_Y = -2; 
  const OVERWORLD_MIN_X = -12;
  const OVERWORLD_MAX_X = 28;

  const initGame = useCallback(() => {
    const INITIAL_ROPE_LENGTH = 5;
    const SAFE_ROWS = 4; // Number of initial rows to clear
    setRopeLength(INITIAL_ROPE_LENGTH);

    const newGrid: TileState[][] = [];
    const mines: boolean[] = new Array(GRID_CONFIG.COLUMNS * GRID_CONFIG.ROWS).fill(false);
    let placed = 0;
    
    // Offset mine placement to skip the safe rows
    const mineStartOffset = GRID_CONFIG.COLUMNS * SAFE_ROWS;

    while (placed < GRID_CONFIG.INITIAL_MINE_COUNT) {
      const idx = Math.floor(Math.random() * (mines.length - mineStartOffset)) + mineStartOffset;
      const mX = idx % GRID_CONFIG.COLUMNS;
      const mY = Math.floor(idx / GRID_CONFIG.COLUMNS);
      
      // Prevent mines in the initial rope shaft (even if it extends deeper than safe rows)
      if (mX === ROPE_X && mY < INITIAL_ROPE_LENGTH) continue;

      if (!mines[idx]) { mines[idx] = true; placed++; }
    }
    for (let y = 0; y < GRID_CONFIG.ROWS; y++) {
      const row: TileState[] = [];
      for (let x = 0; x < GRID_CONFIG.COLUMNS; x++) {
        // Reveal safe rows and the initial rope shaft
        const isRopeShaft = x === ROPE_X && y < INITIAL_ROPE_LENGTH;
        const revealed = y < SAFE_ROWS || isRopeShaft;

        row.push({ x, y, isMine: mines[y * GRID_CONFIG.COLUMNS + x], isRevealed: revealed, flag: FlagType.NONE, neighborMines: 0 });
      }
      newGrid.push(row);
    }
    for (let y = 0; y < GRID_CONFIG.ROWS; y++) {
      for (let x = 0; x < GRID_CONFIG.COLUMNS; x++) {
        if (!newGrid[y][x].isMine) {
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy; const nx = x + dx;
              if (ny >= 0 && ny < GRID_CONFIG.ROWS && nx >= 0 && nx < GRID_CONFIG.COLUMNS) {
                if (newGrid[ny][nx].isMine) count++;
              }
            }
          }
          newGrid[y][x].neighborMines = count;
        }
      }
    }
    gridRef.current = newGrid;
    setGrid(newGrid);
    
    // Start in overworld
    const startPos = { x: 8, y: OVERWORLD_FLOOR_Y, vx: 0, vy: 0, facing: Direction.DOWN, isClimbing: false };
    playerRef.current = startPos;
    setPlayer(startPos);
    setStatus(GameStatus.PLAYING);
    setDepth(0);
    setCoins(0);
    setInventory({ 
      silverBlocks: 2, 
      disarmKits: 1, 
      disarmCharges: 3, 
      defusedMines: 0,
      scrapMetal: 0,
      deck: [
        { id: 'start-1', def: CARD_DEFINITIONS[CardType.PICKAXE], owner: 'PLAYER', currentValue: 1 },
        { id: 'start-2', def: CARD_DEFINITIONS[CardType.PICKAXE], owner: 'PLAYER', currentValue: 1 },
        { id: 'start-3', def: CARD_DEFINITIONS[CardType.BOMBER], owner: 'PLAYER', currentValue: 3 },
        { id: 'start-4', def: CARD_DEFINITIONS[CardType.SHIELD_BEARER], owner: 'PLAYER', currentValue: 2 },
        { id: 'start-5', def: CARD_DEFINITIONS[CardType.FIELD_MEDIC], owner: 'PLAYER', currentValue: 2 },
      ],
      collection: []
    });
    
    // Reset Recycling
    recyclingRef.current = { queue: 0, timer: RECYCLE_TIME_MS };
    setRecyclingDisplay({ queue: 0, progress: 0 });

    // Reset Camera
    const vw = viewportRef.current?.clientWidth || (window.innerWidth - 256);
    const vh = viewportRef.current?.clientHeight || window.innerHeight;
    const initialCamX = ((8 * GRID_CONFIG.TILE_SIZE) + (GRID_CONFIG.TILE_SIZE / 2)) - (vw / 2);
    const initialCamY = (OVERWORLD_FLOOR_Y * GRID_CONFIG.TILE_SIZE) - (vh / 2);
    cameraRef.current = { x: initialCamX, y: initialCamY };
    setCamera({ x: initialCamX, y: initialCamY });

    setIsShopOpen(false);
    setIsRecyclerOpen(false);
    setIsInventoryOpen(false);
    timeRef.current = DAY_DURATION_MS;
    setDayTime(DAY_DURATION_MS);
    setDayCount(1);
  }, []);

  const handleSleep = (forced: boolean = false) => {
      // Process pending recycling automatically at start of next day
      const pendingQueue = recyclingRef.current.queue;
      if (pendingQueue > 0) {
          setInventory(prev => ({
              ...prev,
              scrapMetal: prev.scrapMetal + pendingQueue
          }));
          recyclingRef.current = { queue: 0, timer: RECYCLE_TIME_MS };
          setRecyclingDisplay({ queue: 0, progress: 0 });
      }

      timeRef.current = DAY_DURATION_MS;
      setDayTime(DAY_DURATION_MS);
      setDayCount(c => c + 1);
      
      playerRef.current.x = HOUSE_X;
      playerRef.current.y = OVERWORLD_FLOOR_Y;
      playerRef.current.vx = 0;
      playerRef.current.vy = 0;
      setPlayer({...playerRef.current});

      if (!forced) {
          const msg = pendingQueue > 0 
            ? `SLEEP COMPLETE (+${pendingQueue} SCRAP)` 
            : "SLEEP COMPLETE - ENERGY RESTORED";
          setMessage(msg);
          setTimeout(() => setMessage(null), 2000);
      } else if (pendingQueue > 0) {
          // Notify about night processing after the death/passout message clears
          setTimeout(() => {
              setMessage(`NIGHT SHIFT: +${pendingQueue} SCRAP PROCESSED`);
              setTimeout(() => setMessage(null), 3000);
          }, 500);
      }
  };

  const handlePassOut = () => {
    setMessage("EXHAUSTION CRITICAL - PASSED OUT");
    setCoins(c => Math.floor(c / 2));
    setTimeout(() => {
        setMessage(null);
        handleSleep(true);
    }, 3000);
  };

  const handlePlayerDeath = () => {
      setMessage("CRITICAL INJURY - EMERGENCY EVAC");
      setCoins(c => Math.floor(c * 0.75)); // Lose 25% coins on death
      setTimeout(() => {
          setMessage(null);
          handleSleep(true);
      }, 3000);
  };

  const revealTileAt = (x: number, y: number, isInitial: boolean = true) => {
    if (x < 0 || x >= GRID_CONFIG.COLUMNS || y < 0 || y >= GRID_CONFIG.ROWS) return;
    const tile = gridRef.current[y][x];

    if (isInitial && tile.item === 'SILVER_BLOCK') {
      const newGrid = [...gridRef.current.map(r => [...r])];
      newGrid[y][x].item = undefined;
      gridRef.current = newGrid;
      setGrid(newGrid);
      setInventory(prev => ({ ...prev, silverBlocks: prev.silverBlocks + 1 }));
      return;
    }

    if (tile.isRevealed) return;
    const newGrid = [...gridRef.current.map(r => [...r])];
    
    const floodFill = (tx: number, ty: number) => {
      if (tx < 0 || tx >= GRID_CONFIG.COLUMNS || ty < 0 || ty >= GRID_CONFIG.ROWS) return;
      if (newGrid[ty][tx].isRevealed || newGrid[ty][tx].isMine) return;
      newGrid[ty][tx].isRevealed = true;
      if (newGrid[ty][tx].neighborMines === 0) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) floodFill(tx + dx, ty + dy);
        }
      }
    };

    if (tile.isMine) {
      if (isInitial && tile.flag === FlagType.MINE && inventory.disarmCharges > 0) {
        // Disarm Logic Updated: Claim mine instead of gold
        setInventory(prev => ({ 
            ...prev, 
            disarmCharges: prev.disarmCharges - 1,
            defusedMines: prev.defusedMines + 1
        }));
        setMessage("MINE DEFUSED - UNIT SECURED");
        setTimeout(() => setMessage(null), 1500);

        newGrid[y][x].isRevealed = true;
        newGrid[y][x].isMine = false;
        
        // Decrement neighbor counts
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ny = y + dy; const nx = x + dx;
            if (ny >= 0 && ny < GRID_CONFIG.ROWS && nx >= 0 && nx < GRID_CONFIG.COLUMNS) {
              newGrid[ny][nx].neighborMines = Math.max(0, newGrid[ny][nx].neighborMines - 1);
            }
          }
        }
      } else {
        // Updated Death Logic: Skip day instead of Game Over
        handlePlayerDeath();
        newGrid[y][x].isRevealed = true; // Reveal the mine that caused the damage
      }
    } else {
      newGrid[y][x].isRevealed = true;
      if (isInitial) {
          const rand = Math.random();
          if (rand < 0.1) newGrid[y][x].item = 'COIN';
      }
      if (newGrid[y][x].neighborMines === 0) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue;
            floodFill(x + dx, y + dy);
          }
        }
      }
    }

    gridRef.current = newGrid;
    setGrid(newGrid);
    if (y > depth) {
      setDepth(y);
    }
    if (y === GRID_CONFIG.ROWS - 1) setStatus(GameStatus.WON);
  };

  const isSolid = (cx: number, cy: number) => {
    // Overworld boundary
    if (cy < -8) return true; // Sky ceiling
    
    // Overworld floor
    if (cy < 0) {
      // Solid floor at y = -1 for the entire extended overworld
      if (cy >= -1) return true; 
      
      // If we are in the "mine shaft" X range (0-15), we need walls ONLY if we are actually deep enough to hit the side of the shaft,
      // BUT in overworld (y < 0), there are NO walls left/right, it's open air.
      // So no x-check for walls here.
      return false;
    }

    // In Mine (y >= 0)
    const tx = Math.floor(cx); const ty = Math.floor(cy);
    if (tx < 0 || tx >= GRID_CONFIG.COLUMNS) return true; // Walls of the mine shaft
    if (ty >= GRID_CONFIG.ROWS) return true; // Bottom bedrock
    
    const tile = gridRef.current[ty][tx];
    return !tile.isRevealed || tile.item === 'SILVER_BLOCK';
  };

  const checkRopeInteraction = () => {
    const p = playerRef.current;
    if (p.isClimbing) return;

    if (Math.abs(p.x - ROPE_X) < 0.5) {
      // Climbing UP: Disabled W/Up Arrow as per request. Moved to Space key.
      
      // Climbing DOWN: Only from the surface
      if (Math.abs(p.y - OVERWORLD_FLOOR_Y) < 0.5 && (keys.current['ArrowDown'] || keys.current['s'])) {
        startClimbing('DOWN');
      }
    }
  };

  const startClimbing = (direction: 'UP' | 'DOWN') => {
    playerRef.current.isClimbing = true;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.x = ROPE_X;
    
    const targetY = direction === 'UP' ? OVERWORLD_FLOOR_Y : 0;
    const startY = playerRef.current.y;
    
    // Calculate duration based on distance to ensure consistent speed
    const distance = Math.abs(targetY - startY);
    const duration = Math.max(500, distance * 150); // Min 500ms, scale with distance
    
    const startTime = Date.now();

    const climbFrame = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      
      playerRef.current.y = startY + (targetY - startY) * ease;
      setPlayer({ ...playerRef.current });

      if (progress < 1) {
        requestAnimationFrame(climbFrame);
      } else {
        playerRef.current.isClimbing = false;
        playerRef.current.y = targetY;
        playerRef.current.vy = 0;
        canJumpRef.current = false; 
        setPlayer({ ...playerRef.current });
      }
    };
    
    requestAnimationFrame(climbFrame);
  };

  const update = useCallback(() => {
    if (status !== GameStatus.PLAYING || isShopOpen || isRecyclerOpen || isInventoryOpen) return;
    
    const delta = 16.66;
    timeRef.current -= delta;

    // --- RECYCLING LOGIC ---
    if (recyclingRef.current.queue > 0) {
        recyclingRef.current.timer -= delta;
        if (recyclingRef.current.timer <= 0) {
            // Finished one item
            setInventory(prev => ({ ...prev, scrapMetal: prev.scrapMetal + 1 }));
            recyclingRef.current.queue -= 1;
            recyclingRef.current.timer = RECYCLE_TIME_MS; // Reset timer for next item
            setMessage("RECYCLING COMPLETE: +1 SCRAP");
            setTimeout(() => setMessage(null), 1500);
        }
    } else {
        recyclingRef.current.timer = RECYCLE_TIME_MS; // Keep timer ready
    }
    // Update display state for progress bar
    setRecyclingDisplay({
        queue: recyclingRef.current.queue,
        progress: 1 - (Math.max(0, recyclingRef.current.timer) / RECYCLE_TIME_MS)
    });

    if (timeRef.current <= 0) {
        timeRef.current = 0;
        handlePassOut();
    }
    if (Math.floor(timeRef.current / 1000) !== Math.floor(dayTime / 1000)) {
        setDayTime(timeRef.current);
    }

    const p = playerRef.current;
    
    // --- PHYSICS ---
    if (!p.isClimbing) {
        const moveLeft = keys.current['ArrowLeft'] || keys.current['a'];
        const moveRight = keys.current['ArrowRight'] || keys.current['d'];
        const moveUp = keys.current['ArrowUp'] || keys.current['w'];
        const moveDown = keys.current['ArrowDown'] || keys.current['s'];

        if (moveDown) p.facing = Direction.DOWN;
        else if (moveUp) p.facing = Direction.UP;
        else if (moveLeft) p.facing = Direction.LEFT;
        else if (moveRight) p.facing = Direction.RIGHT;

        if (moveLeft) p.vx -= PHYSICS.MOVE_ACCEL;
        if (moveRight) p.vx += PHYSICS.MOVE_ACCEL;
        p.vx *= PHYSICS.FRICTION;
        if (Math.abs(p.vx) > PHYSICS.MAX_MOVE_SPEED) p.vx = Math.sign(p.vx) * PHYSICS.MAX_MOVE_SPEED;
        
        p.vy += PHYSICS.GRAVITY;
        
        const nextX = p.x + p.vx;
        let canMoveX = true;
        
        // Bounds checking
        if (p.y < 0) {
            if (nextX < OVERWORLD_MIN_X || nextX > OVERWORLD_MAX_X) canMoveX = false;
        }

        if (canMoveX && !isSolid(nextX + 0.1, p.y + 0.1) && !isSolid(nextX + 0.9, p.y + 0.1) && !isSolid(nextX + 0.1, p.y + 0.9) && !isSolid(nextX + 0.9, p.y + 0.9)) {
          p.x = nextX;
        } else {
          p.vx = 0;
        }
        
        const nextY = p.y + p.vy;
        const onGround = isSolid(p.x + 0.1, nextY + 1.0) || isSolid(p.x + 0.9, nextY + 1.0);
        const hitCeiling = isSolid(p.x + 0.1, nextY) || isSolid(p.x + 0.9, nextY);

        if (onGround && p.vy >= 0) {
          p.y = Math.round(p.y); 
          p.vy = 0;
          if (moveUp && canJumpRef.current) { 
            p.vy = PHYSICS.JUMP_POWER; 
            canJumpRef.current = false; 
          }
        } else if (hitCeiling && p.vy < 0) { 
          p.vy = 0; 
          p.y = Math.ceil(nextY); 
        } else { 
          p.y = nextY; 
          if (p.vy > PHYSICS.MAX_FALL) p.vy = PHYSICS.MAX_FALL; 
        }

        if (p.y >= 0) {
          const tx = Math.floor(p.x + 0.5); 
          const ty = Math.floor(p.y + 0.5);
          if (gridRef.current[ty]?.[tx]?.item === 'COIN') {
            const newGrid = [...gridRef.current.map(r => [...r])]; 
            newGrid[ty][tx].item = undefined; 
            gridRef.current = newGrid; 
            setGrid(newGrid); 
            setCoins(c => c + 1);
          }
        }

        if (!moveUp) canJumpRef.current = true;
        playerRef.current = { ...p }; 
        setPlayer({ ...p });
    } else {
        // Just update player ref if climbing (handled by tween) to ensure camera can track it
        setPlayer({ ...playerRef.current });
    }
    
    checkRopeInteraction();

    // --- CAMERA LOGIC (JS Interpolation) ---
    // Use the ref to get the actual game viewport width, excluding sidebar
    const vw = viewportRef.current?.clientWidth || window.innerWidth;
    const vh = viewportRef.current?.clientHeight || window.innerHeight;

    // Default: Center on the exact geographic center of the mine grid
    // Mine width is COLUMNS * TILE_SIZE. Center is exactly half of that.
    // 16 cols * 40px = 640px. Center = 320px.
    let targetCamX = (GRID_CONFIG.COLUMNS * GRID_CONFIG.TILE_SIZE) / 2;
    
    // If in Overworld (y < 0), track player horizontally.
    if (p.y < 0) {
        targetCamX = (p.x * GRID_CONFIG.TILE_SIZE) + (GRID_CONFIG.TILE_SIZE / 2);
    }

    // Convert world target to camera position (top-left of screen)
    // We want targetCamX to be at vw / 2
    const idealX = targetCamX - (vw / 2);
    const idealY = p.y * GRID_CONFIG.TILE_SIZE - (vh / 2);

    // Clamp Y to game bounds
    const minCamY = -10 * GRID_CONFIG.TILE_SIZE;
    const maxCamY = (GRID_CONFIG.ROWS * GRID_CONFIG.TILE_SIZE) - vh + 100;
    const clampedY = Math.max(minCamY, Math.min(idealY, maxCamY));

    // Smooth Lerp
    // X axis (Panning): 0.1 for smooth catch-up
    cameraRef.current.x += (idealX - cameraRef.current.x) * 0.1;
    // Y axis (Vertical): 0.2 for slightly tighter tracking on vertical movement
    cameraRef.current.y += (clampedY - cameraRef.current.y) * 0.2;

    setCamera({ x: cameraRef.current.x, y: cameraRef.current.y });

    requestRef.current = requestAnimationFrame(update);
  }, [status, isShopOpen, isRecyclerOpen, isInventoryOpen, dayTime, ropeLength]); 

  useEffect(() => {
    if (status === GameStatus.PLAYING) requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update, status]);

  const handleFlagAction = (tx: number, ty: number) => {
    if (status !== GameStatus.PLAYING || isShopOpen || isRecyclerOpen || isInventoryOpen) return;
    if (ty < 0) return; 
    setGrid(prev => {
      if (prev[ty]?.[tx]?.isRevealed) return prev;
      const newGrid = [...prev.map(r => [...r])];
      // Only toggle MINE flag (removed SAFE flag logic)
      newGrid[ty][tx].flag = newGrid[ty][tx].flag === FlagType.MINE ? FlagType.NONE : FlagType.MINE;
      gridRef.current = newGrid; return newGrid;
    });
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      const target = getTargetTile();
      
      if (e.key.toLowerCase() === 'i' && status === GameStatus.PLAYING && !isShopOpen && !isRecyclerOpen) {
          setIsInventoryOpen(prev => !prev);
          return;
      }
      
      if (e.key === ' ' && status === GameStatus.PLAYING && !isInventoryOpen) {
         // Check for ascending rope
         const p = playerRef.current;
         if (!p.isClimbing && Math.abs(p.x - ROPE_X) < 0.5) {
             // Allow climbing up if on the rope and below the surface floor
             if (p.y <= ropeLength && p.y > OVERWORLD_FLOOR_Y) {
                 startClimbing('UP');
                 return;
             }
         }

         if (target.y >= 0) revealTileAt(target.x, target.y, true);
      }
      
      // Map both Z and X to handleFlagAction (which now only toggles red flags)
      if (e.key.toLowerCase() === 'z' && status === GameStatus.PLAYING && !isInventoryOpen) handleFlagAction(target.x, target.y);
      if (e.key.toLowerCase() === 'x' && status === GameStatus.PLAYING && !isInventoryOpen) handleFlagAction(target.x, target.y);
      
      if ((e.key.toLowerCase() === 'e') && status === GameStatus.PLAYING && !isInventoryOpen) {
        if (playerRef.current.y < 0) {
            if (Math.abs(playerRef.current.x - HOUSE_X) < 1.5) {
                if (timeRef.current <= EVENING_THRESHOLD_MS) {
                    handleSleep();
                } else {
                    setMessage("TOO EARLY TO SLEEP");
                    setTimeout(() => setMessage(null), 1000);
                }
            } 
            else if (Math.abs(playerRef.current.x - SHOP_X) < 1.5) {
                setIsShopOpen(prev => !prev);
            }
            else if (Math.abs(playerRef.current.x - RECYCLER_X) < 1.5) {
                setIsRecyclerOpen(prev => !prev);
            }
        } else {
           setMessage("Signal too weak. Return to surface.");
           setTimeout(() => setMessage(null), 2000);
        }
      }
    };
    const up = (e: KeyboardEvent) => keys.current[e.key] = false;
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [status, isShopOpen, isRecyclerOpen, isInventoryOpen, inventory, ropeLength]);

  const getTargetTile = () => {
    const p = playerRef.current;
    let tx = Math.floor(p.x + 0.5); let ty = Math.floor(p.y + 0.5);
    switch (p.facing) { case Direction.UP: ty -= 1; break; case Direction.DOWN: ty += 1; break; case Direction.LEFT: tx -= 1; break; case Direction.RIGHT: tx += 1; break; }
    return { x: tx, y: ty };
  };

  const handleShopBuy = (id: 'CHARGE' | 'KIT' | 'ROPE', price: number) => {
    if (coins < price) return;
    
    if (id === 'ROPE') {
        const extensionAmount = 5;
        let isObstructed = false;
        
        for (let i = 0; i < extensionAmount; i++) {
            const checkY = ropeLength + i;
            if (checkY >= GRID_CONFIG.ROWS) {
                 isObstructed = true; 
                 break;
            }
            // Check grid collision at rope x position
            // Safety check: ensure row exists
            if (gridRef.current[checkY] && gridRef.current[checkY][ROPE_X]) {
                const tile = gridRef.current[checkY][ROPE_X];
                // Obstruction if not revealed OR if it contains a solid item (Silver Block)
                if (!tile.isRevealed || tile.item === 'SILVER_BLOCK') {
                    isObstructed = true;
                    break;
                }
            }
        }

        if (isObstructed) {
            setMessage("PATH OBSTRUCTED - CLEAR ROCK FIRST");
            setTimeout(() => setMessage(null), 2000);
            return; 
        }

        setRopeLength(prev => prev + extensionAmount);
        setMessage(`ROPE EXTENDED +${extensionAmount}M`);
        setTimeout(() => setMessage(null), 2000);
        // Continue to payment
    }

    setCoins(c => c - price);
    if (id === 'CHARGE') setInventory(prev => ({ ...prev, disarmCharges: prev.disarmCharges + 1 }));
    if (id === 'KIT') setInventory(prev => ({ ...prev, disarmKits: prev.disarmKits + 1 }));
  };

  const handleRecycleQueue = (quantity: number) => {
      if (inventory.defusedMines < quantity) return;
      // Remove mines immediately from inventory
      setInventory(prev => ({
          ...prev,
          defusedMines: prev.defusedMines - quantity,
      }));
      // Add to queue
      recyclingRef.current.queue += quantity;
  };

  const currentTarget = getTargetTile();
  
  // Interactions
  // Can climb if near Rope X AND (at surface OR below surface but not deeper than rope)
  const canClimb = !player.isClimbing && Math.abs(player.x - ROPE_X) < 0.5 && 
                    (Math.abs(player.y - OVERWORLD_FLOOR_Y) < 0.5 || (player.y <= ropeLength && player.y > OVERWORLD_FLOOR_Y));
                    
  const showRopePrompt = canClimb;
  
  let ropePromptText = "";
  if (Math.abs(player.y - OVERWORLD_FLOOR_Y) < 0.5) ropePromptText = "DESCEND [S]";
  else ropePromptText = "ASCEND [SPACE]";

  const showShopPrompt = player.y < 0 && Math.abs(player.x - SHOP_X) < 1.5 && !isShopOpen;
  const showHousePrompt = player.y < 0 && Math.abs(player.x - HOUSE_X) < 1.5;
  const housePromptText = timeRef.current <= EVENING_THRESHOLD_MS ? "SLEEP [E]" : "DAYLIGHT REMAINING";
  
  const showRecyclerPrompt = player.y < 0 && Math.abs(player.x - RECYCLER_X) < 1.5 && !isRecyclerOpen;

  const getSkyGradient = () => {
      const total = DAY_DURATION_MS;
      const current = Math.max(0, dayTime);
      const ratio = current / total;

      if (ratio > 0.3) {
          return `linear-gradient(to bottom, ${COLORS.SKY_TOP}, ${COLORS.SKY_BOTTOM})`;
      } else if (ratio > 0.15) {
          return `linear-gradient(to bottom, #1e1b4b, #f97316)`;
      } else {
          return `linear-gradient(to bottom, #0f172a, #312e81)`;
      }
  };

  const formatTime = (ms: number) => {
      const seconds = Math.floor(ms / 1000);
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (status === GameStatus.START) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] text-white p-4 text-center z-50 relative">
        <div className="mb-8 border-4 border-yellow-500 p-8 shadow-[0_0_50px_rgba(234,179,8,0.2)] bg-black/90">
            <h1 className="text-4xl md:text-6xl font-black text-yellow-500 mb-2 tracking-tighter uppercase">Dug-Sweeper</h1>
            <p className="text-[10px] text-stone-500 tracking-[0.3em]">TACTICAL MINING & SURFACE COMMAND</p>
        </div>
        <button onClick={initGame} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-6 px-16 rounded border-b-8 border-yellow-700 active:border-b-0 active:translate-y-2 transition-all shadow-2xl text-lg uppercase tracking-widest">Initiate Drop</button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-[#050505] text-white overflow-hidden select-none font-mono flex">
      {/* Sidebar - Tactical Console */}
      <div className="w-64 h-full bg-slate-900 border-r-2 border-slate-800 flex flex-col z-[80] shadow-2xl relative shrink-0">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50">
          <h2 className="text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-1">Tactical Analysis</h2>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="bg-slate-800/40 p-2 border border-slate-800">
               <div className="text-[7px] text-slate-500 uppercase mb-1">Depth Monitor</div>
               <div className="text-lg font-black text-white">{Math.max(0, depth * 10)}m</div>
            </div>
            <div className="bg-slate-800/40 p-2 border border-slate-800">
               <div className="text-[7px] text-slate-500 uppercase mb-1">Disarm Charges</div>
               <div className="text-lg font-black text-red-500">{inventory.disarmCharges}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                 <div className="bg-slate-800/40 p-2 border border-slate-800">
                    <div className="text-[7px] text-slate-500 uppercase mb-1">Mines</div>
                    <div className="text-sm font-black text-white">{inventory.defusedMines}</div>
                 </div>
                 <div className="bg-slate-800/40 p-2 border border-slate-800">
                    <div className="text-[7px] text-slate-500 uppercase mb-1">Scrap</div>
                    <div className="text-sm font-black text-white">{inventory.scrapMetal}</div>
                 </div>
            </div>
            <div className="text-[9px] text-stone-500 text-center uppercase border border-stone-800 p-2 mt-4 cursor-pointer hover:bg-slate-800 hover:text-white transition-colors" onClick={() => setIsInventoryOpen(true)}>
               [I] OPEN INVENTORY
            </div>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%]" />
      </div>

      <div className="flex-1 relative" ref={viewportRef}>
        {/* Top UI Bar */}
        <div className="fixed top-0 left-64 right-0 w-full z-[70] bg-stone-900/90 border-b border-stone-800 p-4 flex justify-between items-center backdrop-blur-md">
            <div className="flex items-center gap-8 pl-4">
                <div className="text-xl font-black text-yellow-400 flex items-center gap-2">${coins}</div>
                <div className="h-4 w-px bg-stone-700" />
                <div className="flex items-center gap-2">
                    <div className={`text-xl font-black font-mono ${dayTime < EVENING_THRESHOLD_MS ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {formatTime(dayTime)}
                    </div>
                    <div className="text-[9px] text-stone-500 uppercase tracking-widest ml-1">DAY {dayCount}</div>
                </div>
                <div className="h-4 w-px bg-stone-700" />
                <div className="text-[9px] text-stone-500 uppercase tracking-widest hidden lg:block">Controls: [WASD] Move | [Space] Dig | [Z/X] Flag | [E] Interact | [I] Inventory</div>
            </div>
        </div>

        {message && (
             <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 text-white px-4 py-2 rounded font-bold uppercase text-xs animate-bounce shadow-lg">
                {message}
             </div>
        )}

        <div className="relative w-full h-full pt-20 overflow-hidden bg-black">
          {/* Main Game World Container with JS Interpolated Camera (No CSS Transition) */}
          <div 
            className="w-full h-full will-change-transform" 
            style={{ transform: `translate3d(${-camera.x}px, ${-camera.y}px, 0)` }}
          >
              
              {/* Overworld Section (Negative Y) */}
              <div 
                className="absolute left-[-200%] right-[-200%] flex justify-center pointer-events-none transition-[background] duration-[2000ms]" 
                style={{ bottom: '100%', height: '800px', background: getSkyGradient() }}
              >
                 <div className="relative w-full h-full">
                    {/* Clouds */}
                    <div className="absolute top-20 left-1/2 -translate-x-60 text-6xl opacity-60 animate-pulse drop-shadow-xl transition-opacity duration-1000" style={{ opacity: dayTime < EVENING_THRESHOLD_MS ? 0.2 : 0.6 }}>☁️</div>
                    <div className="absolute top-40 left-1/2 translate-x-80 text-6xl opacity-40 drop-shadow-xl transition-opacity duration-1000" style={{ opacity: dayTime < EVENING_THRESHOLD_MS ? 0.1 : 0.4 }}>☁️</div>
                    
                    {/* Floor */}
                    <div className="absolute bottom-0 left-0 right-0 h-[40px] z-10">
                        <div className="absolute inset-0 bg-[#3a2618]" />
                        <div className="absolute top-0 left-0 right-0 h-4 bg-[#4ade80] shadow-[0_4px_0_rgba(0,0,0,0.1)] transition-colors duration-[5000ms]" style={{ filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.5)' : 'none' }} />
                        <div className="absolute top-0 left-0 right-0 h-2 bg-[#86efac] transition-colors duration-[5000ms]" style={{ filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.5)' : 'none' }} />
                    </div>

                    {/* All Overworld Buildings are positioned relative to the Center of the Map (which aligns with mine center approx) */}
                    <div className="absolute bottom-0 left-1/2 w-0 h-0 overflow-visible">

                        {/* Mine Entrance */}
                        <div className="absolute bottom-0 z-20 w-16 h-4 bg-black/60 rounded-full blur-[2px]"
                             style={{ left: (ROPE_X - 8) * GRID_CONFIG.TILE_SIZE + 20 }} />

                        {/* Headframe */}
                        <div className="absolute bottom-[40px] z-10 flex flex-col items-center transition-[filter] duration-[5000ms]" 
                             style={{ 
                                 left: (ROPE_X - 8) * GRID_CONFIG.TILE_SIZE + 20, 
                                 filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.6)' : 'none'
                             }}>
                             <div className="absolute bottom-0 -left-6 w-2 h-32 bg-amber-900 border-l border-amber-950 skew-x-6 origin-bottom shadow-xl" />
                             <div className="absolute bottom-0 -right-6 w-2 h-32 bg-amber-900 border-r border-amber-950 -skew-x-6 origin-bottom shadow-xl" />
                             <div className="absolute bottom-12 w-20 h-2 bg-amber-800 shadow-md" />
                             <div className="absolute bottom-24 w-14 h-2 bg-amber-800 shadow-md" />
                             <div className="absolute bottom-[120px] w-12 h-4 bg-slate-800 rounded flex justify-center items-center z-20 shadow-lg">
                                 <div className="w-8 h-8 rounded-full border-4 border-slate-600 bg-black/80 animate-spin [animation-duration:8s]" />
                             </div>
                             <div className="absolute bottom-0 h-[124px] w-1 bg-amber-700 shadow-[1px_0_2px_rgba(0,0,0,0.5)]" />
                        </div>

                        {/* Player House */}
                        <div className="absolute bottom-[40px] flex flex-col items-center z-20 transition-[filter] duration-[5000ms]"
                             style={{ 
                                 left: (HOUSE_X - 8) * GRID_CONFIG.TILE_SIZE,
                                 filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.7)' : 'none' 
                             }}>
                            <div className="w-32 h-24 bg-stone-300 border-4 border-stone-500 shadow-2xl relative">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[70px] border-l-transparent border-r-[70px] border-r-transparent border-b-[50px] border-b-red-900 drop-shadow-md" />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-16 bg-amber-900 border-2 border-amber-950">
                                    <div className="absolute top-8 right-1 w-1 h-1 bg-yellow-500 rounded-full" />
                                </div>
                                <div className="absolute top-4 right-4 w-8 h-8 bg-blue-300 border-2 border-stone-500">
                                    <div className="w-full h-1/2 border-b border-stone-500" />
                                    <div className="h-full w-1/2 border-r border-stone-500 absolute top-0 left-0" />
                                    <div className={`absolute inset-0 bg-yellow-300/60 transition-opacity duration-1000 ${dayTime < EVENING_THRESHOLD_MS ? 'opacity-100' : 'opacity-0'}`} />
                                </div>
                            </div>
                             {dayTime <= EVENING_THRESHOLD_MS && (
                                 <div className="absolute -top-20 right-0 text-white animate-bounce text-xs font-bold">Zzz...</div>
                             )}
                        </div>

                        {/* Shop Building */}
                        <div className="absolute bottom-[40px] flex flex-col items-center z-20 transition-[filter] duration-[5000ms]"
                             style={{ 
                                 left: (SHOP_X - 8) * GRID_CONFIG.TILE_SIZE,
                                 filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.6)' : 'none' 
                             }}>
                            <div className="w-40 h-28 bg-slate-800 border-4 border-amber-600 shadow-2xl relative">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-10 bg-amber-800 transform skew-x-12 border-b-4 border-black shadow-lg flex items-center justify-center">
                                     <div className="w-full h-1 bg-white/10" />
                                </div>
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] bg-black text-amber-500 px-3 py-1 uppercase font-black tracking-widest border border-amber-500 shadow-lg glow-amber">
                                    Commissary
                                </div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-20 bg-black/60 border-t-2 border-x-2 border-amber-900 flex justify-center">
                                    <div className="w-px h-full bg-black" />
                                </div>
                                <div className="absolute top-12 left-2 w-8 h-8 bg-blue-900/50 border border-slate-600 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                                    <div className={`absolute inset-0 bg-amber-500/30 transition-opacity duration-1000 ${dayTime < EVENING_THRESHOLD_MS ? 'opacity-100' : 'opacity-0'}`} />
                                </div>
                                <div className="absolute top-12 right-2 w-8 h-8 bg-blue-900/50 border border-slate-600 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                                    <div className={`absolute inset-0 bg-amber-500/30 transition-opacity duration-1000 ${dayTime < EVENING_THRESHOLD_MS ? 'opacity-100' : 'opacity-0'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Recycling Plant */}
                        <div className="absolute bottom-[40px] flex flex-col items-center z-20 transition-[filter] duration-[5000ms]"
                             style={{ 
                                 left: (RECYCLER_X - 8) * GRID_CONFIG.TILE_SIZE,
                                 filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.6)' : 'none' 
                             }}>
                            <div className="w-48 h-32 bg-stone-800 border-4 border-lime-800 shadow-2xl relative">
                                {/* RECYCLING PROGRESS BAR */}
                                {recyclingDisplay.queue > 0 && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 bg-black border border-lime-600 p-1 flex flex-col gap-1 z-50">
                                        <div className="flex justify-between text-[7px] text-lime-400 font-bold uppercase">
                                            <span>Processing</span>
                                            <span>{recyclingDisplay.queue} Queued</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-800">
                                            <div 
                                                className="h-full bg-lime-500 transition-all duration-100" 
                                                style={{ width: `${recyclingDisplay.progress * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Smokestacks */}
                                <div className="absolute -top-16 left-4 w-6 h-16 bg-stone-700 border-x-2 border-stone-900 flex flex-col items-center">
                                     <div className="w-8 h-2 bg-stone-900 absolute -top-2" />
                                     <div className="absolute -top-10 text-2xl animate-pulse opacity-50">☁️</div>
                                </div>
                                <div className="absolute -top-12 left-14 w-6 h-12 bg-stone-700 border-x-2 border-stone-900 flex flex-col items-center">
                                     <div className="w-8 h-2 bg-stone-900 absolute -top-2" />
                                </div>

                                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] bg-lime-900 text-lime-400 px-3 py-1 uppercase font-black tracking-widest border border-lime-500 shadow-lg">
                                    Recycling
                                </div>
                                
                                <div className="absolute bottom-0 right-4 w-24 h-20 bg-black/60 border-t-2 border-x-2 border-stone-600 flex justify-center">
                                    {/* Garage door lines */}
                                    <div className="w-full h-full flex flex-col gap-2 pt-2 px-1">
                                        <div className="h-px bg-stone-700 w-full" />
                                        <div className="h-px bg-stone-700 w-full" />
                                        <div className="h-px bg-stone-700 w-full" />
                                        <div className="h-px bg-stone-700 w-full" />
                                        <div className="h-px bg-stone-700 w-full" />
                                    </div>
                                </div>

                                <div className={`absolute top-12 left-4 w-12 h-12 bg-lime-900/20 border border-stone-600 rounded-full flex items-center justify-center ${recyclingDisplay.queue > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
                                     <div className="text-xl">♻️</div>
                                </div>
                            </div>
                        </div>

                    </div>
                 </div>
              </div>

              {/* Mine Grid - Centered Horizontally in this container if X=0 is 0px translation? No, X is player coords. */}
              {/* If cameraX is 0, the screen center is at 0px. The Mine grid starts at X=0, so it would be on the right half. */}
              {/* We need the Mine Grid to be positioned such that tile 8 is at world-X 8*TILE_SIZE */}
              <div 
                className="absolute top-0 shadow-[0_0_100px_rgba(0,0,0,0.8)] bg-[#140b08] border-x-4 border-stone-800" 
                style={{ 
                    left: 0, 
                    width: GRID_CONFIG.COLUMNS * GRID_CONFIG.TILE_SIZE + 8, // +8 for borders
                    height: GRID_CONFIG.ROWS * GRID_CONFIG.TILE_SIZE 
                }}
              >
                <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID_CONFIG.COLUMNS}, 1fr)` }}>
                  {grid.map((row, y) => row.map((tile, x) => <Tile key={`${x}-${y}`} tile={tile} isTargeted={currentTarget.x === x && currentTarget.y === y && player.y >= 0} isSafetyOn={false} />))}
                </div>
                
                {/* Rope continuation in mine with dynamic length */}
                <div 
                    className="absolute top-0 z-0 w-1 bg-amber-700 shadow-[1px_0_2px_rgba(0,0,0,0.5)] transition-all duration-500" 
                    style={{ 
                      left: ROPE_X * GRID_CONFIG.TILE_SIZE + 20 + 4, 
                      transform: 'translateX(-50%)',
                      height: `${ropeLength * GRID_CONFIG.TILE_SIZE}px`
                    }}
                />
              </div>

              {/* Player Entity - Positioned absolutely based on world coords */}
              <div className="absolute z-50 transition-transform duration-75" style={{ width: GRID_CONFIG.TILE_SIZE, height: GRID_CONFIG.TILE_SIZE, left: player.x * GRID_CONFIG.TILE_SIZE + 4, top: player.y * GRID_CONFIG.TILE_SIZE }}> 
                  <div className={`w-8 h-8 mx-auto mt-1 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${player.vy < 0 ? 'bg-cyan-300' : 'bg-orange-500'} ${player.facing === Direction.LEFT ? 'scale-x-[-1]' : 'scale-x-1'} transition-transform`}>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-black rounded-full" />
                        <div className="w-1.5 h-1.5 bg-black rounded-full" />
                    </div>
                  </div>
                  {/* Floating Action Prompts */}
                  {showRopePrompt && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-black text-[8px] px-2 py-1 rounded font-black uppercase animate-bounce border-2 border-black shadow-xl">
                        {ropePromptText}
                    </div>
                  )}
                  {showShopPrompt && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500 text-black text-[8px] px-2 py-1 rounded font-black uppercase animate-bounce border-2 border-black shadow-xl">
                        ENTER COMMISSARY [E]
                    </div>
                  )}
                  {showHousePrompt && (
                    <div className={`absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-black text-[8px] px-2 py-1 rounded font-black uppercase animate-bounce border-2 border-black shadow-xl ${timeRef.current <= EVENING_THRESHOLD_MS ? 'bg-blue-300' : 'bg-stone-300 opacity-50'}`}>
                        {housePromptText}
                    </div>
                  )}
                  {showRecyclerPrompt && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-lime-500 text-black text-[8px] px-2 py-1 rounded font-black uppercase animate-bounce border-2 border-black shadow-xl">
                        OPEN RECYCLER [E]
                    </div>
                  )}
                </div>

          </div>
        </div>
      </div>

      {isShopOpen && <ShopOverlay coins={coins} inventory={inventory} onBuy={handleShopBuy} onClose={() => setIsShopOpen(false)} />}
      {isRecyclerOpen && <RecyclingOverlay inventory={inventory} onRecycle={handleRecycleQueue} onClose={() => setIsRecyclerOpen(false)} />}
      {isInventoryOpen && <InventoryOverlay inventory={inventory} onClose={() => setIsInventoryOpen(false)} />}

      {(status === GameStatus.LOST || status === GameStatus.WON) && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-10 text-center animate-in fade-in zoom-in">
            <h2 className={`text-4xl font-black mb-4 uppercase ${status === GameStatus.LOST ? 'text-red-500' : 'text-green-500'}`}>{status === GameStatus.LOST ? 'Critical Failure' : 'Mission Complete'}</h2>
            <p className="text-lg mb-12 text-stone-400">Final Log Depth: <span className="text-white">{depth * 10}m</span></p>
            <button onClick={initGame} className="bg-white text-black px-16 py-4 font-black uppercase tracking-widest border-b-4 border-stone-400 hover:scale-105 transition-all">Re-Deploy</button>
        </div>
      )}
    </div>
  );
};

export default App;
