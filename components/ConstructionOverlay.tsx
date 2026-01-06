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

// Helper to render text with bold "wishing well"
const renderTextWithBold = (text: string) => {
  const parts = text.split(/(wishing well)/i);
  return parts.map((part, i) =>
    part.toLowerCase() === 'wishing well' ? (
      <strong key={i} className="font-bold text-amber-400">{part}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

// Tutorial message display component with typing effect
const TutorialMessageDisplay: React.FC<{
  message: { text: string; buttonText: string };
  onAdvance: () => void;
}> = ({ message, onAdvance }) => {
  const { displayedText, isComplete, skip } = useTypingEffect(message.text, 2);

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
            {renderTextWithBold(displayedText)}
            {!isComplete && <span className="inline-block w-1 h-4 bg-amber-500 ml-1 animate-pulse">|</span>}
          </p>

          <div className={`flex justify-end mt-3 pt-2 border-t border-stone-700/50 transition-opacity duration-300 ${shouldShowButton ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={shouldShowButton ? onAdvance : undefined}
              className={`bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${shouldShowButton ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {message.buttonText}
              <span className="text-[10px] opacity-70">[E]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ConstructionOverlayProps {
  inventory: Inventory;
  onContribute: (buildingId: string, material: 'stone' | 'silver') => void;
  onClose: () => void;
  tutorialState?: TutorialState;
  onTutorialAdvance?: () => void;
}

interface BuildingRequirement {
  id: string;
  name: string;
  icon: string;
  desc: string;
  requirements: { stone: number; silver: number };
  built: boolean;
  progress: { stone: number; silver: number };
}

const ConstructionOverlay: React.FC<ConstructionOverlayProps> = ({
  inventory,
  onContribute,
  onClose,
  tutorialState,
  onTutorialAdvance,
}) => {
  const showTutorialMessage = tutorialState?.showingMessage && tutorialState?.currentMessage;
  const highlightCloseButton = tutorialState?.highlightCloseButton || false;

  const projects: BuildingRequirement[] = [
    {
      id: 'WISHING_WELL',
      name: 'Wishing Well',
      icon: '⛲',
      desc: 'Generates $1 every minute from tourists.',
      requirements: { stone: 10, silver: 4 },
      built: inventory.wishingWellBuilt,
      progress: inventory.wishingWellProgress
    },
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [selectedMaterial, setSelectedMaterial] = useState<'stone' | 'silver'>('stone');
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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
  }, [checkScroll]); // Removed projects dependency as it's a new array on every render

  const [selectedElement, setSelectedElement] = useState<'ITEM' | 'CLOSE'>('ITEM');

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
      if (showTutorialMessage) return; // Block navigation during tutorial
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectedElement === 'ITEM') {
          if (selectedIndex < projects.length - 1) {
            setSelectedIndex(prev => prev + 1);
          } else {
            setSelectedElement('CLOSE');
          }
        } else {
          setSelectedElement('ITEM');
          setSelectedIndex(0);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedElement === 'ITEM') {
          if (selectedIndex > 0) {
            setSelectedIndex(prev => prev - 1);
          } else {
            setSelectedElement('CLOSE');
          }
        } else {
          setSelectedElement('ITEM');
          setSelectedIndex(projects.length - 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (selectedElement === 'ITEM') {
          setSelectedMaterial(prev => prev === 'stone' ? 'silver' : 'stone');
        }
      } else if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (selectedElement === 'CLOSE') {
          if (highlightCloseButton && onTutorialAdvance) {
            onTutorialAdvance();
          }
          onClose();
        } else {
          const project = projects[selectedIndex];
          if (project && !project.built) {
            const canContribute = selectedMaterial === 'stone'
              ? (inventory.stone > 0 && project.progress.stone < project.requirements.stone)
              : (inventory.silverBlocks > 0 && project.progress.silver < project.requirements.silver);
            if (canContribute) {
              onContribute(project.id, selectedMaterial);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, selectedElement, selectedMaterial, inventory, projects, onContribute, onClose, showTutorialMessage, highlightCloseButton, onTutorialAdvance]);

  // Auto-select close button when tutorial highlights it
  useEffect(() => {
    if (highlightCloseButton) {
      setSelectedElement('CLOSE');
    }
  }, [highlightCloseButton]);

  useEffect(() => {
    if (showTutorialMessage) return; // Don't update cursor during tutorial
    const timer = setTimeout(() => {
      if (selectedElement === 'CLOSE') updateCursorPosition(closeButtonRef.current);
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
          <span className="text-orange-500 text-2xl font-black drop-shadow-lg">▶</span>
        </div>
      )}

      <div className="w-full max-w-2xl bg-stone-900 border-x-4 sm:border-4 border-orange-700 shadow-[0_0_50px_rgba(194,65,12,0.3)] sm:rounded-sm overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]">

        {/* Header with Safe Area Padding */}
        <div
          className="bg-orange-700 px-3 pb-3 flex items-center gap-3 shrink-0"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <button
            ref={closeButtonRef}
            onClick={() => {
              if (highlightCloseButton && onTutorialAdvance) {
                onTutorialAdvance();
              }
              onClose();
            }}
            className={`text-white font-black px-2 py-1 text-xs transition-all border-2 border-orange-900/50 ${selectedElement === 'CLOSE' ? 'bg-orange-900/50 ring-2 ring-white' : 'hover:bg-orange-800'
              }`}
          >
            ← CLOSE
          </button>

          <div className="flex-1 text-right flex flex-col items-end">
            <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-none">Construction Site</h2>
            <div className="flex items-center gap-1 bg-black/20 px-2 rounded-full mt-1">
              <span className="text-[9px] text-orange-200 font-bold uppercase tracking-widest">PROJECT MANAGER</span>
            </div>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 relative overflow-hidden flex bg-black/20 p-2 gap-2">

          {/* Scrollable Content Area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-black/40 border border-slate-700/50 shadow-inner rounded-sm"
          >
            {/* Materials Available Header - Stickyish */}
            <div className="flex gap-4 mb-4 bg-stone-800 p-2 border border-stone-600 rounded">
              <div className="flex-1 text-center">
                <div className="text-[10px] text-stone-500 uppercase font-bold">Stone Supply</div>
                <div className="text-lg font-black text-stone-200">🪨 {inventory.stone}</div>
              </div>
              <div className="flex-1 text-center border-l border-stone-600">
                <div className="text-[10px] text-stone-500 uppercase font-bold">Silver Supply</div>
                <div className="text-lg font-black text-stone-200">🥈 {inventory.silverBlocks}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pb-4">
              {projects.map((project, index) => {
                const stoneComplete = project.progress.stone >= project.requirements.stone;
                const silverComplete = project.progress.silver >= project.requirements.silver;
                const totalProgress = ((project.progress.stone + project.progress.silver) /
                  (project.requirements.stone + project.requirements.silver)) * 100;

                return (
                  <div
                    key={project.id}
                    ref={(el) => { itemRefs.current[index] = el; }}
                    className={`group relative bg-stone-800 p-3 border transition-all ${selectedIndex === index && selectedElement === 'ITEM'
                      ? 'border-orange-500 ring-2 ring-orange-500/50'
                      : 'border-stone-700 hover:border-orange-600'
                      }`}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-2xl shrink-0">{project.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white uppercase truncate">{project.name}</div>
                        <div className="text-[8px] text-stone-400 uppercase tracking-tight">{project.desc}</div>
                      </div>
                      {project.built && (
                        <span className="px-2 py-0.5 bg-green-600 text-white text-[9px] font-black uppercase rounded-full">ACTIVE</span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {!project.built && (
                      <>
                        <div className="h-2 bg-stone-900 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-300"
                            style={{ width: `${totalProgress}%` }}
                          />
                        </div>

                        {/* Material Requirements */}
                        <div className="flex gap-2">
                          {/* Stone */}
                          <button
                            onClick={() => {
                              if (inventory.stone > 0 && !stoneComplete) {
                                onContribute(project.id, 'stone');
                              }
                            }}
                            disabled={stoneComplete || inventory.stone === 0}
                            className={`flex-1 p-2 rounded transition-all border border-stone-700 ${selectedIndex === index && selectedElement === 'ITEM' && selectedMaterial === 'stone'
                              ? 'ring-2 ring-orange-400 bg-stone-700'
                              : 'bg-stone-900 group-hover:bg-stone-850'
                              } ${stoneComplete ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm">🪨</span>
                              <span className={`text-[10px] font-black ${stoneComplete ? 'text-green-400' : 'text-stone-400'}`}>
                                {project.progress.stone}/{project.requirements.stone}
                              </span>
                            </div>
                            <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${stoneComplete ? 'bg-green-500' : 'bg-stone-500'}`}
                                style={{ width: `${(project.progress.stone / project.requirements.stone) * 100}%` }}
                              />
                            </div>
                          </button>

                          {/* Silver */}
                          <button
                            onClick={() => {
                              if (inventory.silverBlocks > 0 && !silverComplete) {
                                onContribute(project.id, 'silver');
                              }
                            }}
                            disabled={silverComplete || inventory.silverBlocks === 0}
                            className={`flex-1 p-2 rounded transition-all border border-stone-700 ${selectedIndex === index && selectedElement === 'ITEM' && selectedMaterial === 'silver'
                              ? 'ring-2 ring-orange-400 bg-stone-700'
                              : 'bg-stone-900 group-hover:bg-stone-850'
                              } ${silverComplete ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm">🥈</span>
                              <span className={`text-[10px] font-black ${silverComplete ? 'text-green-400' : 'text-stone-400'}`}>
                                {project.progress.silver}/{project.requirements.silver}
                              </span>
                            </div>
                            <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${silverComplete ? 'bg-green-500' : 'bg-stone-500'}`}
                                style={{ width: `${(project.progress.silver / project.requirements.silver) * 100}%` }}
                              />
                            </div>
                          </button>
                        </div>

                        {!project.built && (inventory.stone > 0 || inventory.silverBlocks > 0) && selectedIndex === index && selectedElement === 'ITEM' && (
                          <div className="text-[8px] text-orange-400 mt-2 text-center uppercase animate-pulse">
                            ← Select → &nbsp;&nbsp;|&nbsp;&nbsp; ENTER to Add Material
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-2 border-t border-stone-700 text-center">
              <p className="text-[8px] text-stone-500 uppercase tracking-widest">More projects unlock as you descend</p>
            </div>
          </div>

          {/* Explicit Scroll Control Bar */}
          <div className="w-12 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0">
            <button
              onMouseDown={() => scrollBy(-100)}
              onClick={() => scrollBy(-100)}
              className={`flex-1 flex items-center justify-center text-orange-500 hover:bg-slate-700 transition-colors border-b border-slate-700 ${showScrollArrows.up ? 'opacity-100' : 'opacity-30'}`}
            >
              <span className="text-2xl font-black">▲</span>
            </button>

            <div className="h-4 bg-black/40 flex items-center justify-center">
              <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
            </div>

            <button
              onMouseDown={() => scrollBy(100)}
              onClick={() => scrollBy(100)}
              className={`flex-1 flex items-center justify-center text-orange-500 hover:bg-slate-700 transition-colors border-t border-slate-700 ${showScrollArrows.down ? 'opacity-100' : 'opacity-30'}`}
            >
              <span className="text-2xl font-black">▼</span>
            </button>
          </div>

        </div>
      </div>

      {/* Tutorial Message Display */}
      {showTutorialMessage && tutorialState?.currentMessage && (
        <TutorialMessageDisplay
          message={tutorialState.currentMessage}
          onAdvance={onTutorialAdvance || (() => { })}
        />
      )}
    </div>
  );
};

export default ConstructionOverlay;
