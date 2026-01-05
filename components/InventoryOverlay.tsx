
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
      id: 'disarm_kit',
      name: 'Disarming Kit',
      count: inventory.disarmCharges,
      icon: '🧨',
      description: 'Standard issue explosive ordinance disposal tools. Essential for neutralizing mines.'
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
      id: 'repair_kit',
      name: 'Repair Kit',
      count: inventory.disarmKits,
      icon: '🩹',
      description: 'Automated repair nanobots.'
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
      if (e.key.toLowerCase() === 'i') {
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
    // Small delay to ensure elements are rendered
    const timer = setTimeout(() => {
      if (isCloseSelected) {
        updateCursorPosition(closeButtonRef.current);
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [isCloseSelected]);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200 font-mono select-none"
      style={{ paddingTop: 'max(6rem, env(safe-area-inset-top))' }}
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
        <span className="text-amber-400 text-2xl font-black drop-shadow-lg">▶</span>
      </div>

      <div className="w-full max-w-4xl bg-slate-900 border-4 border-slate-600 shadow-2xl rounded-sm overflow-hidden flex flex-col h-[600px]">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-600 flex items-center gap-4">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className={`text-white font-black px-3 py-1 transition-all border-2 border-slate-500 ${isCloseSelected ? 'bg-slate-700/50 ring-2 ring-amber-400' : 'hover:text-amber-400'
              }`}
          >
            ← CLOSE
          </button>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center justify-end gap-3 flex-1 text-right">
            <span className="text-amber-500">Inventory</span>
            <span className="text-[10px] bg-slate-700 px-2 py-1 rounded text-slate-300">LOGISTICS MANIFEST</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="p-8 flex-1 bg-[#0a0a0a] overflow-y-auto">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map(item => (
              <div key={item.id} className="group relative bg-slate-800/50 border-2 border-slate-700 hover:border-amber-500 hover:bg-slate-800 hover:z-50 transition-all p-4 flex flex-col items-center justify-center gap-2 aspect-square">
                <div className="text-4xl drop-shadow-md grayscale group-hover:grayscale-0 transition-all duration-300">{item.icon}</div>
                <div className="text-[10px] font-bold text-center uppercase text-slate-300 group-hover:text-white leading-tight">{item.name}</div>
                <div className="absolute top-2 right-2 bg-amber-600 text-black font-black text-[10px] px-1.5 py-0.5 rounded shadow-sm">
                  x{item.count}
                </div>
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-black border border-slate-500 text-[9px] text-slate-300 rounded shadow-xl hidden group-hover:block z-[100] pointer-events-none">
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
        </div>

        {/* Footer */}
        <div className="bg-slate-800 p-2 border-t border-slate-600 text-center">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest">Storage Capacity: {Math.round((items.length / totalSlots) * 100)}%</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryOverlay;
