import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Inventory } from '../types';
import { TutorialState } from '../hooks/useTutorial';

// Typing effect hook
const useTypingEffect = (text: string, speed: number = 30) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const skip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayedText(text);
    setIsComplete(true);
  }, [text]);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsComplete(false);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);
    let currentIndex = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // For very fast speeds, type multiple characters per interval
    const charsPerInterval = speed <= 1 ? 2 : 1;

    intervalRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        const nextIndex = Math.min(currentIndex + charsPerInterval, text.length);
        setDisplayedText(text.slice(0, nextIndex));
        currentIndex = nextIndex;
        if (currentIndex >= text.length) {
          setIsComplete(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } else {
        setIsComplete(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, speed]);

  return { displayedText, isComplete, skip };
};

// Tutorial message display component with typing effect
const TutorialMessageDisplay: React.FC<{
  message: { text: string; buttonText: string };
  onAdvance: () => void;
}> = ({ message, onAdvance }) => {
  const { displayedText, isComplete, skip } = useTypingEffect(message.text, 1);

  // Only show button when typing is complete AND we've displayed the full current message
  const shouldShowButton = isComplete && displayedText === message.text;

  // Handle E key: skip typing animation if in progress, otherwise advance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isComplete) {
          // Skip the typing animation
          skip();
        } else {
          // Already complete, advance to next message
          onAdvance();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComplete, skip, onAdvance]);

  return (
    <div className="fixed inset-x-0 bottom-8 z-[160] flex justify-center pointer-events-none px-4">
      <div className="pointer-events-auto max-w-lg w-full">
        <div className="relative bg-stone-900/95 border-2 border-amber-500 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.2)] p-4">
          <div className="absolute -top-2.5 left-4 bg-amber-500 px-2 py-0.5 rounded-full">
            <span className="text-[10px] font-black text-black uppercase tracking-wider">📖 Guide</span>
          </div>

          <p className="text-sm text-white font-medium leading-relaxed mt-1 min-h-[3rem]">
            {displayedText}
            {!isComplete && <span className="inline-block w-1 h-4 bg-amber-500 ml-1 animate-pulse">|</span>}
          </p>

          {shouldShowButton && (
            <div className="flex justify-end mt-3 pt-2 border-t border-stone-700/50 animate-in fade-in duration-300">
              <button
                onClick={onAdvance}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-1.5 rounded text-xs transition-colors flex items-center gap-2"
              >
                {message.buttonText}
                <span className="text-[10px] opacity-70">[E]</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ShopOverlayProps {
  coins: number;
  inventory: Inventory;
  onBuy: (item: 'CHARGE' | 'KIT' | 'ROPE' | 'PICKAXE', price: number) => void;
  onSell: (item: 'SCRAP' | 'GEM' | 'COAL', price: number) => void;
  onClose: () => void;
  tutorialHighlightPickaxe?: boolean;
  tutorialHighlightCloseButton?: boolean;
  showFreePickaxe?: boolean;
  tutorialState?: TutorialState;
  onTutorialAdvance?: () => void;
}

const ShopOverlay: React.FC<ShopOverlayProps> = ({
  coins,
  inventory,
  onBuy,
  onSell,
  onClose,
  tutorialHighlightPickaxe = false,
  tutorialHighlightCloseButton = false,
  showFreePickaxe = false,
  tutorialState,
  onTutorialAdvance,
}) => {
  const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const buyTabRef = useRef<HTMLButtonElement>(null);
  const sellTabRef = useRef<HTMLButtonElement>(null);
  const [selectedElement, setSelectedElement] = useState<'ITEM' | 'CLOSE' | 'BUY_TAB' | 'SELL_TAB'>('ITEM');

  // Check if we should show tutorial messages - just check if there's a message to show
  const showTutorialMessage = tutorialState?.showingMessage && tutorialState?.currentMessage;

  const buyItems = [
    // Free pickaxe for tutorial
    ...(showFreePickaxe ? [{ id: 'PICKAXE', name: 'Mining Pickaxe', price: 0, icon: '⛏️', desc: 'FREE! Essential mining tool.', isFree: true }] : []),
    { id: 'CHARGE', name: 'Disarm Charge', price: 5, icon: '🧨', desc: '+1 charge to current kit.' },
    { id: 'KIT', name: 'Disarm Kit', price: 25, icon: '🧰', desc: 'Spare kit with 3 charges. Auto-equips when empty.' },
    { id: 'ROPE', name: 'Elevator Cable', price: 10, icon: '🪢', desc: 'Extends elevator depth by 5m (5 tiles).' },
  ];

  const sellItems = [
    { id: 'SCRAP', name: 'Scrap Metal', price: 5, icon: '⚙️', count: inventory.scrapMetal },
    { id: 'GEM', name: 'Gemstone', price: 20, icon: '💎', count: inventory.gems },
    { id: 'COAL', name: 'Coal Chunk', price: 10, icon: '⬛', count: inventory.coal },
  ];

  const currentItems = tab === 'BUY' ? buyItems : sellItems;

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
      // If showing tutorial message, only allow advancing with E/Enter/Space - block everything else
      if (showTutorialMessage) {
        if (e.key.toLowerCase() === 'e' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onTutorialAdvance?.();
        } else {
          // Block all other keys during tutorial
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectedElement === 'BUY_TAB' || selectedElement === 'SELL_TAB') {
          setSelectedElement('ITEM');
          setSelectedIndex(0);
        } else if (selectedElement === 'ITEM') {
          if (selectedIndex < currentItems.length - 1) {
            setSelectedIndex(prev => prev + 1);
          } else {
            setSelectedElement('CLOSE');
          }
        } else if (selectedElement === 'CLOSE') {
          setSelectedElement('BUY_TAB');
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedElement === 'BUY_TAB' || selectedElement === 'SELL_TAB') {
          setSelectedElement('CLOSE');
        } else if (selectedElement === 'ITEM') {
          if (selectedIndex > 0) {
            setSelectedIndex(prev => prev - 1);
          } else {
            setSelectedElement(tab === 'BUY' ? 'BUY_TAB' : 'SELL_TAB');
          }
        } else if (selectedElement === 'CLOSE') {
          setSelectedElement('ITEM');
          setSelectedIndex(currentItems.length - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (selectedElement === 'BUY_TAB') {
          setSelectedElement('SELL_TAB');
          setTab('SELL');
          setSelectedIndex(0);
        }
      } else if (e.key === 'ArrowLeft') {
        if (selectedElement === 'SELL_TAB') {
          setSelectedElement('BUY_TAB');
          setTab('BUY');
          setSelectedIndex(0);
        }
      } else if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (selectedElement === 'CLOSE') {
          if (tutorialHighlightCloseButton && onTutorialAdvance) {
            onTutorialAdvance();
          }
          onClose();
        } else if (selectedElement === 'BUY_TAB') {
          setTab('BUY');
        } else if (selectedElement === 'SELL_TAB') {
          setTab('SELL');
        } else if (selectedElement === 'ITEM') {
          const item = currentItems[selectedIndex];
          if (tab === 'BUY') {
            if (item && coins >= (item as any).price) {
              onBuy(item.id as any, (item as any).price);
            }
          } else {
            if (item && (item as any).count > 0) {
              onSell(item.id as any, (item as any).price);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, selectedElement, tab, coins, currentItems, onBuy, onSell, onClose, showTutorialMessage, onTutorialAdvance, tutorialHighlightCloseButton]);

  // Auto-select close button when tutorial highlights it
  useEffect(() => {
    if (tutorialHighlightCloseButton) {
      setSelectedElement('CLOSE');
    }
  }, [tutorialHighlightCloseButton]);

  useEffect(() => {
    // Don't update cursor position when tutorial messages are showing
    if (showTutorialMessage) return;

    const timer = setTimeout(() => {
      if (selectedElement === 'CLOSE') updateCursorPosition(closeButtonRef.current);
      else if (selectedElement === 'BUY_TAB') updateCursorPosition(buyTabRef.current);
      else if (selectedElement === 'SELL_TAB') updateCursorPosition(sellTabRef.current);
      else updateCursorPosition(itemRefs.current[selectedIndex]);
    }, 10);
    return () => clearTimeout(timer);
  }, [selectedIndex, selectedElement, showTutorialMessage]);

  return (
    <div
      className="fixed inset-0 z-[150] flex justify-center bg-black/80 backdrop-blur-sm pt-0 pb-0 sm:pt-10 sm:pb-10"
    >
      {/* Cursor Pointer */}
      {!showTutorialMessage && (
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
      )}

      {/* Main Modal - Full Height on Mobile, Centered on Desktop */}
      <div className="w-full max-w-md bg-slate-900 border-x-4 sm:border-4 border-amber-600 shadow-[0_0_50px_rgba(217,119,6,0.3)] sm:rounded-sm overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]">

        {/* Header with Safe Area Padding */}
        <div
          className="bg-amber-600 px-4 pb-4 flex items-center gap-4 shrink-0"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <button
            ref={closeButtonRef}
            onClick={() => {
              if (tutorialHighlightCloseButton && onTutorialAdvance) {
                onTutorialAdvance();
              }
              onClose();
            }}
            className={`text-black font-black px-3 py-1 transition-all border-2 border-black ${tutorialHighlightCloseButton
              ? 'bg-green-500 ring-4 ring-green-400/50 animate-pulse shadow-lg'
              : selectedElement === 'CLOSE'
                ? 'bg-black/20 ring-2 ring-black/50'
                : 'hover:bg-black/10'
              }`}
          >
            ← CLOSE
          </button>
          <h2 className="text-xl font-black text-black uppercase tracking-tighter flex-1 text-right">Commissary Terminal</h2>
        </div>

        {/* Tabs - Fixed below header */}
        <div className="flex bg-slate-800 border-b border-slate-700 shrink-0">
          <button
            ref={buyTabRef}
            onClick={() => { setTab('BUY'); setSelectedElement('BUY_TAB'); }}
            className={`flex-1 py-3 font-black text-xs uppercase tracking-widest transition-all ${tab === 'BUY' ? 'bg-amber-600 text-black' : 'text-slate-400 hover:text-white'
              } ${selectedElement === 'BUY_TAB' ? 'ring-2 ring-inset ring-white' : ''}`}
          >
            BUY EQUIPMENT
          </button>
          <button
            ref={sellTabRef}
            onClick={() => { setTab('SELL'); setSelectedElement('SELL_TAB'); }}
            className={`flex-1 py-3 font-black text-xs uppercase tracking-widest transition-all ${tab === 'SELL' ? 'bg-amber-600 text-black' : 'text-slate-400 hover:text-white'
              } ${selectedElement === 'SELL_TAB' ? 'ring-2 ring-inset ring-white' : ''}`}
          >
            SELL MATERIALS
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-between items-center mb-6 bg-black/40 p-3 border border-slate-700 sticky top-0 backdrop-blur-md z-10">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Available Credits</span>
            <span className="text-xl font-black text-yellow-400">${coins}</span>
          </div>

          {currentItems.map((item, index) => {
            const isPickaxe = item.id === 'PICKAXE';
            const shouldHighlight = tutorialHighlightPickaxe && isPickaxe;

            return (
              <div
                key={item.id}
                ref={(el) => { itemRefs.current[index] = el; }}
                className={`group relative flex items-center gap-4 bg-slate-800 p-3 border transition-all ${shouldHighlight
                  ? 'border-green-400 ring-4 ring-green-400/50 animate-pulse bg-green-900/30'
                  : selectedIndex === index && selectedElement === 'ITEM'
                    ? 'border-amber-400 ring-2 ring-amber-400/50'
                    : 'border-slate-700 hover:border-amber-500'
                  }`}
              >
                {/* Free badge for pickaxe */}
                {isPickaxe && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                    FREE!
                  </div>
                )}

                <div className="text-3xl">{item.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white uppercase">{item.name}</div>
                  {tab === 'SELL' ? (
                    <div className="text-[9px] text-amber-500 uppercase tracking-tight">Owned: {(item as any).count}</div>
                  ) : (
                    <div className={`text-[9px] uppercase tracking-tight ${isPickaxe ? 'text-green-400' : 'text-slate-400'}`}>
                      {(item as any).desc}
                    </div>
                  )}
                </div>
                <button
                  disabled={tab === 'BUY' ? coins < item.price : (item as any).count <= 0}
                  onClick={() => tab === 'BUY' ? onBuy(item.id as any, item.price) : onSell(item.id as any, item.price)}
                  className={`px-4 py-2 font-black text-xs uppercase transition-all flex items-center gap-2 ${isPickaxe
                    ? 'bg-green-500 text-black hover:bg-green-400 shadow-lg'
                    : (tab === 'BUY' ? coins >= item.price : (item as any).count > 0)
                      ? 'bg-amber-600 text-black hover:bg-amber-500'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                >
                  {isPickaxe ? (
                    <>
                      TAKE
                      <span className="text-[10px] opacity-70">[E]</span>
                    </>
                  ) : (
                    `$${item.price}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-black/20 text-center shrink-0">
          <p className="text-[8px] text-slate-500 uppercase">Authorized mining equipment only. No refunds.</p>
        </div>
      </div>

      {/* Tutorial Message Overlay - center-bottom */}
      {showTutorialMessage && tutorialState?.currentMessage && (
        <TutorialMessageDisplay
          message={tutorialState.currentMessage}
          onAdvance={onTutorialAdvance}
        />
      )}
    </div>
  );
};

export default ShopOverlay;
