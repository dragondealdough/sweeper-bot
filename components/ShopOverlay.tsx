import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Inventory } from '../types';
import { TutorialState } from '../hooks/useTutorial';
import TutorialMessageDisplay from './TutorialMessageDisplay';

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

  // Scroll arrow visibility state
  const [showScrollArrows, setShowScrollArrows] = useState({ up: false, down: false });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll handler for buttons
  const scrollBy = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: amount, behavior: 'smooth' });
    }
  };

  // Check scroll position to toggle arrows
  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScrollArrows({
        up: scrollTop > 10,
        down: scrollTop < scrollHeight - clientHeight - 10
      });
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      // Initial check
      checkScroll();
      window.addEventListener('resize', checkScroll);
      // Trigger check after a short delay to ensure layout is complete
      const timer = setTimeout(checkScroll, 100);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timer);
      };
    }
  }, [checkScroll, currentItems, tab]);

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
      {/* Styles for custom scrollbar within this component scope */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px; /* Hide default scrollbar, we use buttons now */
        }
      `}</style>

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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg text-amber-400">
            <path d="M5 3L19 12L5 21V3Z" fill="currentColor" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Main Modal - Wider (max-w-2xl) for Grid Layout */}
      <div className="w-full max-w-2xl bg-slate-900 border-x-4 sm:border-4 border-amber-600 shadow-[0_0_50px_rgba(217,119,6,0.3)] sm:rounded-sm overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]">

        {/* Header with Safe Area Padding */}
        <div
          className="bg-amber-600 px-3 pb-3 flex items-center gap-3 shrink-0"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <button
            ref={closeButtonRef}
            onClick={() => {
              // During tutorial, only allow closing when the close button is highlighted (tutorial says to close)
              const isTutorialActive = tutorialState?.isActive && !tutorialState?.isComplete;
              const shopTutorialSteps = ['SHOP_INTRO_1', 'SHOP_INTRO_2', 'SHOP_INTRO_3', 'SHOP_PICKAXE_BOUGHT', 'SHOP_CLOSE_MENU_1', 'SHOP_CLOSE_MENU_2'];
              const inShopTutorial = isTutorialActive && tutorialState?.currentStep && shopTutorialSteps.includes(tutorialState.currentStep);

              if (inShopTutorial && !tutorialHighlightCloseButton) {
                // Don't allow closing yet - tutorial hasn't instructed to close
                return;
              }

              if (tutorialHighlightCloseButton && onTutorialAdvance) {
                onTutorialAdvance();
              }
              onClose();
            }}
            className={`text-black font-black px-2 py-1 text-xs transition-all border-2 border-black ${tutorialHighlightCloseButton
              ? 'bg-green-500 ring-4 ring-green-400/50 animate-pulse shadow-lg'
              : selectedElement === 'CLOSE'
                ? 'bg-black/20 ring-2 ring-black/50'
                : 'hover:bg-black/10'
              }`}
          >
            ← CLOSE
          </button>

          <div className="flex-1 text-right flex flex-col items-end">
            <h2 className="text-lg font-black text-black uppercase tracking-tighter leading-none">Commissary</h2>
            <div className="flex items-center gap-1 bg-black/20 px-2 rounded-full mt-1">
              <span className="text-[9px] text-black font-bold uppercase tracking-widest">CREDITS:</span>
              <span className="text-xs font-black text-white">${coins}</span>
            </div>
          </div>
        </div>

        {/* Tabs - Smaller & Fixed below header */}
        <div className="flex bg-slate-800 border-b border-slate-700 shrink-0">
          <button
            ref={buyTabRef}
            onClick={() => { setTab('BUY'); setSelectedElement('BUY_TAB'); }}
            className={`flex-1 py-2 font-black text-[10px] uppercase tracking-widest transition-all ${tab === 'BUY' ? 'bg-amber-600 text-black' : 'text-slate-400 hover:text-white'
              } ${selectedElement === 'BUY_TAB' ? 'ring-2 ring-inset ring-white' : ''}`}
          >
            BUY EQUIPMENT
          </button>
          <button
            ref={sellTabRef}
            onClick={() => { setTab('SELL'); setSelectedElement('SELL_TAB'); }}
            className={`flex-1 py-2 font-black text-[10px] uppercase tracking-widest transition-all ${tab === 'SELL' ? 'bg-amber-600 text-black' : 'text-slate-400 hover:text-white'
              } ${selectedElement === 'SELL_TAB' ? 'ring-2 ring-inset ring-white' : ''}`}
          >
            SELL MATERIALS
          </button>
        </div>

        {/* Content Wrapper - Flex Row for List + Scroll Controls */}
        <div className="flex-1 relative overflow-hidden flex bg-black/20 p-2 gap-2">

          {/* Scrollable Content Area - Recessed Screen Look */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-black/40 border border-slate-700/50 shadow-inner rounded-sm"
          >
            <div className="grid grid-cols-2 gap-3 pb-8"> {/* Extra padding for bottom visibility */}
              {currentItems.map((item, index) => {
                const isPickaxe = item.id === 'PICKAXE';
                const shouldHighlight = tutorialHighlightPickaxe && isPickaxe;

                return (
                  <div
                    key={item.id}
                    ref={(el) => { itemRefs.current[index] = el; }}
                    className={`group relative flex flex-col gap-2 bg-slate-800 p-3 border transition-all h-full ${shouldHighlight
                      ? 'border-green-400 ring-4 ring-green-400/50 animate-pulse bg-green-900/30'
                      : selectedIndex === index && selectedElement === 'ITEM'
                        ? 'border-amber-400 ring-2 ring-amber-400/50'
                        : 'border-slate-700 hover:border-amber-500'
                      }`}
                  >
                    {/* Free badge for pickaxe */}
                    {isPickaxe && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg z-10">
                        FREE!
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="text-2xl shrink-0">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white uppercase truncate leading-tight">{item.name}</div>
                        {tab === 'SELL' ? (
                          <div className="text-[8px] text-amber-500 uppercase tracking-tight">Owned: {(item as any).count}</div>
                        ) : (
                          <div className={`text-[8px] uppercase tracking-tight leading-tight line-clamp-2 ${isPickaxe ? 'text-green-400' : 'text-slate-400'}`}>
                            {(item as any).desc}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      disabled={tab === 'BUY' ? coins < item.price : (item as any).count <= 0}
                      onClick={() => tab === 'BUY' ? onBuy(item.id as any, item.price) : onSell(item.id as any, item.price)}
                      className={`w-full py-1.5 font-black text-[10px] uppercase transition-all flex items-center justify-center gap-1 mt-auto ${isPickaxe
                        ? 'bg-green-500 text-black hover:bg-green-400 shadow-lg'
                        : (tab === 'BUY' ? coins >= item.price : (item as any).count > 0)
                          ? 'bg-amber-600 text-black hover:bg-amber-500'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                      {isPickaxe ? (
                        <>
                          TAKE IT
                          <span className="opacity-70">[E]</span>
                        </>
                      ) : (
                        `$${item.price}`
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explicit Scroll Control Bar */}
          <div className="w-12 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0">
            <button
              onMouseDown={() => scrollBy(-100)} // Repeat on hold could be added, simplified for now
              onClick={() => scrollBy(-100)}
              className={`flex-1 flex items-center justify-center text-amber-500 hover:bg-slate-700 transition-colors border-b border-slate-700 ${showScrollArrows.up ? 'opacity-100' : 'opacity-30'}`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5L5 15H19L12 5Z" fill="currentColor" />
              </svg>
            </button>

            {/* Visual Track graphic */}
            <div className="h-4 bg-black/40 flex items-center justify-center">
              <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
            </div>

            <button
              onMouseDown={() => scrollBy(100)}
              onClick={() => scrollBy(100)}
              className={`flex-1 flex items-center justify-center text-amber-500 hover:bg-slate-700 transition-colors border-t border-slate-700 ${showScrollArrows.down ? 'opacity-100' : 'opacity-30'}`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 19L19 9H5L12 19Z" fill="currentColor" />
              </svg>
            </button>
          </div>

        </div>

        {/* Tutorial Dimming Overlay - darkens the shop interface when a tutorial message is active */}
        {showTutorialMessage && (
          <div className="absolute inset-0 bg-black/70 z-[40] pointer-events-none animate-in fade-in duration-500 backdrop-blur-[1px]" />
        )}

      </div>

      {/* Tutorial Message Overlay - center-bottom */}
      {showTutorialMessage && tutorialState?.currentMessage && (
        <TutorialMessageDisplay
          message={tutorialState.currentMessage}
          onAdvance={onTutorialAdvance || (() => { })}
        />
      )}
    </div>
  );
};

export default ShopOverlay;
