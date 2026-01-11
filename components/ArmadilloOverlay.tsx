import React, { useState, useEffect, useRef } from 'react';
import { Inventory } from '../types';

interface ArmadilloOverlayProps {
    inventory: Inventory;
    coins: number;
    setInventory: React.Dispatch<React.SetStateAction<Inventory>>;
    setCoins: React.Dispatch<React.SetStateAction<number>>;
    setMessage: React.Dispatch<React.SetStateAction<string | null>>;
    onClose: () => void;
}

const INTRO_DIALOGUE = [
    "Damn little dude you look filthy. Ain't nobody lookin' after you around here?",
    "Well my name's Armadillo and I quite like what you got goin' on here. In fact, I'm somewhat of an engineer so I can help out!",
    "Mind you, I'm only good with the simpler, smaller tasks. Say, if you find any scrap I'll make it into somethin' special!"
];

const ArmadilloOverlay: React.FC<ArmadilloOverlayProps> = ({
    inventory,
    coins,
    setInventory,
    setCoins,
    setMessage,
    onClose
}) => {
    const [dialogueIndex, setDialogueIndex] = useState(0);
    const [showWorkshop, setShowWorkshop] = useState(inventory.armadilloIntroSeen);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Focus close button on mount
    useEffect(() => {
        setTimeout(() => closeButtonRef.current?.focus(), 100);
    }, [showWorkshop]);

    // Handle intro dialogue advancement
    const handleDialogueNext = () => {
        if (dialogueIndex < INTRO_DIALOGUE.length - 1) {
            setDialogueIndex(dialogueIndex + 1);
        } else {
            // Mark intro as seen and show workshop
            setInventory(prev => ({ ...prev, armadilloIntroSeen: true }));
            setShowWorkshop(true);
        }
    };

    // Craft armor
    const handleCraftArmor = () => {
        const scrapCost = 10;
        const goldCost = 100;

        if (inventory.scrapMetal < scrapCost) {
            setMessage("NOT ENOUGH SCRAP METAL!");
            setTimeout(() => setMessage(null), 2000);
            return;
        }
        if (coins < goldCost) {
            setMessage("NOT ENOUGH GOLD!");
            setTimeout(() => setMessage(null), 2000);
            return;
        }
        if (inventory.armorLevel >= 1) {
            setMessage("ALREADY HAVE MAX ARMOR!");
            setTimeout(() => setMessage(null), 2000);
            return;
        }

        setCoins(prev => prev - goldCost);
        setInventory(prev => ({
            ...prev,
            scrapMetal: prev.scrapMetal - scrapCost,
            armorLevel: 1,
            armorHitsRemaining: 1
        }));
        setMessage("🛡️ ARMOR PLATING CRAFTED!");
        setTimeout(() => setMessage(null), 2000);
    };

    // Show intro dialogue if not seen
    if (!showWorkshop) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-lg bg-amber-950 border-4 border-amber-800 shadow-2xl rounded-sm p-6">
                    {/* Character portrait */}
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-20 h-20 bg-amber-800 rounded-sm flex items-center justify-center text-4xl border-2 border-amber-600">
                            🦔
                        </div>
                        <div className="flex-1">
                            <h2 className="text-amber-400 font-black text-lg uppercase tracking-wider mb-1">Armadillo</h2>
                            <p className="text-amber-200 text-sm leading-relaxed italic">
                                "{INTRO_DIALOGUE[dialogueIndex]}"
                            </p>
                        </div>
                    </div>

                    {/* Next button */}
                    <button
                        onClick={handleDialogueNext}
                        className="w-full bg-amber-700 hover:bg-amber-600 text-white font-black py-3 uppercase tracking-widest border-b-4 border-amber-900 transition-all active:translate-y-1"
                    >
                        {dialogueIndex < INTRO_DIALOGUE.length - 1 ? 'Continue...' : 'Got it!'}
                    </button>
                </div>
            </div>
        );
    }

    // Workshop menu
    const canCraftArmor = inventory.scrapMetal >= 10 && coins >= 100 && inventory.armorLevel < 1;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-amber-950 border-4 border-amber-800 shadow-2xl rounded-sm overflow-hidden">
                {/* Header */}
                <div className="bg-amber-800 px-4 py-3 flex items-center gap-3">
                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        className="text-white font-black px-2 py-1 text-xs hover:bg-amber-700 transition-all border-2 border-amber-600"
                    >
                        ← CLOSE
                    </button>
                    <div className="flex-1 text-right">
                        <h2 className="text-lg font-black text-white uppercase tracking-tighter">Armadillo's Workshop</h2>
                        <div className="text-[9px] text-amber-300 uppercase tracking-widest">Engineering & Upgrades</div>
                    </div>
                    <div className="text-3xl">🦔</div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Resources display */}
                    <div className="flex gap-4 mb-4 text-sm">
                        <div className="bg-black/30 px-3 py-2 rounded">
                            <span className="text-amber-400">⚙️ Scrap:</span>
                            <span className="text-white font-bold ml-2">{inventory.scrapMetal}</span>
                        </div>
                        <div className="bg-black/30 px-3 py-2 rounded">
                            <span className="text-yellow-400">💰 Gold:</span>
                            <span className="text-white font-bold ml-2">{coins}</span>
                        </div>
                        <div className="bg-black/30 px-3 py-2 rounded">
                            <span className="text-blue-400">🛡️ Armor:</span>
                            <span className="text-white font-bold ml-2">Lv{inventory.armorLevel}</span>
                        </div>
                    </div>

                    {/* Armadillo quote */}
                    <div className="bg-black/20 border border-amber-700/50 p-3 mb-4 rounded">
                        <p className="text-amber-200 text-sm italic">
                            "Bring me some scrap and gold, and I'll forge ya some armor plating. It ain't pretty, but it'll save yer hide!"
                        </p>
                    </div>

                    {/* Crafting options */}
                    <div className="space-y-3">
                        <div className={`bg-black/30 border-2 p-4 rounded transition-all ${canCraftArmor
                                ? 'border-amber-600 hover:border-amber-500 cursor-pointer'
                                : 'border-amber-900/50 opacity-50'
                            }`}
                            onClick={canCraftArmor ? handleCraftArmor : undefined}
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">🛡️</div>
                                <div className="flex-1">
                                    <h3 className="text-amber-300 font-black uppercase">Armor Plating Lv1</h3>
                                    <p className="text-amber-200/70 text-xs">Absorbs 1 mine hit. Replenishes each day.</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-amber-400">Cost:</div>
                                    <div className="text-white font-bold text-sm">10 ⚙️ + 100 💰</div>
                                </div>
                            </div>
                            {inventory.armorLevel >= 1 && (
                                <div className="mt-2 text-center text-green-400 text-xs font-bold uppercase">
                                    ✓ Already Owned
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArmadilloOverlay;
