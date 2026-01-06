
import React from 'react';
import { TileState, PlayerPosition, WorldItem as WorldItemType, Direction } from '../types';
import { GRID_CONFIG } from '../constants';
import Tile from './Tile';
import WorldItem from './WorldItem';

interface PromptState {
  showRopePrompt: boolean;
  ropePromptText: string;
  showShopPrompt: boolean;
  showHousePrompt: boolean;
  housePromptText: string;
  showRecyclerPrompt: boolean;
  showConstructionPrompt: boolean;
  canSleep: boolean;
}

interface MiningSectionProps {
  grid: TileState[][];
  player: PlayerPosition;
  worldItems: WorldItemType[];
  currentTarget: { x: number, y: number };
  ropeLength: number;
  ROPE_X: number;
  prompts: PromptState;
  playerHitFlash?: boolean;
  foundMinePosition?: { x: number; y: number } | null;
  selectedTarget?: { x: number; y: number } | null;
  onTileClick?: (x: number, y: number) => void;
}

const MiningSection: React.FC<MiningSectionProps> = ({
  grid,
  player,
  worldItems,
  currentTarget,
  ropeLength,
  ROPE_X,
  playerHitFlash = false,
  prompts,
  foundMinePosition,
  selectedTarget,
  onTileClick,
}) => {
  return (
    <>
      {/* Mine Grid Container */}
      <div
        className="absolute top-0 shadow-[0_0_100px_rgba(0,0,0,0.8)] bg-[#140b08] border-x-4 border-stone-800"
        style={{
          left: 0,
          width: GRID_CONFIG.COLUMNS * GRID_CONFIG.TILE_SIZE + 8,
          height: GRID_CONFIG.ROWS * GRID_CONFIG.TILE_SIZE
        }}
      >
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID_CONFIG.COLUMNS}, 1fr)` }}>
          {grid.map((row, y) => row.map((tile, x) => (
            <Tile
              key={`${x}-${y}`}
              tile={tile}
              isTargeted={currentTarget.x === x && currentTarget.y === y && player.y >= 0}
              isSelected={selectedTarget?.x === x && selectedTarget?.y === y}
              isInRange={Math.abs(x - player.x) < 1.8 && Math.abs(y - player.y) < 1.8}
              onClick={() => onTileClick && onTileClick(x, y)}
              isSafetyOn={false}
              isHighlighted={foundMinePosition?.x === x && foundMinePosition?.y === y}
            />
          )))}
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

      {/* World Items */}
      {worldItems.map(item => (
        <WorldItem key={item.id} x={item.x} y={item.y} type={item.type} />
      ))}

      {/* Player Entity - Positioned absolutely based on world coords */}
      <div
        className="absolute z-50 transition-transform duration-75"
        style={{
          width: GRID_CONFIG.TILE_SIZE,
          height: GRID_CONFIG.TILE_SIZE,
          left: player.x * GRID_CONFIG.TILE_SIZE + 4,
          top: player.y * GRID_CONFIG.TILE_SIZE
        }}
      >
        <div className={`w-8 h-8 mx-auto mt-1 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${playerHitFlash ? 'bg-red-500' : (player.vy < 0 ? 'bg-cyan-300' : 'bg-orange-500')} ${player.facing === Direction.LEFT ? 'scale-x-[-1]' : 'scale-x-1'} transition-colors duration-75`}>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-black rounded-full" />
            <div className="w-1.5 h-1.5 bg-black rounded-full" />
          </div>
        </div>

        {/* Floating Action Prompts */}
        {prompts.showRopePrompt && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-black text-[8px] px-2 py-1 rounded font-black uppercase animate-bounce border-2 border-black shadow-xl z-[60]">
            {prompts.ropePromptText}
          </div>
        )}
        {prompts.showShopPrompt && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500 text-black text-[8px] px-2 py-1 rounded font-black uppercase animate-bounce border-2 border-black shadow-xl z-[60]">
            ENTER COMMISSARY [E]
          </div>
        )}
        {prompts.showHousePrompt && (
          <div className={`absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-black text-[8px] px-2 py-1 rounded font-black uppercase animate-bounce border-2 border-black shadow-xl z-[60] ${prompts.canSleep ? 'bg-blue-300' : 'bg-stone-300 opacity-50'}`}>
            {prompts.housePromptText}
          </div>
        )}
        {prompts.showRecyclerPrompt && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-lime-500 text-black text-[8px] px-2 py-1 rounded font-black uppercase animate-bounce border-2 border-black shadow-xl z-[60]">
            OPEN RECYCLER [E]
          </div>
        )}
        {prompts.showConstructionPrompt && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-orange-500 text-black text-[8px] px-2 py-1 rounded font-black uppercase animate-bounce border-2 border-black shadow-xl z-[60]">
            CONSTRUCTION [E]
          </div>
        )}
      </div>
    </>
  );
};

export default MiningSection;
