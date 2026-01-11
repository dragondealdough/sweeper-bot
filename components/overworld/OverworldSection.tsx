
import React from 'react';
import { GRID_CONFIG } from '../../constants';
import { Inventory } from '../../types';
import { TutorialState } from '../../hooks/useTutorial';

interface OverworldSectionProps {
  dayTime: number;
  dayCount: number;
  EVENING_THRESHOLD_MS: number;
  DAY_DURATION_MS: number;
  ROPE_X: number;
  HOUSE_X: number;
  SHOP_X: number;
  RECYCLER_X: number;
  CONSTRUCTION_X: number;
  WISHING_WELL_X: number;
  ropeLength: number;
  inventory: Inventory;
  isShopOpen: boolean;
  isRecyclerOpen: boolean;
  isConstructionOpen: boolean;
  getSkyGradient: () => string;
  recyclingDisplay?: { queue: number; progress: number };
  tutorialState?: TutorialState;
  playerX?: number;
  armadilloX?: number;
}

const OverworldSection: React.FC<OverworldSectionProps> = ({
  dayTime,
  EVENING_THRESHOLD_MS,
  ROPE_X,
  HOUSE_X,
  SHOP_X,
  RECYCLER_X,
  CONSTRUCTION_X,
  WISHING_WELL_X,
  inventory,
  isShopOpen,
  isRecyclerOpen,
  isConstructionOpen,
  getSkyGradient,
  recyclingDisplay = { queue: 0, progress: 0 },
  tutorialState,
  playerX = 0,
  armadilloX = 3,
}) => {
  // Convert tile X to pixel position (same as player positioning)
  const tileToPixel = (tileX: number) => tileX * GRID_CONFIG.TILE_SIZE + 4;

  // Get the center pixel of a tile (where the door/interaction point should be)
  const tileCenterPixel = (tileX: number) => tileToPixel(tileX) + GRID_CONFIG.TILE_SIZE / 2;

  // Floor/grass is at y=-40px (top of the floor tile)
  const FLOOR_Y = -GRID_CONFIG.TILE_SIZE; // -40px

  // Building heights (from Tailwind classes: h-24=96px, h-28=112px, h-32=128px, h-20=80px)
  const HOUSE_HEIGHT = 96;      // h-24
  const SHOP_HEIGHT = 112;      // h-28
  const RECYCLER_HEIGHT = 128;  // h-32
  const CONSTRUCTION_HEIGHT = 80; // h-20

  // Calculate door/interaction point centers for each building
  // Shop door is centered within building which is at tileCenterPixel
  // Subtract offset to align bubble arrow directly over door (measured 31px off)
  const getShopDoorCenter = () => tileCenterPixel(SHOP_X) - 50;
  const getRecyclerDoorCenter = () => {
    // Recycler garage door: building w-48 (192px), door w-24 (96px) at right-4 (16px from right)
    // Building center + (building_width/2 - right_offset - door_width/2)
    return tileCenterPixel(RECYCLER_X) + (192 / 2 - 16 - 96 / 2); // = tileCenterPixel(RECYCLER_X) + 32
  };
  const getConstructionCenter = () => tileCenterPixel(CONSTRUCTION_X); // Construction interaction is centered
  const getMineCenter = () => tileCenterPixel(ROPE_X); // Mine rope is centered

  return (
    <>
      {/* Sky Background - positioned above the mine (y < 0) */}
      <div
        className="absolute pointer-events-none transition-[background] duration-[2000ms]"
        style={{
          left: -2000,
          right: -2000,
          top: -800,
          height: 800,
          background: getSkyGradient()
        }}
      >
        {/* Clouds */}
        <div className="absolute bottom-60 text-6xl opacity-60 animate-pulse drop-shadow-xl transition-opacity duration-1000"
          style={{ left: tileCenterPixel(ROPE_X - 3) + 2000, opacity: dayTime < EVENING_THRESHOLD_MS ? 0.2 : 0.6 }}>☁️</div>
        <div className="absolute bottom-40 text-6xl opacity-40 drop-shadow-xl transition-opacity duration-1000"
          style={{ left: tileCenterPixel(ROPE_X + 5) + 2000, opacity: dayTime < EVENING_THRESHOLD_MS ? 0.1 : 0.4 }}>☁️</div>
      </div>

      {/* Ground/Floor - at y=-1 tile level (from -40px to 0px) */}
      <div
        className="absolute z-10 pointer-events-none"
        style={{
          left: -2000,
          right: -2000,
          top: FLOOR_Y,
          height: GRID_CONFIG.TILE_SIZE
        }}
      >
        <div className="absolute inset-0 bg-[#3a2618]" />
        <div className="absolute top-0 left-0 right-0 h-4 bg-[#4ade80] shadow-[0_4px_0_rgba(0,0,0,0.1)] transition-colors duration-[5000ms]" style={{ filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.5)' : 'none' }} />
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#86efac] transition-colors duration-[5000ms]" style={{ filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.5)' : 'none' }} />
      </div>

      {/* Buildings - positioned using world tile coordinates, bottom aligned with floor */}

      {/* Mine Entrance Shadow - on the ground */}
      <div
        className="absolute z-20 w-16 h-4 bg-black/60 rounded-full blur-[2px]"
        style={{
          left: tileCenterPixel(ROPE_X) - 32,
          top: FLOOR_Y - 4 // Just above the floor
        }}
      />

      {/* Headframe - the rope mechanism. Position so legs sit on ground. */}
      <div
        className="absolute z-10 transition-[filter] duration-[5000ms]"
        style={{
          left: tileCenterPixel(ROPE_X),
          top: FLOOR_Y, // Anchor point at floor level
          transform: 'translateX(-50%)',
          filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.6)' : 'none'
        }}
      >
        {/* Container positioned at floor, children extend upward using negative positioning */}
        <div className="relative">
          {/* A-frame legs - 128px tall, extending up from floor */}
          <div className="absolute bottom-0 -left-6 w-2 h-32 bg-amber-900 border-l border-amber-950 skew-x-6 origin-bottom shadow-xl" />
          <div className="absolute bottom-0 -right-6 w-2 h-32 bg-amber-900 border-r border-amber-950 -skew-x-6 origin-bottom shadow-xl" />
          {/* Cross beams */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-20 h-2 bg-amber-800 shadow-md" />
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-14 h-2 bg-amber-800 shadow-md" />
          {/* Pulley at top */}
          <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 w-12 h-4 bg-slate-800 rounded flex justify-center items-center z-20 shadow-lg">
            <div className="w-8 h-8 rounded-full border-4 border-slate-600 bg-black/80 animate-spin [animation-duration:8s]" />
          </div>
          {/* The rope hanging from the pulley */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[124px] w-1 bg-amber-700 shadow-[1px_0_2px_rgba(0,0,0,0.5)]" />
        </div>
      </div>

      {/* Player House - bottom of building sits on floor */}
      <div
        className="absolute z-20 transition-[filter] duration-[5000ms]"
        style={{
          left: tileCenterPixel(HOUSE_X),
          top: FLOOR_Y - HOUSE_HEIGHT, // Building bottom at floor
          transform: 'translateX(-50%)',
          filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.7)' : 'none'
        }}
      >
        <div className="w-40 h-24 bg-stone-300 border-4 border-stone-500 shadow-2xl relative">
          {/* Roof extends above the main building - wider to match */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[85px] border-l-transparent border-r-[85px] border-r-transparent border-b-[50px] border-b-red-900 drop-shadow-md" />
          {/* Left Window */}
          <div className="absolute top-4 left-3 w-6 h-6 bg-blue-300 border-2 border-stone-500">
            <div className="w-full h-1/2 border-b border-stone-500" />
            <div className="h-full w-1/2 border-r border-stone-500 absolute top-0 left-0" />
            <div className={`absolute inset-0 bg-yellow-300/60 transition-opacity duration-1000 ${dayTime < EVENING_THRESHOLD_MS ? 'opacity-100' : 'opacity-0'}`} />
          </div>
          {/* Door - centered */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-16 bg-amber-900 border-2 border-amber-950">
            <div className="absolute top-8 right-1 w-1 h-1 bg-yellow-500 rounded-full" />
          </div>
          {/* Right Window */}
          <div className="absolute top-4 right-3 w-6 h-6 bg-blue-300 border-2 border-stone-500">
            <div className="w-full h-1/2 border-b border-stone-500" />
            <div className="h-full w-1/2 border-r border-stone-500 absolute top-0 left-0" />
            <div className={`absolute inset-0 bg-yellow-300/60 transition-opacity duration-1000 ${dayTime < EVENING_THRESHOLD_MS ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        </div>
        {dayTime <= EVENING_THRESHOLD_MS && (
          <div className="absolute -top-20 right-0 text-white animate-bounce text-xs font-bold">Zzz...</div>
        )}

      </div>

      {/* Shop Building - bottom sits on floor */}
      <div
        className="absolute z-20 transition-[filter] duration-[5000ms]"
        style={{
          left: tileCenterPixel(SHOP_X),
          top: FLOOR_Y - SHOP_HEIGHT, // Building bottom at floor
          transform: 'translateX(-50%)',
          filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.6)' : 'none'
        }}
      >
        <div className="w-40 h-28 bg-slate-800 border-4 border-amber-600 shadow-2xl relative">
          {/* Awning extends above */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-10 bg-amber-800 transform skew-x-12 border-b-4 border-black shadow-lg flex items-center justify-center">
            <div className="w-full h-1 bg-white/10" />
          </div>
          {/* Sign - positioned below awning */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] bg-black text-amber-500 px-3 py-1 uppercase font-black tracking-widest border border-amber-500 shadow-lg z-10">
            Commissary
          </div>
          {/* Door */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-20 bg-black/60 border-t-2 border-x-2 border-amber-900 flex justify-center">
            <div className="w-px h-full bg-black" />
          </div>
          {/* Windows */}
          <div className="absolute top-12 left-2 w-8 h-8 bg-blue-900/50 border border-slate-600 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
            <div className={`absolute inset-0 bg-amber-500/30 transition-opacity duration-1000 ${dayTime < EVENING_THRESHOLD_MS ? 'opacity-100' : 'opacity-0'}`} />
          </div>
          <div className="absolute top-12 right-2 w-8 h-8 bg-blue-900/50 border border-slate-600 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
            <div className={`absolute inset-0 bg-amber-500/30 transition-opacity duration-1000 ${dayTime < EVENING_THRESHOLD_MS ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        </div>
      </div>

      {/* Recycling Plant - bottom sits on floor */}
      <div
        className="absolute z-20 transition-[filter] duration-[5000ms]"
        style={{
          left: tileCenterPixel(RECYCLER_X),
          top: FLOOR_Y - RECYCLER_HEIGHT, // Building bottom at floor
          transform: 'translateX(-50%)',
          filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.6)' : 'none'
        }}
      >
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

          {/* Smokestacks extend above */}
          <div className="absolute -top-16 left-4 w-6 h-16 bg-stone-700 border-x-2 border-stone-900 flex flex-col items-center">
            <div className="w-8 h-2 bg-stone-900 absolute -top-2" />
            <div className="absolute -top-10 text-2xl animate-pulse opacity-50">☁️</div>
          </div>
          <div className="absolute -top-12 left-14 w-6 h-12 bg-stone-700 border-x-2 border-stone-900 flex flex-col items-center">
            <div className="w-8 h-2 bg-stone-900 absolute -top-2" />
          </div>

          {/* Sign */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] bg-lime-900 text-lime-400 px-3 py-1 uppercase font-black tracking-widest border border-lime-500 shadow-lg">
            Recycling
          </div>

          {/* Garage door */}
          <div className="absolute bottom-0 right-4 w-24 h-20 bg-black/60 border-t-2 border-x-2 border-stone-600 flex justify-center">
            <div className="w-full h-full flex flex-col gap-2 pt-2 px-1">
              <div className="h-px bg-stone-700 w-full" />
              <div className="h-px bg-stone-700 w-full" />
              <div className="h-px bg-stone-700 w-full" />
              <div className="h-px bg-stone-700 w-full" />
              <div className="h-px bg-stone-700 w-full" />
            </div>
          </div>

          {/* Recycling wheel */}
          <div className={`absolute top-12 left-4 w-12 h-12 bg-lime-900/20 border border-stone-600 rounded-full flex items-center justify-center ${recyclingDisplay.queue > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
            <div className="text-xl">♻️</div>
          </div>
        </div>
      </div>

      {/* Construction Site - bottom sits on floor */}
      <div
        className="absolute z-20 transition-[filter] duration-[5000ms]"
        style={{
          left: tileCenterPixel(CONSTRUCTION_X),
          top: FLOOR_Y - CONSTRUCTION_HEIGHT, // Building bottom at floor
          transform: 'translateX(-50%)',
          filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.6)' : 'none'
        }}
      >
        <div className="w-48 h-20 bg-orange-900/20 border-x-4 border-t-4 border-orange-900/40 relative flex items-center justify-center">
          {/* Hazard stripes background */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(194,65,12,0.1),rgba(194,65,12,0.1)_10px,transparent_10px,transparent_20px)]" />

          {/* Scaffolding poles */}
          <div className="absolute -top-16 left-4 w-2 h-16 bg-amber-700 border border-amber-900" />
          <div className="absolute -top-16 right-4 w-2 h-16 bg-amber-700 border border-amber-900" />
          <div className="absolute -top-16 left-4 right-4 h-2 bg-amber-700 border border-amber-900" />
          <div className="absolute -top-8 left-8 right-8 h-1 bg-amber-600" />

          {/* Construction cone */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[16px] border-b-orange-500" />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-1 bg-white mt-2" />

          {/* Sign */}
          <div className="text-[10px] font-black text-orange-700 uppercase tracking-widest animate-pulse z-10">
            Construction Site
          </div>
        </div>
      </div>

      {/* Wishing Well - between house and mine (only when built) */}
      {inventory.wishingWellBuilt && (
        <div
          className="absolute z-20 transition-[filter] duration-[5000ms]"
          style={{
            left: tileCenterPixel(WISHING_WELL_X),
            top: FLOOR_Y - 48,
            transform: 'translateX(-50%)',
            filter: dayTime < EVENING_THRESHOLD_MS ? 'brightness(0.7)' : 'none'
          }}
        >
          <div className="flex flex-col items-center">
            {/* Well structure */}
            <div className="w-16 h-12 bg-stone-400 border-2 border-stone-500 rounded-t-xl relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-stone-600" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-8 bg-blue-400/50 border-t-2 border-stone-500" />
              {/* Roof supports */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-2 bg-stone-800" />
              <div className="absolute -top-10 left-2 w-1 h-10 bg-stone-700" />
              <div className="absolute -top-10 right-2 w-1 h-10 bg-stone-700" />
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[10px] border-b-stone-800" />
            </div>
            <div className="text-[8px] font-bold text-white bg-blue-500/50 px-2 py-0.5 rounded-full mt-1">WISHING WELL</div>
          </div>
        </div>
      )}

      {/* Armadillo NPC - only when wishing well is built */}
      {inventory.wishingWellBuilt && (
        <div
          className="absolute z-25 transition-all duration-100"
          style={{
            left: `${armadilloX * GRID_CONFIG.TILE_SIZE + 4}px`,
            top: FLOOR_Y - 24,
          }}
        >
          <div className="text-2xl" style={{ transform: armadilloX > WISHING_WELL_X ? 'scaleX(-1)' : 'scaleX(1)' }}>🦔</div>
        </div>
      )}

      {/* Tutorial Floating Bubbles - positioned in world coordinates, at root level */}
      {tutorialState && (() => {
        // Determine which bubble should be shown (only one at a time)
        // Priority order: Shop > Construction > Mine > Recycler
        let activeBubble: { label: string; left: number } | null = null;

        if (tutorialState.showArrowToShop && Math.abs(playerX - SHOP_X) >= 2 && !isShopOpen) {
          activeBubble = { label: 'Commissary', left: getShopDoorCenter() };
        } else if (tutorialState.showArrowToConstruction && Math.abs(playerX - CONSTRUCTION_X) >= 2 && !isConstructionOpen) {
          activeBubble = { label: 'Construction', left: getConstructionCenter() };
        } else if (tutorialState.showArrowToMine && Math.abs(playerX - ROPE_X) >= 2) {
          activeBubble = { label: 'Mine', left: getMineCenter() };
        } else if (tutorialState.showArrowToRecycler && Math.abs(playerX - RECYCLER_X) >= 2 && !isRecyclerOpen) {
          activeBubble = { label: 'Recycler', left: getRecyclerDoorCenter() };
        }

        return activeBubble ? (
          <div
            className="absolute pointer-events-none animate-bounce z-[60]"
            style={{
              left: `${activeBubble.left}px`,
              top: `${FLOOR_Y - 140}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex flex-col items-center">
              <div className="bg-amber-500 text-black font-bold px-3 py-1 rounded-lg shadow-lg text-xs uppercase tracking-wider whitespace-nowrap">
                {activeBubble.label}
              </div>
              <div className="text-amber-500 text-3xl mt-0.5">↓</div>
            </div>
          </div>
        ) : null;
      })()}
    </>
  );
};

export default OverworldSection;
