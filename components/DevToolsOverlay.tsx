
import React, { useState, useEffect } from 'react';
import { Inventory, GameStatus } from '../types';
import { TutorialStep, TutorialState } from '../hooks/useTutorial';

interface DevToolsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    // Tutorial controls
    tutorialState: TutorialState;
    onSkipToTutorialPhase: (phase: 'commissary' | 'construction' | 'mine' | 'recycler' | 'complete') => void;
    // Inventory controls
    inventory: Inventory;
    setInventory: React.Dispatch<React.SetStateAction<Inventory>>;
    // Game state controls
    coins: number;
    setCoins: React.Dispatch<React.SetStateAction<number>>;
    dayTime: number;
    setDayTime: React.Dispatch<React.SetStateAction<number>>;
    timeRef: React.MutableRefObject<number>;
    DAY_DURATION_MS: number;
    EVENING_THRESHOLD_MS: number;
    // Player controls
    setPlayerPosition?: (x: number, y: number) => void;
}

const DevToolsOverlay: React.FC<DevToolsOverlayProps> = ({
    isOpen,
    onClose,
    tutorialState,
    onSkipToTutorialPhase,
    inventory,
    setInventory,
    coins,
    setCoins,
    dayTime,
    setDayTime,
    timeRef,
    DAY_DURATION_MS,
    EVENING_THRESHOLD_MS,
}) => {
    const [activeTab, setActiveTab] = useState<'tutorial' | 'inventory' | 'time' | 'other'>('tutorial');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const tutorialPhases: { label: string; phase: 'commissary' | 'construction' | 'mine' | 'recycler' | 'complete' }[] = [
        { label: '🛒 Skip to Commissary', phase: 'commissary' },
        { label: '🏗️ Skip to Construction', phase: 'construction' },
        { label: '⛏️ Skip to Mine', phase: 'mine' },
        { label: '♻️ Skip to Recycler', phase: 'recycler' },
        { label: '✅ Complete Tutorial', phase: 'complete' },
    ];

    const inventoryItems: { label: string; key: keyof Inventory | 'coins'; value: number; emoji: string }[] = [
        { label: 'Coins', key: 'coins', value: coins, emoji: '💰' },
        { label: 'Stone', key: 'stone', value: inventory.stone, emoji: '🪨' },
        { label: 'Gems', key: 'gems', value: inventory.gems, emoji: '💎' },
        { label: 'Coal', key: 'coal', value: inventory.coal, emoji: '⚫' },
        { label: 'Silver Blocks', key: 'silverBlocks', value: inventory.silverBlocks, emoji: '🥈' },
        { label: 'Defused Mines', key: 'defusedMines', value: inventory.defusedMines, emoji: '💣' },
        { label: 'Scrap Metal', key: 'scrapMetal', value: inventory.scrapMetal, emoji: '⚙️' },
        { label: 'Disarm Kits', key: 'disarmKits', value: inventory.disarmKits, emoji: '🧰' },
        { label: 'Disarm Charges', key: 'disarmCharges', value: inventory.disarmCharges, emoji: '⚡' },
    ];

    const addItem = (key: keyof Inventory | 'coins', amount: number) => {
        if (key === 'coins') {
            setCoins(prev => Math.max(0, prev + amount));
        } else if (typeof inventory[key as keyof Inventory] === 'number') {
            setInventory(prev => ({
                ...prev,
                [key]: Math.max(0, (prev[key as keyof Inventory] as number) + amount),
            }));
        }
    };

    const setTime = (ms: number) => {
        timeRef.current = ms;
        setDayTime(ms);
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-stone-900 border-2 border-red-600 rounded-lg shadow-[0_0_30px_rgba(220,38,38,0.3)] overflow-hidden font-mono">
                {/* Header */}
                <div className="bg-red-900/80 p-4 flex justify-between items-center border-b border-red-700">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔧</span>
                        <h2 className="text-xl font-black text-white uppercase tracking-wider">Dev Tools</h2>
                        <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded uppercase">Debug Mode</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-red-300 font-bold text-sm uppercase"
                    >
                        [ESC] Close
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-700">
                    {(['tutorial', 'inventory', 'time', 'other'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${activeTab === tab
                                ? 'bg-red-800 text-white border-b-2 border-red-400'
                                : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* Tutorial Tab */}
                    {activeTab === 'tutorial' && (
                        <div className="space-y-4">
                            <div className="text-xs text-stone-400 uppercase tracking-wider mb-2">
                                Current Step: <span className="text-amber-400">{tutorialState.currentStep}</span>
                                {!tutorialState.isActive && <span className="text-green-400 ml-2">(Completed)</span>}
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {tutorialPhases.map(({ label, phase }) => (
                                    <button
                                        key={phase}
                                        onClick={() => onSkipToTutorialPhase(phase)}
                                        className="w-full text-left px-4 py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded transition-colors text-white font-medium"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Inventory Tab */}
                    {activeTab === 'inventory' && (
                        <div className="space-y-3">
                            <div className="text-xs text-stone-400 uppercase tracking-wider mb-2">
                                Add or remove items from inventory
                            </div>

                            {inventoryItems.map(({ label, key, value, emoji }) => (
                                <div key={key} className="flex items-center justify-between bg-stone-800 px-4 py-2 rounded border border-stone-700">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{emoji}</span>
                                        <span className="text-white font-medium">{label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => addItem(key, -10)}
                                            className="w-8 h-8 bg-red-800 hover:bg-red-700 text-white font-bold rounded text-xs"
                                        >
                                            -10
                                        </button>
                                        <button
                                            onClick={() => addItem(key, -1)}
                                            className="w-8 h-8 bg-red-700 hover:bg-red-600 text-white font-bold rounded"
                                        >
                                            -
                                        </button>
                                        <span className="w-16 text-center text-amber-400 font-bold text-lg">{value}</span>
                                        <button
                                            onClick={() => addItem(key, 1)}
                                            className="w-8 h-8 bg-green-700 hover:bg-green-600 text-white font-bold rounded"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => addItem(key, 10)}
                                            className="w-8 h-8 bg-green-800 hover:bg-green-700 text-white font-bold rounded text-xs"
                                        >
                                            +10
                                        </button>
                                        <button
                                            onClick={() => addItem(key, 100)}
                                            className="w-10 h-8 bg-green-900 hover:bg-green-800 text-white font-bold rounded text-xs"
                                        >
                                            +100
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Quick presets */}
                            <div className="pt-4 border-t border-stone-700">
                                <div className="text-xs text-stone-400 uppercase tracking-wider mb-2">Quick Presets</div>
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => {
                                            setCoins(999);
                                            setInventory(prev => ({
                                                ...prev,
                                                stone: 99,
                                                gems: 50,
                                                coal: 50,
                                                silverBlocks: 20,
                                                defusedMines: 10,
                                                scrapMetal: 50,
                                                disarmKits: 10,
                                                disarmCharges: 3,
                                            }));
                                        }}
                                        className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded text-sm"
                                    >
                                        💰 Rich Mode
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCoins(0);
                                            setInventory(prev => ({
                                                ...prev,
                                                stone: 0,
                                                gems: 0,
                                                coal: 0,
                                                silverBlocks: 0,
                                                defusedMines: 0,
                                                scrapMetal: 0,
                                                disarmKits: 0,
                                                disarmCharges: 0,
                                            }));
                                        }}
                                        className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold rounded text-sm"
                                    >
                                        🗑️ Clear All
                                    </button>
                                    <button
                                        onClick={() => setInventory(prev => ({ ...prev, hasPickaxe: true }))}
                                        className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded text-sm"
                                    >
                                        ⛏️ Give Pickaxe
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Time Tab */}
                    {activeTab === 'time' && (
                        <div className="space-y-4">
                            <div className="text-xs text-stone-400 uppercase tracking-wider mb-2">
                                Current Time: <span className="text-amber-400">{Math.floor(dayTime / 1000)}s</span> / {Math.floor(DAY_DURATION_MS / 1000)}s
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setTime(DAY_DURATION_MS)}
                                    className="px-4 py-3 bg-green-800 hover:bg-green-700 text-white font-bold rounded text-sm"
                                >
                                    ☀️ Reset to Morning
                                </button>
                                <button
                                    onClick={() => setTime(EVENING_THRESHOLD_MS)}
                                    className="px-4 py-3 bg-orange-800 hover:bg-orange-700 text-white font-bold rounded text-sm"
                                >
                                    🌅 Set to Evening
                                </button>
                                <button
                                    onClick={() => setTime(10000)}
                                    className="px-4 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded text-sm"
                                >
                                    🌙 Almost Midnight (10s)
                                </button>
                                <button
                                    onClick={() => setTime(dayTime + 30000)}
                                    className="px-4 py-3 bg-stone-700 hover:bg-stone-600 text-white font-bold rounded text-sm"
                                >
                                    ⏩ Add 30 Seconds
                                </button>
                            </div>

                            <div className="pt-4 border-t border-stone-700">
                                <div className="text-xs text-stone-400 uppercase tracking-wider mb-2">Time Info</div>
                                <div className="text-sm text-stone-300 space-y-1">
                                    <p>• Day Duration: {DAY_DURATION_MS / 1000}s</p>
                                    <p>• Evening Threshold: {EVENING_THRESHOLD_MS / 1000}s remaining</p>
                                    <p>• Current: {Math.floor(dayTime / 1000)}s remaining</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Other Tab */}
                    {activeTab === 'other' && (
                        <div className="space-y-4">
                            <div className="text-xs text-stone-400 uppercase tracking-wider mb-2">
                                Miscellaneous Debug Options
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => {
                                        setInventory(prev => ({ ...prev, hasPickaxe: !prev.hasPickaxe }));
                                    }}
                                    className="w-full text-left px-4 py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded transition-colors text-white font-medium"
                                >
                                    ⛏️ Toggle Pickaxe: {inventory.hasPickaxe ? '✅ Has' : '❌ Missing'}
                                </button>

                                <button
                                    onClick={() => {
                                        setInventory(prev => ({
                                            ...prev,
                                            wishingWellBuilt: !prev.wishingWellBuilt
                                        }));
                                    }}
                                    className="w-full text-left px-4 py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded transition-colors text-white font-medium"
                                >
                                    🌟 Toggle Wishing Well: {inventory.wishingWellBuilt ? '✅ Built' : '❌ Not Built'}
                                </button>

                                <button
                                    onClick={() => {
                                        setInventory(prev => ({
                                            ...prev,
                                            wishingWellProgress: { stone: 50, silver: 10 }
                                        }));
                                    }}
                                    className="w-full text-left px-4 py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded transition-colors text-white font-medium"
                                >
                                    🔨 Max Wishing Well Progress (50 stone, 10 silver)
                                </button>
                            </div>

                            <div className="pt-4 border-t border-stone-700">
                                <div className="text-xs text-stone-400 uppercase tracking-wider mb-2">Current State</div>
                                <div className="text-xs text-stone-300 font-mono bg-black/50 p-3 rounded max-h-32 overflow-auto">
                                    <pre>{JSON.stringify({
                                        tutorialStep: tutorialState.currentStep,
                                        tutorialActive: tutorialState.isActive,
                                        hasPickaxe: inventory.hasPickaxe,
                                        wishingWellBuilt: inventory.wishingWellBuilt,
                                        wishingWellProgress: inventory.wishingWellProgress,
                                    }, null, 2)}</pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-stone-950 p-3 border-t border-stone-700 text-center">
                    <span className="text-xs text-stone-500">Press <kbd className="bg-stone-800 px-1.5 py-0.5 rounded text-stone-300">`</kbd> to toggle dev tools</span>
                </div>
            </div>
        </div>
    );
};

export default DevToolsOverlay;
