
import React from 'react';
import { TileState, FlagType } from '../types';
import { COLORS, GRID_CONFIG } from '../constants';

interface TileProps {
  tile: TileState;
  isTargeted: boolean;
  isSafetyOn: boolean;
  isHighlighted?: boolean;
}

const Tile: React.FC<TileProps> = ({ tile, isTargeted, isHighlighted }) => {
  const { isRevealed, flag, neighborMines, isMine, item } = tile;

  let content: React.ReactNode = null;

  if (item === 'SILVER_BLOCK') {
    content = (
      <div className="w-full h-full border-2 border-stone-300 bg-stone-500 shadow-inner flex items-center justify-center">
        <div className="w-4 h-4 border border-stone-400" />
      </div>
    );
  } else if (item === 'COIN') {
    content = (
      <div className="w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce shadow-lg flex items-center justify-center">
        <span className="text-[8px] text-yellow-800 font-bold">$</span>
      </div>
    );
  } else if (item === 'GEM') {
    content = (
      <div className="text-xl animate-pulse drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]">💎</div>
    );
  } else if (item === 'COAL') {
    content = (
      <div className="text-xl drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]">⬛</div>
    );
  } else if (item === 'STONE') {
    content = (
      <div className="text-xl drop-shadow-[0_0_3px_rgba(100,100,100,0.8)]">🪨</div>
    );
  } else if (isRevealed) {
    if (isMine) {
      content = <span className="text-xl animate-bounce">💣</span>;
    } else if (neighborMines > 0) {
      content = (
        <span
          style={{ color: COLORS.MINE_TEXT[neighborMines] }}
          className="font-bold text-sm drop-shadow-md select-none"
        >
          {neighborMines}
        </span>
      );
    }
  } else {
    if (flag === FlagType.MINE) {
      content = (
        <div className="flex flex-col items-center drop-shadow-md">
          <div className="w-5 h-4 bg-red-500 rounded-sm border-[1.5px] border-white shadow-lg shadow-red-500/30" />
          <div className="w-0.5 h-3 bg-white/60" />
        </div>
      );
    }
  }

  return (
    <div
      style={{
        width: GRID_CONFIG.TILE_SIZE,
        height: GRID_CONFIG.TILE_SIZE,
        backgroundColor: isRevealed ? COLORS.DIRT_REVEALED : COLORS.DIRT_HIDDEN,
      }}
      className={`
        relative flex items-center justify-center border-[0.5px] border-black/10
        transition-all duration-150
        ${!isRevealed && !item ? 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] hover:brightness-110' : ''}
      `}
    >
      {isHighlighted && !isRevealed && (
        <div className="absolute inset-0 border-[3px] border-red-500 z-30 animate-pulse pointer-events-none rounded-sm shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
      )}
      {isTargeted && (
        <div className="absolute inset-0 border-[3px] border-dashed border-yellow-400/80 z-20 animate-pulse pointer-events-none rounded-sm shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
      )}
      {!isRevealed && !item && (
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:10px_10px]" />
      )}
      {content}
    </div>
  );
};

export default Tile;
