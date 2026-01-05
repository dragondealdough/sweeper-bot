
import React from 'react';
import { CardInstance, CardType } from '../types';

interface CardProps {
  card: CardInstance;
  onClick?: () => void;
  isSelected?: boolean;
  isRevealed?: boolean;
  small?: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, isSelected, isRevealed = true, small = false }) => {
  const isPlayer = card.owner === 'PLAYER';
  const baseColor = isPlayer ? 'bg-blue-900/80 border-blue-500' : 'bg-red-900/80 border-red-500';
  const selectedClass = isSelected ? 'ring-4 ring-yellow-400 -translate-y-2' : '';
  const hoverClass = onClick ? 'hover:scale-105 cursor-pointer hover:shadow-cyan-500/50' : '';

  if (!isRevealed) {
    return (
      <div className={`relative flex items-center justify-center rounded-lg border-2 border-slate-700 bg-slate-800 shadow-xl ${small ? 'w-16 h-24' : 'w-24 h-32'} ${hoverClass}`}>
        <div className="text-4xl text-slate-600">?</div>
      </div>
    );
  }

  const getIcon = (type: CardType) => {
    switch (type) {
      case CardType.BOMBER: return '💣';
      case CardType.RUBBLE: return '🪨';
      case CardType.LEECH: return '🧛';
      case CardType.PICKAXE: return '⛏️';
      case CardType.BOMB_DISPOSAL: return '✂️';
      case CardType.SNIPER: return '🎯';
      case CardType.ASSASSIN: return '🗡️';
      case CardType.SABOTEUR: return '🧨';
      case CardType.MORTAR: return '💥';
      case CardType.SHIELD_BEARER: return '🛡️';
      case CardType.FIELD_MEDIC: return '🩹';
      case CardType.BUNKER: return '🏯';
      case CardType.REINFORCEMENT: return '📞';
      case CardType.VETERAN: return '🎖️';
      case CardType.SCAVENGER: return '🗑️';
      case CardType.MIMIC: return '🎭';
      case CardType.SPY: return '🕵️';
      default: return '🃏';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-between p-2 rounded-lg border-2 shadow-2xl transition-all duration-200 backdrop-blur-sm ${baseColor} ${selectedClass} ${hoverClass} hover:z-[300] ${small ? 'w-16 h-20 text-[8px]' : 'w-24 h-32'}`}
    >
      {/* Description Tooltip - Elevated z-index and fixed stacking */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 bg-slate-900 border-2 border-slate-700 rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.8)] hidden group-hover:block z-[400] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
        <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-700">
           <span className="text-lg">{getIcon(card.def.type)}</span>
           <span className="text-[11px] font-black uppercase text-cyan-400 tracking-tighter">{card.def.name}</span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-200 italic font-mono">
          {card.def.description}
        </p>
        <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[9px] font-bold">
           <span className="text-slate-500 uppercase tracking-widest">Base Pwr:</span>
           <span className="text-white bg-slate-800 px-1.5 rounded">{card.def.baseValue}</span>
        </div>
        {/* Pointer arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-700"></div>
      </div>

      <div className="flex justify-between w-full items-start pointer-events-none">
        <span className="text-xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{getIcon(card.def.type)}</span>
        <span className={`font-black font-mono rounded px-1 text-sm bg-black/40 ${card.currentValue < card.def.baseValue ? 'text-red-400' : card.currentValue > card.def.baseValue ? 'text-green-400' : 'text-white'}`}>
          {card.currentValue}
        </span>
      </div>
      
      {!small && (
        <div className="text-center leading-tight pointer-events-none">
          <p className="font-bold text-[10px] uppercase tracking-tighter truncate w-full text-white/90">{card.def.name}</p>
        </div>
      )}

      {card.timer !== undefined && card.timer > 0 && (
        <div className="absolute -top-2 -right-2 bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs border border-white animate-pulse z-10">
          {card.timer}
        </div>
      )}
      
      {card.isDefused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg backdrop-grayscale z-20">
          <span className="text-[10px] font-bold text-yellow-400 rotate-12 border-2 border-yellow-400 px-1 rounded uppercase tracking-widest">Defused</span>
        </div>
      )}
    </div>
  );
};

export default Card;
