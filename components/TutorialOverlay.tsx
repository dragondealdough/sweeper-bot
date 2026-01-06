import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { TutorialState } from '../hooks/useTutorial';
import { GRID_CONFIG } from '../constants';

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

// Helper to render text with bold phrases
const renderTextWithBold = (text: string, isMobile: boolean) => {
  // Mobile text substitutions
  let processedText = text;
  if (isMobile) {
    processedText = processedText
      .replace(/flag it with Z/i, 'flag it with the Red Flag Button')
      .replace(/disarm the flagged explosive with spacebar/i, 'disarm the flagged explosive with the Blue Pickaxe Button')
      .replace(/press spacebar/i, 'press the Blue Pickaxe Button')
      .replace(/press E/i, 'press the Green Hand Button')
      .replace(/arrow keys/i, 'the Virtual Joystick')
      .replace(/\[(\w+)\]/g, '$1'); // Remove brackets from keys like [E]
  }

  // First check for exhaustion warning (longer phrase first)
  const exhaustionPattern = /(when you are on the brink of exhaustion, you will lose half of all your resources and gold!)/i;
  const exhaustionMatch = processedText.match(exhaustionPattern);
  if (exhaustionMatch) {
    const before = processedText.substring(0, exhaustionMatch.index);
    const match = exhaustionMatch[0];
    const after = processedText.substring((exhaustionMatch.index || 0) + match.length);
    return (
      <>
        {before}
        <strong className="font-bold text-red-400">{match}</strong>
        {after}
      </>
    );
  }

  // Check for "mark the block with Z, then break it open"
  const markPattern = /(mark the block with Z, then break it open|mark the block with the Red Flag Button, then break it open)/i;
  const markMatch = processedText.match(markPattern);
  if (markMatch) {
    const before = processedText.substring(0, markMatch.index);
    const match = markMatch[0];
    const after = processedText.substring((markMatch.index || 0) + match.length);
    return (
      <>
        {before}
        <strong className="font-bold text-amber-400">{match}</strong>
        {after}
      </>
    );
  }

  // Check for "flag it with Z" (Red highlight)
  const flagPattern = /(flag it with Z|flag it with the Red Flag Button)/i;
  const flagMatch = processedText.match(flagPattern);
  if (flagMatch) {
    const before = processedText.substring(0, flagMatch.index);
    const match = flagMatch[0];
    const after = processedText.substring((flagMatch.index || 0) + match.length);
    return (
      <>
        {before}
        <strong className="font-bold text-red-500">{match}</strong>
        {after}
      </>
    );
  }

  // Check for "disarm the flagged explosive with spacebar" (Red highlight)
  const disarmPattern = /(disarm the flagged explosive with spacebar|disarm the flagged explosive with the Blue Pickaxe Button)/i;
  const disarmMatch = processedText.match(disarmPattern);
  if (disarmMatch) {
    const before = processedText.substring(0, disarmMatch.index);
    const match = disarmMatch[0];
    const after = processedText.substring((disarmMatch.index || 0) + match.length);
    return (
      <>
        {before}
        <strong className="font-bold text-red-500">{match}</strong>
        {after}
      </>
    );
  }

  // Check for "disarm kit charges"
  const chargesPattern = /(disarm kit charges)/i;
  const chargesMatch = processedText.match(chargesPattern);
  if (chargesMatch) {
    const before = processedText.substring(0, chargesMatch.index);
    const match = chargesMatch[0];
    const after = processedText.substring((chargesMatch.index || 0) + match.length);
    return (
      <>
        {before}
        <strong className="font-bold text-amber-400">{match}</strong>
        {after}
      </>
    );
  }

  // Handle "wishing well"
  // Also highlight generic mobile terms if found
  const parts = processedText.split(/(wishing well|Blue Pickaxe Button|Red Flag Button|Green Button|D-Pad)/i);
  return parts.map((part, i) => {
    const lower = part.toLowerCase();
    if (lower === 'wishing well' ||
      lower === 'blue pickaxe button' ||
      lower === 'red flag button' ||
      lower === 'green hand button' ||
      lower === 'virtual joystick' ||
      lower === 'd-pad') {
      return <strong key={i} className="font-bold text-amber-400">{part}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

interface TutorialOverlayProps {
  tutorialState: TutorialState;
  onDismiss: () => void;
  onSkip: () => void;
  onDismissHint?: () => void;
  onToggleTaskMinimized?: () => void;
  onSelectChoice?: (choice: 'ROADS' | 'ATTRACTIONS' | 'ROBOTS') => void;
  SHOP_X: number;
  CONSTRUCTION_X: number;
  ROPE_X: number;
  RECYCLER_X: number;
  playerX: number;
  camera: { x: number; y: number };
  scale: number;
  isShopOpen?: boolean;
  isConstructionOpen?: boolean;
  isRecyclerOpen?: boolean;
  isInventoryOpen?: boolean;
  isMobile?: boolean; // New prop for mobile text substitution
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  tutorialState,
  onDismiss,
  onSkip,
  onDismissHint,
  onToggleTaskMinimized,
  onSelectChoice,
  SHOP_X,
  CONSTRUCTION_X,
  ROPE_X,
  RECYCLER_X,
  playerX,
  camera,
  scale,
  isShopOpen = false,
  isConstructionOpen = false,
  isRecyclerOpen = false,
  isInventoryOpen = false,
  isMobile = false,
}) => {
  // Hide arrows when any menu is open
  const isAnyMenuOpen = isShopOpen || isConstructionOpen || isRecyclerOpen || isInventoryOpen;
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0);
  const choiceOptions = useMemo<Array<'ROADS' | 'ATTRACTIONS' | 'ROBOTS'>>(() => ['ROADS', 'ATTRACTIONS', 'ROBOTS'], []);

  // Keyboard navigation for choices
  useEffect(() => {
    if (!tutorialState.showingChoice) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedChoiceIndex(prev => (prev > 0 ? prev - 1 : choiceOptions.length - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedChoiceIndex(prev => (prev < choiceOptions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        onSelectChoice?.(choiceOptions[selectedChoiceIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tutorialState.showingChoice, selectedChoiceIndex, onSelectChoice, choiceOptions]);

  // Reset choice selection when choice dialog appears
  useEffect(() => {
    if (tutorialState.showingChoice) {
      setSelectedChoiceIndex(0);
    }
  }, [tutorialState.showingChoice]);

  // Only hide overlay if tutorial is completely inactive and there's nothing to show
  // IMPORTANT: Never hide when tutorial is active, even if nothing is currently visible
  const hasArrows = tutorialState.showArrowToShop ||
    tutorialState.showArrowToConstruction ||
    tutorialState.showArrowToMine ||
    tutorialState.showArrowToTimer ||
    tutorialState.showArrowToRecycler;

  if (!tutorialState.isActive) {
    const hasNothingToShow = !tutorialState.showingMessage &&
      !hasArrows &&
      !tutorialState.showingChoice;

    if (hasNothingToShow) {
      return null;
    }
  }

  // If tutorial is active OR has arrows, always render (even if nothing else is currently visible)

  // Virtual dimensions (must match App.tsx)
  const VIRTUAL_WIDTH = 1200;
  const VIRTUAL_HEIGHT = 800;
  const SIDEBAR_WIDTH = 256;
  const TOP_BAR_HEIGHT = 80;

  // Calculate the game viewport bounds for positioning
  const scaledGameWidth = VIRTUAL_WIDTH * scale;
  const gameLeft = 0;
  const gameTop = (window.innerHeight - scaledGameWidth * (VIRTUAL_HEIGHT / VIRTUAL_WIDTH)) / 2;

  // Check if player is near buildings (within ~2 tiles)
  const playerNearShop = Math.abs(playerX - SHOP_X) < 2;
  const playerNearConstruction = Math.abs(playerX - CONSTRUCTION_X) < 2;
  const playerNearRope = Math.abs(playerX - ROPE_X) < 2;
  const playerNearRecycler = Math.abs(playerX - RECYCLER_X) < 2;

  // Calculate viewport width (game area minus sidebar)
  const viewportWidth = window.innerWidth - SIDEBAR_WIDTH * scale;

  // Convert to world coordinates for camera comparisons
  const viewportWidthWorld = viewportWidth / scale;

  // Convert tile X to pixel position (same as OverworldSection)
  const tileToPixel = (tileX: number) => tileX * GRID_CONFIG.TILE_SIZE + 4;

  // Calculate floating bubble positions (same as OverworldSection)
  const tileCenterPixel = (tileX: number) => tileToPixel(tileX) + GRID_CONFIG.TILE_SIZE / 2;
  const FLOOR_Y = -GRID_CONFIG.TILE_SIZE; // -40px
  const BUBBLE_Y = FLOOR_Y - 180; // -220px

  // Get door/interaction centers (same as OverworldSection)
  const getShopDoorCenter = () => tileCenterPixel(SHOP_X);
  const getRecyclerDoorCenter = () => {
    // Recycler garage door: building w-48 (192px), door w-24 (96px) at right-4 (16px from right)
    return tileCenterPixel(RECYCLER_X) + (192 / 2 - 16 - 96 / 2); // = tileCenterPixel(RECYCLER_X) + 32
  };
  const getConstructionCenter = () => tileCenterPixel(CONSTRUCTION_X);
  const getMineCenter = () => tileCenterPixel(ROPE_X);

  // Check if floating bubbles would be visible (same conditions as OverworldSection)
  const shopBubbleVisible = tutorialState.showArrowToShop && Math.abs(playerX - SHOP_X) >= 2 && !isShopOpen;
  const constructionBubbleVisible = tutorialState.showArrowToConstruction && Math.abs(playerX - CONSTRUCTION_X) >= 2 && !isConstructionOpen;
  const mineBubbleVisible = tutorialState.showArrowToMine && Math.abs(playerX - ROPE_X) >= 2;
  const recyclerBubbleVisible = tutorialState.showArrowToRecycler && Math.abs(playerX - RECYCLER_X) >= 2 && !isRecyclerOpen;

  // Check if floating bubble positions are on-screen
  // Bubbles are centered with translateX(-50%), so check if center is within viewport
  // Bubble is roughly 100-150px wide, so we check with some margin
  const BUBBLE_WIDTH_ESTIMATE = 120; // Approximate bubble width
  const shopBubbleX = getShopDoorCenter();
  const constructionBubbleX = getConstructionCenter();
  const mineBubbleX = getMineCenter();
  const recyclerBubbleX = getRecyclerDoorCenter();

  // Check if bubble X position is on-screen (with margin for bubble width)
  // Y is always at overworld level, so if player is in overworld, bubbles are visible
  const shopBubbleOnScreen = shopBubbleVisible &&
    (shopBubbleX - BUBBLE_WIDTH_ESTIMATE / 2) < camera.x + viewportWidthWorld &&
    (shopBubbleX + BUBBLE_WIDTH_ESTIMATE / 2) > camera.x;

  const constructionBubbleOnScreen = constructionBubbleVisible &&
    (constructionBubbleX - BUBBLE_WIDTH_ESTIMATE / 2) < camera.x + viewportWidthWorld &&
    (constructionBubbleX + BUBBLE_WIDTH_ESTIMATE / 2) > camera.x;

  const mineBubbleOnScreen = mineBubbleVisible &&
    (mineBubbleX - BUBBLE_WIDTH_ESTIMATE / 2) < camera.x + viewportWidthWorld &&
    (mineBubbleX + BUBBLE_WIDTH_ESTIMATE / 2) > camera.x;

  const recyclerBubbleOnScreen = recyclerBubbleVisible &&
    (recyclerBubbleX - BUBBLE_WIDTH_ESTIMATE / 2) < camera.x + viewportWidthWorld &&
    (recyclerBubbleX + BUBBLE_WIDTH_ESTIMATE / 2) > camera.x;

  // Direction player needs to go for HUD arrows
  const shopIsRight = SHOP_X > playerX;
  const constructionIsRight = CONSTRUCTION_X > playerX;
  const ropeIsRight = ROPE_X > playerX;
  const recyclerIsRight = RECYCLER_X > playerX;

  // Calculate gameplay area bounds - the actual visible area where arrows can appear
  // Game is now top-left aligned, so gameTop = 0
  const gameplayAreaLeft = gameLeft + SIDEBAR_WIDTH * scale;
  const gameplayAreaRight = gameplayAreaLeft + viewportWidth;
  const gameplayAreaTop = TOP_BAR_HEIGHT * scale; // Top bar is scaled too
  const HUD_ARROW_PADDING = 20;
  const hudArrowY = 40 * scale; // Position below top bar, relative to container

  // Create arrow positioning - positions are RELATIVE to the clipping container
  const getArrowStyle = (isRight: boolean) => {
    if (isRight) {
      // Right arrow: position at right edge of container
      return {
        right: `${HUD_ARROW_PADDING}px`,
        transform: 'scale(0.8)',
        transformOrigin: 'right center' as const,
      };
    } else {
      // Left arrow: position at left edge of container
      return {
        left: `${HUD_ARROW_PADDING}px`,
        transform: 'scale(0.8)',
        transformOrigin: 'left center' as const,
      };
    }

  };
  // Typing effect for tutorial messages
  const { displayedText, isComplete, skip } = useTypingEffect(
    tutorialState.currentMessage?.text || '',
    2
  );

  // Only show button when typing is complete AND we've displayed the full current message
  // AND it's not a "task step" where the player must complete an action first
  const currentMessageText = tutorialState.currentMessage?.text || '';
  const isTaskStep = tutorialState.currentStep === 'MINE_INTRO_9' || tutorialState.currentStep === 'MINE_COLLECT_2';
  const shouldShowButton = isComplete && displayedText === currentMessageText && !isTaskStep;

  // Handle E key: skip typing animation if in progress, otherwise advance
  useEffect(() => {
    if (!tutorialState.showingMessage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isComplete) {
          // Skip the typing animation
          skip();
        } else {
          // Already complete, advance to next message
          onDismiss();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tutorialState.showingMessage, isComplete, skip, onDismiss]);

  // Check if we should show the dimming backdrop
  // We show it when a message is displayed, BUT NOT if it's an "interactive" hint or we are in a middle of a task (which usually don't have blocking messages)
  // Simple heuristic: If showingMessage is true, we usually want focus.
  const showBackdrop = tutorialState.showingMessage &&
    tutorialState.currentMessage &&
    !isShopOpen &&
    !isConstructionOpen;

  return (
    <>
      {/* Dimming Backdrop for Tutorial Focus */}
      {showBackdrop && (
        <div className="fixed inset-0 bg-black/40 z-[199] pointer-events-none animate-in fade-in duration-500" />
      )}

      {/* Minimized Task HUD Indicator - shows when task is minimized */}
      {isTaskStep && tutorialState.taskMinimized && tutorialState.showingMessage && onToggleTaskMinimized && (
        <button
          onClick={onToggleTaskMinimized}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-white hover:bg-stone-100 text-black font-black px-4 py-2 rounded-lg shadow-lg border-2 border-white animate-pulse transition-all hover:scale-105 flex items-center gap-2"
          title="Show task"
        >
          <span className="text-sm">❗</span>
          <span className="text-xs uppercase tracking-wider">Task</span>
        </button>
      )}
      {/* Message Dialog - positioned at bottom for all messages */}
      {/* Hide if task is minimized */}
      {tutorialState.showingMessage && tutorialState.currentMessage && !isShopOpen && !isConstructionOpen && !tutorialState.taskMinimized && (
        <div className="fixed inset-x-0 bottom-8 z-[200] flex justify-center pointer-events-none px-4 animate-in fade-in duration-300">
          <div className="pointer-events-auto max-w-lg w-full">
            {/* Speech bubble - white border for task steps */}
            <div className={`relative bg-stone-900/95 border-2 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.2)] p-4 ${isTaskStep ? 'border-white' : 'border-amber-500'}`}>
              {/* Character indicator - shows "❗ Task" for task steps, "📖 Guide" otherwise */}
              <div className="absolute -top-2.5 left-4 flex items-center gap-1">
                <div className={`px-2 py-0.5 rounded-full ${isTaskStep ? 'bg-white' : 'bg-amber-500'}`}>
                  <span className="text-[10px] font-black text-black uppercase tracking-wider">
                    {isTaskStep ? '❗ Task' : (tutorialState.currentMessage.character === 'narrator' ? '📖 Guide' : '🤖 You')}
                  </span>
                </div>
                {/* Minimize button for task steps - right next to Task tab */}
                {isTaskStep && onToggleTaskMinimized && (
                  <button
                    onClick={onToggleTaskMinimized}
                    className="bg-white hover:bg-stone-200 px-2 py-0.5 rounded-full transition-colors"
                    title="Minimize task"
                  >
                    <span className="text-[10px] font-bold text-black">−</span>
                  </button>
                )}
              </div>

              {/* Message text with typing effect */}
              <p className="text-sm text-white font-medium leading-relaxed mt-1 min-h-[3rem]">
                {renderTextWithBold(displayedText, isMobile)}
                {!isComplete && <span className="inline-block w-1 h-4 bg-amber-500 ml-1 animate-pulse">|</span>}
              </p>

              {/* Bottom buttons - only show after typing completes */}
              {/* Bottom buttons - reserved space, fade in */}
              <div className={`flex justify-between items-center mt-3 pt-2 border-t border-stone-700/50 transition-opacity duration-300 ${shouldShowButton ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <button
                  onClick={onSkip}
                  className="text-stone-500 hover:text-stone-300 text-[10px] uppercase tracking-wider transition-colors"
                >
                  Skip Tutorial
                </button>
                <button
                  onClick={onDismiss}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-1.5 rounded transition-colors flex items-center gap-2 text-xs"
                >
                  {tutorialState.currentMessage.buttonText}
                  {!isMobile && <span className="text-[10px] opacity-70">[E]</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Choice Dialog */}
      {tutorialState.currentStep === 'POST_SHOP_CHOICE' && tutorialState.showingChoice && !isShopOpen && (
        <div className="fixed inset-x-0 bottom-8 z-[200] flex justify-center pointer-events-none px-4">
          <div className="pointer-events-auto max-w-lg w-full">
            <div className="relative bg-stone-900/95 border-2 border-amber-500 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.2)] p-4">
              <div className="absolute -top-2.5 left-4 bg-amber-500 px-2 py-0.5 rounded-full">
                <span className="text-[10px] font-black text-black uppercase tracking-wider">📖 Guide</span>
              </div>

              <p className="text-sm text-white font-medium leading-relaxed mt-1 mb-4">
                What brings people to towns like this?
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => onSelectChoice?.('ROADS')}
                  className={`w-full border-2 text-white font-bold px-4 py-3 rounded transition-all text-sm text-left flex items-center gap-2 ${selectedChoiceIndex === 0
                    ? 'bg-amber-600 border-amber-400 ring-2 ring-amber-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 border-amber-500'
                    }`}
                >
                  {selectedChoiceIndex === 0 && <span className="text-amber-400">▶</span>}
                  Roads!
                </button>
                <button
                  onClick={() => onSelectChoice?.('ATTRACTIONS')}
                  className={`w-full border-2 text-white font-bold px-4 py-3 rounded transition-all text-sm text-left flex items-center gap-2 ${selectedChoiceIndex === 1
                    ? 'bg-amber-600 border-amber-400 ring-2 ring-amber-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 border-amber-500'
                    }`}
                >
                  {selectedChoiceIndex === 1 && <span className="text-amber-400">▶</span>}
                  Special attractions!
                </button>
                <button
                  onClick={() => onSelectChoice?.('ROBOTS')}
                  className={`w-full border-2 text-white font-bold px-4 py-3 rounded transition-all text-sm text-left flex items-center gap-2 ${selectedChoiceIndex === 2
                    ? 'bg-amber-600 border-amber-400 ring-2 ring-amber-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 border-amber-500'
                    }`}
                >
                  {selectedChoiceIndex === 2 && <span className="text-amber-400">▶</span>}
                  Robots!
                </button>
              </div>
              <div className="mt-3 text-[10px] text-stone-400 text-center">
                Use ↑↓ to select, [E] to choose
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task/Hint Message - positioned at top, narrator style, non-dismissible for task steps */}
      {tutorialState.hintMessage && !isShopOpen && !isConstructionOpen && !isRecyclerOpen && !tutorialState.showingMessage && (
        <div className="fixed inset-x-0 top-24 z-[195] flex justify-center pointer-events-none px-4 animate-in fade-in slide-in-from-top-2 duration-500">
          {(() => {
            const isTaskStep = tutorialState.currentStep === 'MINE_INTRO_9' || tutorialState.currentStep === 'MINE_COLLECT_WAIT';

            // Apply mobile text substitutions to hint message
            let displayText = tutorialState.hintMessage;
            if (isMobile) {
              displayText = displayText
                .replace(/SPACEBAR/gi, 'the BLUE PICKAXE button')
                .replace(/press Z/gi, 'press the RED FLAG button')
                .replace(/Select a block/gi, 'Use the JOYSTICK to select a block');
            }

            return (
              <div
                className={`max-w-sm w-full ${isTaskStep ? '' : 'pointer-events-auto cursor-pointer'}`}
                onClick={isTaskStep ? undefined : () => onDismissHint?.()}
              >
                {/* Narrator-style speech bubble */}
                <div className="relative bg-stone-800/95 border-2 border-amber-400 rounded-xl shadow-2xl overflow-hidden">
                  {/* Character avatar hint */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 rounded-full bg-amber-500 border-2 border-amber-300 flex items-center justify-center">
                    <span className="text-xs">📢</span>
                  </div>
                  <div className="pl-8 pr-3 py-3">
                    <p className="text-sm text-stone-100 font-medium leading-relaxed">
                      {displayText}
                    </p>
                  </div>
                  {!isTaskStep && (
                    <div className="text-[9px] text-stone-500 text-right pr-2 pb-1">
                      Tap to dismiss
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* No Mines Warning - shows in recycler when player has no mines */}
      {tutorialState.noMinesToRecycle && tutorialState.currentStep === 'RECYCLER_INTRO' && isRecyclerOpen && (
        <div className="fixed inset-x-0 bottom-24 z-[195] flex justify-center pointer-events-none px-4 animate-in fade-in duration-300">
          <div className="max-w-md w-full">
            <div className="relative bg-red-900/90 border border-red-500 rounded-lg shadow-lg p-3">
              <p className="text-sm text-red-100 font-medium leading-relaxed">
                ⚠️ You don't have any mines to recycle! Head back to the mine, flag suspected mines with Z, then break them open to collect them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clipping container for HUD arrows - enforces boundaries without cutting off content */}
      <div
        className="fixed z-[190] pointer-events-none"
        style={{
          left: `${gameplayAreaLeft}px`,
          top: `${gameplayAreaTop}px`,
          width: `${viewportWidth}px`,
          height: `${(VIRTUAL_HEIGHT - TOP_BAR_HEIGHT) * scale}px`,
          overflow: 'hidden', // Clip any content extending beyond gameplay area
        }}
      >
        {/* HUD arrows positioned within gameplay area */}
        {shopBubbleVisible && !isAnyMenuOpen && !shopBubbleOnScreen && (
          <div
            className="absolute pointer-events-none"
            style={{
              ...getArrowStyle(shopIsRight),
              top: `${hudArrowY}px`,
            }}
          >
            <div className="flex items-center gap-2 animate-pulse">
              <div className="bg-amber-500 text-black font-bold rounded-lg shadow-lg uppercase tracking-wider whitespace-nowrap" style={{ padding: '6.4px 12.8px', fontSize: '11.2px' }}>
                {shopIsRight ? 'Commissary →' : '← Commissary'}
              </div>
            </div>
          </div>
        )}

        {constructionBubbleVisible && !isAnyMenuOpen && !constructionBubbleOnScreen && (
          <div
            className="absolute pointer-events-none"
            style={{
              ...getArrowStyle(constructionIsRight),
              top: `${hudArrowY}px`,
            }}
          >
            <div className="flex items-center gap-2 animate-pulse">
              <div className="bg-amber-500 text-black font-bold rounded-lg shadow-lg uppercase tracking-wider whitespace-nowrap" style={{ padding: '6.4px 12.8px', fontSize: '11.2px' }}>
                {constructionIsRight ? 'Construction →' : '← Construction'}
              </div>
            </div>
          </div>
        )}

        {mineBubbleVisible && !isAnyMenuOpen && !mineBubbleOnScreen && (
          <div
            className="absolute pointer-events-none"
            style={{
              ...getArrowStyle(ropeIsRight),
              top: `${hudArrowY}px`,
            }}
          >
            <div className="flex items-center gap-2 animate-pulse">
              <div className="bg-amber-500 text-black font-bold rounded-lg shadow-lg uppercase tracking-wider whitespace-nowrap" style={{ padding: '6.4px 12.8px', fontSize: '11.2px' }}>
                {ropeIsRight ? 'Mine →' : '← Mine'}
              </div>
            </div>
          </div>
        )}

        {recyclerBubbleVisible && !isAnyMenuOpen && !recyclerBubbleOnScreen && (
          <div
            className="absolute pointer-events-none"
            style={{
              ...getArrowStyle(recyclerIsRight),
              top: `${hudArrowY}px`,
            }}
          >
            <div className="flex items-center gap-2 animate-pulse">
              <div className="bg-amber-500 text-black font-bold rounded-lg shadow-lg uppercase tracking-wider whitespace-nowrap" style={{ padding: '6.4px 12.8px', fontSize: '11.2px' }}>
                {recyclerIsRight ? 'Recycler →' : '← Recycler'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Arrow pointing to timer in top bar */}
      {tutorialState.showArrowToTimer && !isAnyMenuOpen && (
        <div
          className="fixed z-[190] pointer-events-none animate-bounce"
          style={{
            // Timer is in top bar: left-64 (16rem = 256px) + coins (~80px) + divider + gap
            // Approximate position: sidebar (256px) + coins area (~100px) + gap
            // MUST apply scale to position because GameHUD is scaled relative to origin
            left: `calc(${(256 + 120) * scale}px)`,
            top: `${70 * scale}px`, // Just below the top bar (bar is ~60px + some padding)
          }}
        >
          <div className="flex flex-col items-center">
            <div className="text-amber-500 text-3xl mb-0.5" style={{ transform: `scale(${scale})` }}>↑</div>
            <div className="bg-amber-500 text-black font-bold px-3 py-1 rounded-lg shadow-lg text-xs uppercase tracking-wider whitespace-nowrap" style={{ transform: `scale(${scale})` }}>
              Look! The Timer!
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default TutorialOverlay;
