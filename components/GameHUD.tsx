
import React from 'react';

interface GameHUDProps {
    coins: number;
    dayTime: number;
    dayCount: number;
    EVENING_THRESHOLD_MS: number;
    formatTime: (ms: number) => string;
    depth: number;
    inventory: any;
    setIsInventoryOpen: (open: boolean) => void;
    message: string | null;
    flashTimer?: boolean;
    highlightDisarmKit?: boolean;
    isMobile?: boolean; // New prop
    taskMinimized?: boolean;
    onToggleTaskMinimized?: () => void;
}

const GameHUD: React.FC<GameHUDProps> = ({
    coins,
    dayTime,
    dayCount,
    EVENING_THRESHOLD_MS,
    formatTime,
    depth,
    inventory,
    setIsInventoryOpen,
    message,
    flashTimer = false,
    highlightDisarmKit = false,
    isMobile = false,
    taskMinimized = false,
    onToggleTaskMinimized
}) => {
    return (
        <>
            {/* Top bar - uses absolute positioning relative to game container */}
            <div className="absolute top-0 left-64 right-0 z-[70] bg-stone-900/90 border-b border-stone-800 p-4 flex justify-between items-center backdrop-blur-md">
                <div className="flex items-center gap-8 pl-4">
                    <div className="text-xl font-black text-yellow-400 flex items-center gap-2">${coins}</div>
                    <div className="h-4 w-px bg-stone-700" />
                    <div className="flex items-center gap-2" id="game-timer">
                        <div className={`text-xl font-black font-mono transition-all ${flashTimer
                            ? 'text-red-500 animate-pulse scale-125'
                            : dayTime < EVENING_THRESHOLD_MS
                                ? 'text-red-500 animate-pulse'
                                : 'text-white'
                            }`}>
                            {formatTime(dayTime)}
                        </div>
                        <div className="text-[9px] text-stone-500 uppercase tracking-widest ml-1">DAY {dayCount}</div>
                    </div>
                    <div className="h-4 w-px bg-stone-700" />
                </>
                )}
            </div>

            {/* Hide desktop controls on mobile */}

            {/* Hide desktop controls on mobile */}
            {!isMobile && (
                <div className="text-[9px] text-stone-500 uppercase tracking-widest hidden lg:block">Controls: [WASD] Move | [Space] Dig | [Z/X] Flag | [E] Interact/Climb | [I] Inventory</div>
            )}
        </div >

            { message && (
                <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-[100] text-white px-4 py-2 rounded font-bold uppercase text-sm shadow-lg border-2 ${message.includes('+')
                    ? 'bg-emerald-600/95 border-emerald-400 animate-pulse'
                    : 'bg-red-500/90 border-red-400 animate-bounce'
                    }`}>
                    {message}
                </div>
            )
}

{/* Left Sidebar Info - uses absolute positioning relative to game container */ }
<div className="absolute left-0 top-0 bottom-0 w-64 bg-stone-950 border-r border-stone-800 z-[80] p-6 flex flex-col font-mono select-none">
    <div className="mb-6">
        <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Current Depth</div>
        <div className="text-4xl font-black text-white tracking-tighter">{depth * 10}<span className="text-xs text-stone-600 ml-1">M</span></div>
    </div>

    {/* Disarm Kit Status - Prominent Display */}
    <div className={`mb-6 p-3 border-2 rounded transition-all ${highlightDisarmKit
        ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-950 animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.4)]'
        : inventory.disarmCharges === 0 && inventory.disarmKits === 0
            ? 'border-red-600 bg-red-950/30'
            : inventory.disarmCharges <= 1
                ? 'border-amber-600 bg-amber-950/20'
                : 'border-stone-700 bg-stone-900'
        }`}>
        <div className="text-[9px] text-stone-400 uppercase tracking-widest mb-2">Disarm Kit</div>
        <div className="flex items-center justify-between">
            <div>
                <div className="text-[8px] text-stone-500 uppercase">Charges</div>
                <div className="flex items-center gap-1">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-sm border ${i < inventory.disarmCharges ? 'bg-amber-500 border-amber-400' : 'bg-stone-800 border-stone-700'}`}
                        />
                    ))}
                </div>
            </div>
            <div className="text-right">
                <div className="text-[8px] text-stone-500 uppercase">Spare Kits</div>
                <div className={`text-xl font-black ${inventory.disarmKits > 0 ? 'text-green-400' : 'text-stone-600'}`}>
                    {inventory.disarmKits}
                </div>
            </div>
        </div>
        {inventory.disarmCharges === 0 && inventory.disarmKits === 0 && (
            <div className="text-[8px] text-red-400 uppercase mt-2 animate-pulse">⚠️ NO KITS - BUY MORE!</div>
        )}
    </div>

    <div className="flex-1" />

    <div className="text-[9px] text-stone-500 text-center uppercase border border-stone-800 p-2 cursor-pointer hover:bg-slate-800 hover:text-white transition-colors" onClick={() => setIsInventoryOpen(true)}>
        {isMobile ? 'OPEN INVENTORY' : '[I] OPEN INVENTORY'}
    </div>
</div>
        </>
    );
};

export default GameHUD;

