
import { useCallback } from 'react';
import { PlayerPosition, Direction, Inventory, WorldItem, TileState } from '../types';
import { PHYSICS, OVERWORLD_MIN_X, OVERWORLD_MAX_X, GRID_CONFIG } from '../constants';

interface PhysicsParams {
  playerRef: React.MutableRefObject<PlayerPosition>;
  keys: React.MutableRefObject<Record<string, boolean>>;
  canJumpRef: React.MutableRefObject<boolean>;
  isSolid: (cx: number, cy: number) => boolean;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerPosition>>;
  setWorldItems: React.Dispatch<React.SetStateAction<WorldItem[]>>;
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  gridRef: React.MutableRefObject<TileState[][]>;
  setGrid: React.Dispatch<React.SetStateAction<TileState[][]>>;
  checkRopeInteraction: () => void;
  setMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

export const usePhysics = () => {
  const updatePhysics = useCallback((params: PhysicsParams) => {
    const {
      playerRef,
      keys,
      canJumpRef,
      isSolid,
      setPlayer,
      setWorldItems,
      setInventory,
      setCoins,
      gridRef,
      setGrid,
      checkRopeInteraction,
      setMessage
    } = params;

    const p = playerRef.current;
    
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
          // Overworld bounds
          if (nextX < OVERWORLD_MIN_X || nextX > OVERWORLD_MAX_X) canMoveX = false;
      } else {
          // Mine bounds - prevent leaving the grid horizontally
          if (nextX < 0 || nextX > GRID_CONFIG.COLUMNS - 1) canMoveX = false;
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

      if (!moveUp) canJumpRef.current = true;
      
      // Apply gravity to world items and handle collection
      setWorldItems(prev => {
          // First apply gravity to all items
          const updatedItems = prev.map(item => {
              // Apply gravity
              let newVy = item.vy + PHYSICS.GRAVITY * 0.5; // Slower gravity for items
              let newY = item.y + newVy;
              
              // Check for ground collision
              const tx = Math.floor(item.x);
              const tyBelow = Math.floor(newY + 0.5);
              const tileBelow = gridRef.current[tyBelow]?.[tx];
              
              // Item lands if tile below is not revealed OR if it's at the bottom
              if (tyBelow >= GRID_CONFIG.ROWS || (tileBelow && !tileBelow.isRevealed) || (tileBelow && tileBelow.item === 'SILVER_BLOCK')) {
                  newY = Math.floor(item.y);
                  newVy = 0;
              }
              
              // Cap fall speed
              if (newVy > PHYSICS.MAX_FALL * 0.5) newVy = PHYSICS.MAX_FALL * 0.5;
              
              return { ...item, y: newY, vy: newVy };
          });
          
          // Then check for collection
          const collected = updatedItems.filter(item => Math.abs(item.x - p.x) < 0.8 && Math.abs(item.y - p.y) < 0.8);
          if (collected.length > 0) {
              // Count items first (synchronously)
              const counts = { scrap: 0, gem: 0, coal: 0, coin: 0, stone: 0 };
              collected.forEach(item => {
                  if (item.type === 'SCRAP') counts.scrap++;
                  if (item.type === 'GEM') counts.gem++;
                  if (item.type === 'COAL') counts.coal++;
                  if (item.type === 'STONE') counts.stone++;
                  if (item.type === 'COIN') counts.coin++;
              });
              
              // Update inventory
              setInventory(inv => {
                  const newInv = { ...inv };
                  newInv.scrapMetal += counts.scrap;
                  newInv.gems += counts.gem;
                  newInv.coal += counts.coal;
                  newInv.stone += counts.stone;
                  return newInv;
              });
              
              // Update coins separately
              if (counts.coin > 0) {
                  setCoins(c => c + counts.coin);
              }
              
              // Show pickup message
              const messages: string[] = [];
              if (counts.scrap > 0) messages.push(`+${counts.scrap} SCRAP`);
              if (counts.stone > 0) messages.push(`+${counts.stone} STONE 🪨`);
              if (counts.gem > 0) messages.push(`+${counts.gem} GEM 💎`);
              if (counts.coal > 0) messages.push(`+${counts.coal} COAL`);
              if (counts.coin > 0) messages.push(`+${counts.coin} COIN`);
              if (messages.length > 0) {
                setMessage(messages.join(' | '));
                setTimeout(() => setMessage(null), 1500);
              }
              
              return updatedItems.filter(item => !collected.some(c => c.id === item.id));
          }
          return updatedItems;
      });

      playerRef.current = { ...p }; 
      setPlayer({ ...p });
    } else {
      setPlayer({ ...playerRef.current });
    }
    
    checkRopeInteraction();
  }, []);

  return { updatePhysics };
};

