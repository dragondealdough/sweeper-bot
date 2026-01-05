
import React from 'react';
import { Inventory } from '../types';

interface ShopOverlayProps {
  coins: number;
  inventory: Inventory;
  onBuy: (item: 'CHARGE' | 'KIT' | 'ROPE', price: number) => void;
  onClose: () => void;
}

const ShopOverlay: React.FC<ShopOverlayProps> = ({ coins, onBuy, onClose }) => {
  const items = [
    { id: 'CHARGE', name: 'Disarm Charge', price: 5, icon: '🧨', desc: 'Allows disarming 1 flagged mine.' },
    { id: 'KIT', name: 'Repair Kit', price: 25, icon: '🩹', desc: 'Auto-repair scanner damage (Passive).' },
    { id: 'ROPE', name: 'Elevator Cable', price: 10, icon: '🪢', desc: 'Extends elevator depth by 5m (5 tiles).' },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border-4 border-amber-600 shadow-[0_0_50px_rgba(217,119,6,0.3)] rounded-sm overflow-hidden">
        <div className="bg-amber-600 p-4 flex justify-between items-center">
          <h2 className="text-xl font-black text-black uppercase tracking-tighter">Commissary Terminal</h2>
          <button onClick={onClose} className="text-black font-black hover:bg-black/10 px-2">X</button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center mb-6 bg-black/40 p-3 border border-slate-700">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Available Credits</span>
            <span className="text-xl font-black text-yellow-400">${coins}</span>
          </div>

          {items.map((item) => (
            <div key={item.id} className="group relative flex items-center gap-4 bg-slate-800 p-3 border border-slate-700 hover:border-amber-500 transition-all">
              <div className="text-3xl">{item.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white uppercase">{item.name}</div>
                <div className="text-[9px] text-slate-400 uppercase tracking-tight">{item.desc}</div>
              </div>
              <button 
                disabled={coins < item.price}
                onClick={() => onBuy(item.id as any, item.price)}
                className={`px-4 py-2 font-black text-xs uppercase transition-all ${coins >= item.price ? 'bg-amber-600 text-black hover:bg-amber-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              >
                ${item.price}
              </button>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-black/20 text-center">
          <p className="text-[8px] text-slate-500 uppercase">Authorized mining equipment only. No refunds.</p>
        </div>
      </div>
    </div>
  );
};

export default ShopOverlay;
