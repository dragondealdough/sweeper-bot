
import React, { useEffect, useState, useRef } from 'react';
import { Inventory } from '../types';

interface InventoryOverlayProps {
  inventory: Inventory;
  onClose: () => void;
}

const InventoryOverlay: React.FC<InventoryOverlayProps> = ({ inventory, onClose }) => {
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isCloseSelected, setIsCloseSelected] = useState(true);

  const items = [
    {
      id: 'disarm_charges',
      name: 'Disarm Charges',
      count: inventory.disarmCharges,
      icon: '🧨',
      description: 'Current flagging capacity. Use to mark suspected mines.'
    },
    {
      id: 'disarm_kits',
      name: 'Disarm Kits',
      count: inventory.disarmKits,
      icon: '🧰',
      description: 'Spare kits in reserve. Auto-equips when charges run out.'
    },
    {
      id: 'defused_mine',
      name: 'Defused Mine',
      count: inventory.defusedMines,
      icon: '💣',
      description: 'Inert explosive device. Can be recycled for raw materials.'
    },
    {
      id: 'scrap_metal',
      name: 'Scrap Metal',
      count: inventory.scrapMetal,
      icon: '⚙️',
      description: 'Refined materials reclaimed from ordnance. Used for fabrication.'
    },
    {
      id: 'silver_block',
      name: 'Silver Ore',
      count: inventory.silverBlocks,
      icon: '🥈',
      description: 'High-purity silver ore found in deep strata. Used for construction.'
    },
    {
      id: 'stone',
      name: 'Stone',
      count: inventory.stone,
      icon: '🪨',
      description: 'Common building material. Essential for construction projects.'
    },
    {
      id: 'gem',
      name: 'Gem',
      count: inventory.gems,
      icon: '💎',
      description: 'Precious gemstone. Worth 20 coins at the Commissary.'
    },
    {
      id: 'coal',
      name: 'Coal',
      count: inventory.coal,
      icon: '⬛',
      description: 'Combustible fuel. Worth 10 coins at the Commissary.'
    }
  ].filter(item => item.count > 0);

  const totalSlots = 15;
  const emptySlots = Math.max(0, totalSlots - items.length);

  const updateCursorPosition = (element: HTMLElement | null) => {
    if (element) {
      const rect = element.getBoundingClientRect();
      setCursorPosition({
        top: rect.top + rect.height / 2,
        left: rect.left - 20
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'e') {
        onClose();
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isCloseSelected) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCloseSelected, onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isCloseSelected) {
        updateCursorPosition(closeButtonRef.current);
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [isCloseSelected]);

  return (
    <div
      className="fixed inset-0 z-[150] flex justify-center bg-black/80 backdrop-blur-sm pt-0 pb-0 sm:pt-10 sm:pb-10"
    >
      {/* Cursor Pointer */}
      <div
        className="fixed z-[151] pointer-events-none transition-all duration-150"
        style={{
          top: `${cursorPosition.top}px`,
          left: `${cursorPosition.left}px`,
          transform: 'translateY(-50%)'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg text-slate-400">
          <path d="M5 3L19 12L5 21V3Z" fill="currentColor" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Main Modal - Matches Commissary/Construction format */}
      <div className="w-full max-w-2xl bg-slate-900 border-x-4 sm:border-4 border-slate-600 shadow-[0_0_50px_rgba(100,116,139,0.3)] sm:rounded-sm overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]">

        {/* Header with Safe Area Padding */}
        <div
          className="bg-slate-700 px-3 pb-3 flex items-center gap-3 shrink-0"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className={`text-white font-black px-2 py-1 text-xs transition-all border-2 border-slate-500 ${isCloseSelected ? 'bg-slate-800/50 ring-2 ring-slate-400' : 'hover:bg-slate-600'
              }`}
          >
            ← CLOSE
          </button>

          <div className="flex-1 text-right flex flex-col items-end">
            <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-none">Inventory</h2>
            <div className="flex items-center gap-1 bg-black/20 px-2 rounded-full mt-1">
              <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">LOGISTICS MANIFEST</span>
            </div>
          </div>
        </div>

        {/* Content Wrapper - Flex Row for Grid + Scroll Controls */}
        <div className="flex-1 relative overflow-hidden flex bg-black/20 p-2 gap-2">

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/40 border border-slate-700/50 shadow-inner rounded-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map(item => (
                <div key={item.id} className="group relative bg-slate-800/50 border-2 border-slate-700 hover:border-slate-500 hover:bg-slate-800 hover:z-50 transition-all p-3 flex flex-col items-center justify-center gap-2 aspect-square">
                  <div className="text-3xl drop-shadow-md grayscale group-hover:grayscale-0 transition-all duration-300">{item.icon}</div>
                  <div className="text-[9px] font-bold text-center uppercase text-slate-300 group-hover:text-white leading-tight">{item.name}</div>
                  <div className="absolute top-1 right-1 bg-slate-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-sm">
                    x{item.count}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 p-2 bg-black border border-slate-500 text-[8px] text-slate-300 rounded shadow-xl hidden group-hover:block z-[100] pointer-events-none">
                    {item.description}
                  </div>
                </div>
              ))}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-slate-900/30 border-2 border-dashed border-slate-800 aspect-square flex items-center justify-center opacity-50">
                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                </div>
              ))}
            </div>

            {/* Footer inside scroll area */}
            <div className="mt-4 text-center">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Storage Capacity: {Math.round((items.length / totalSlots) * 100)}%</p>
            </div>
          </div>

          {/* Visual Scroll Track (Static for consistency) */}
          <div className="w-12 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0 opacity-50 pointer-events-none">
            <div className="flex-1 flex items-center justify-center border-b border-slate-700">
              <span className="text-2xl font-black text-slate-600">▲</span>
            </div>
            <div className="h-4 bg-black/40 flex items-center justify-center">
              <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
            </div>
            <div className="flex-1 flex items-center justify-center border-t border-slate-700">
              <span className="text-2xl font-black text-slate-600">▼</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InventoryOverlay;
