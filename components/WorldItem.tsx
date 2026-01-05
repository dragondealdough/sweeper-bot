
import React from 'react';
import { ItemType } from '../types';
import { GRID_CONFIG } from '../constants';

interface WorldItemProps {
  x: number;
  y: number;
  type: ItemType;
}

const WorldItem: React.FC<WorldItemProps> = ({ x, y, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'SCRAP': return '⚙️';
      case 'GEM': return '💎';
      case 'COAL': return '⬛';
      case 'COIN': return '💰';
      case 'STONE': return '🪨';
      default: return '❓';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'SCRAP': return 'SCRAP';
      case 'GEM': return 'GEM';
      case 'COAL': return 'COAL';
      case 'COIN': return 'COIN';
      case 'STONE': return 'STONE';
      default: return '';
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'SCRAP': return 'text-lime-400';
      case 'GEM': return 'text-pink-400';
      case 'COAL': return 'text-stone-400';
      case 'COIN': return 'text-yellow-400';
      case 'STONE': return 'text-stone-300';
      default: return 'text-white';
    }
  };

  return (
    <div 
      className="absolute flex flex-col items-center justify-center pointer-events-none z-30 transition-transform duration-75"
      style={{
        left: x * GRID_CONFIG.TILE_SIZE + 4,
        top: y * GRID_CONFIG.TILE_SIZE,
        width: GRID_CONFIG.TILE_SIZE,
        height: GRID_CONFIG.TILE_SIZE,
      }}
    >
      <div className={`text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
        {getIcon()}
      </div>
      <div className={`text-[6px] font-black uppercase tracking-tighter ${getColorClass()} bg-black/40 px-1 rounded`}>
        {getLabel()}
      </div>
    </div>
  );
};

export default WorldItem;

