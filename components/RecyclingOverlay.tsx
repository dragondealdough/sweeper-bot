
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Inventory } from '../types';

interface RecyclingOverlayProps {
  inventory: Inventory;
  onRecycle: (quantity: number) => void;
  onClose: () => void;
  onOpen?: () => void;
}

const RecyclingOverlay: React.FC<RecyclingOverlayProps> = ({ inventory, onRecycle, onClose, onOpen }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedButton, setSelectedButton] = useState<'decrease' | 'increase' | 'max' | 'recycle' | 'close'>('recycle');
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const max = inventory.defusedMines;
  const canRecycle = max > 0;

  // Call onOpen when component mounts
  useEffect(() => {
    onOpen?.();
  }, [onOpen]);

  const decreaseRef = useRef<HTMLButtonElement>(null);
  const increaseRef = useRef<HTMLButtonElement>(null);
  const maxRef = useRef<HTMLButtonElement>(null);
  const recycleRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const updateCursorPosition = (element: HTMLElement | null) => {
    if (element) {
      const rect = element.getBoundingClientRect();
      setCursorPosition({
        top: rect.top + rect.height / 2,
        left: rect.left - 20
      });
    }
  };

  const adjustQuantity = useCallback((delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(max, prev + delta)));
  }, [max]);

  const handleRecycle = useCallback(() => {
    if (quantity > 0 && quantity <= max) {
      onRecycle(quantity);
      setQuantity(1); // Reset to 1 after queueing
    }
  }, [quantity, max, onRecycle]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        // Cycle through buttons horizontally
        const buttons: Array<'decrease' | 'increase' | 'max' | 'recycle' | 'close'> = ['decrease', 'increase', 'max', 'recycle', 'close'];
        const currentIndex = buttons.indexOf(selectedButton);
        if (e.key === 'ArrowLeft') {
          const newIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
          setSelectedButton(buttons[newIndex]);
        } else {
          const newIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
          setSelectedButton(buttons[newIndex]);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        // Adjust quantity with arrow keys when on quantity buttons, or move to/from close button
        if (selectedButton === 'close') {
          setSelectedButton('recycle');
        } else if (selectedButton === 'recycle') {
          setSelectedButton('close');
        } else {
          // Adjust quantity
          if (e.key === 'ArrowUp') {
            adjustQuantity(1);
          } else {
            adjustQuantity(-1);
          }
        }
      } else if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (selectedButton === 'close') {
          onClose();
        } else if (selectedButton === 'decrease' && quantity > 1) {
          adjustQuantity(-1);
        } else if (selectedButton === 'increase' && quantity < max) {
          adjustQuantity(1);
        } else if (selectedButton === 'max' && max > 0) {
          setQuantity(max);
        } else if (selectedButton === 'recycle' && canRecycle) {
          handleRecycle();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedButton, quantity, max, canRecycle, onClose, adjustQuantity, handleRecycle]);

  useEffect(() => {
    // Small delay to ensure elements are rendered
    const timer = setTimeout(() => {
      if (selectedButton === 'decrease') updateCursorPosition(decreaseRef.current);
      else if (selectedButton === 'increase') updateCursorPosition(increaseRef.current);
      else if (selectedButton === 'max') updateCursorPosition(maxRef.current);
      else if (selectedButton === 'recycle') updateCursorPosition(recycleRef.current);
      else if (selectedButton === 'close') updateCursorPosition(closeButtonRef.current);
    }, 10);
    return () => clearTimeout(timer);
  }, [selectedButton]);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in font-mono"
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
        <span className="text-lime-400 text-2xl font-black drop-shadow-lg">▶</span>
      </div>

      <div className="w-full max-w-md bg-stone-900 border-4 border-lime-600 shadow-[0_0_50px_rgba(101,163,13,0.3)] rounded-sm overflow-hidden">
        <div className="bg-lime-900/80 p-4 flex items-center gap-4 border-b border-lime-700">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className={`text-white font-black px-3 py-1 transition-all border-2 border-white/30 ${selectedButton === 'close' ? 'bg-lime-700/50 ring-2 ring-lime-400' : 'hover:text-lime-400'
              }`}
          >
            ← CLOSE
          </button>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter flex-1 text-right flex items-center justify-end gap-2">
            <span>♻️</span> Material Processing
          </h2>
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
            <p className="text-[8px] text-lime-500 mt-2 animate-pulse uppercase">Note: Manual collection required at plant output</p>
          </div>

          <div className="flex items-center gap-2 w-full">
            <button
              ref={decreaseRef}
              onClick={() => adjustQuantity(-1)}
              disabled={quantity <= 1}
              className={`w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-black transition-all ${selectedButton === 'decrease' ? 'ring-2 ring-lime-400' : ''
                }`}
            >-</button>
            <div className="flex-1 bg-slate-900 border border-slate-700 h-10 flex items-center justify-center font-bold text-lime-400">
              {quantity}
            </div>
            <button
              ref={increaseRef}
              onClick={() => adjustQuantity(1)}
              disabled={quantity >= max}
              className={`w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-black transition-all ${selectedButton === 'increase' ? 'ring-2 ring-lime-400' : ''
                }`}
            >+</button>
            <button
              ref={maxRef}
              onClick={() => setQuantity(max)}
              disabled={max === 0}
              className={`px-3 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold text-xs uppercase transition-all ${selectedButton === 'max' ? 'ring-2 ring-lime-400' : ''
                }`}
            >MAX</button>
          </div>

          <button
            ref={recycleRef}
            onClick={handleRecycle}
            disabled={!canRecycle}
            className={`w-full py-4 font-black text-sm uppercase tracking-widest transition-all clip-path-slant ${selectedButton === 'recycle' ? 'ring-2 ring-lime-400' : ''
              } ${canRecycle ? 'bg-lime-600 hover:bg-lime-500 text-white shadow-[0_0_20px_rgba(101,163,13,0.4)] hover:scale-[1.02]' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
          >
            {canRecycle ? `Queue ${quantity} Unit${quantity > 1 ? 's' : ''}` : 'Insufficient Resources'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecyclingOverlay;
