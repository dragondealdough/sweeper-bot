
import React, { useState } from 'react';
import { Inventory } from '../types';

interface RecyclingOverlayProps {
  inventory: Inventory;
  onRecycle: (quantity: number) => void;
  onClose: () => void;
}

const RecyclingOverlay: React.FC<RecyclingOverlayProps> = ({ inventory, onRecycle, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const max = inventory.defusedMines;
  const canRecycle = max > 0;

  const handleRecycle = () => {
    if (quantity > 0 && quantity <= max) {
        onRecycle(quantity);
        setQuantity(1); // Reset to 1 after queueing
    }
  };

  const adjustQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(max, prev + delta)));
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in font-mono">
      <div className="w-full max-w-md bg-stone-900 border-4 border-lime-600 shadow-[0_0_50px_rgba(101,163,13,0.3)] rounded-sm overflow-hidden">
        <div className="bg-lime-900/80 p-4 flex justify-between items-center border-b border-lime-700">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <span>♻️</span> Material Processing
          </h2>
          <button onClick={onClose} className="text-white hover:text-lime-400 font-black px-2">X</button>
        </div>
        
        <div className="p-8 flex flex-col items-center gap-8 bg-[radial-gradient(circle_at_center,rgba(60,60,60,0.5),rgba(20,20,20,0.8))]">
          
          <div className="flex items-center gap-4 w-full justify-center">
            <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 bg-slate-800 border-2 border-red-500/50 rounded flex items-center justify-center text-4xl shadow-inner relative">
                    💣
                    <div className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-white">
                        {inventory.defusedMines}
                    </div>
                </div>
                <span className="text-[10px] uppercase text-slate-400 font-bold">Defused Mine</span>
            </div>

            <div className="flex flex-col items-center text-lime-500 animate-pulse">
                <span className="text-2xl font-black">→</span>
                <span className="text-[8px] uppercase font-bold">QUEUE JOB</span>
            </div>

            <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 bg-slate-800 border-2 border-slate-500 rounded flex items-center justify-center text-4xl shadow-inner relative">
                    ⚙️
                    <div className="absolute -top-3 -right-3 bg-lime-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-white">
                        {inventory.scrapMetal}
                    </div>
                </div>
                <span className="text-[10px] uppercase text-slate-400 font-bold">Scrap Metal</span>
            </div>
          </div>

          <div className="w-full bg-black/40 p-4 border border-slate-700 text-center">
            <p className="text-xs text-slate-300 mb-1">Exchange Rate</p>
            <p className="text-sm font-bold text-white uppercase">1 DEFUSED MINE = 1 SCRAP METAL (20s)</p>
          </div>

          <div className="flex items-center gap-2 w-full">
             <button 
                onClick={() => adjustQuantity(-1)}
                disabled={quantity <= 1}
                className="w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-black"
             >-</button>
             <div className="flex-1 bg-slate-900 border border-slate-700 h-10 flex items-center justify-center font-bold text-lime-400">
                {quantity}
             </div>
             <button 
                onClick={() => adjustQuantity(1)}
                disabled={quantity >= max}
                className="w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-black"
             >+</button>
             <button
                onClick={() => setQuantity(max)}
                disabled={max === 0}
                className="px-3 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold text-xs uppercase"
             >MAX</button>
          </div>

          <button 
            onClick={handleRecycle}
            disabled={!canRecycle}
            className={`w-full py-4 font-black text-sm uppercase tracking-widest transition-all clip-path-slant ${canRecycle ? 'bg-lime-600 hover:bg-lime-500 text-white shadow-[0_0_20px_rgba(101,163,13,0.4)] hover:scale-[1.02]' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
          >
            {canRecycle ? `Queue ${quantity} Unit${quantity > 1 ? 's' : ''}` : 'Insufficient Resources'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecyclingOverlay;
