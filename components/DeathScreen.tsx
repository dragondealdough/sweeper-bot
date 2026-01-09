import React, { useState, useEffect, useCallback } from 'react';

export type DeathPhase = 'NONE' | 'IMPACT' | 'FADE' | 'REPAIRING' | 'COMPLETE';

interface DeathScreenProps {
    phase: DeathPhase;
    deathDepth: number;
    furthestDepth: number;
    onNextDay: () => void;
}

const DeathScreen: React.FC<DeathScreenProps> = ({
    phase,
    deathDepth,
    furthestDepth,
    onNextDay,
}) => {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showStats, setShowStats] = useState(false);
    const [showButton, setShowButton] = useState(false);
    const [buttonPressed, setButtonPressed] = useState(false);
    const [fadingOut, setFadingOut] = useState(false);

    // Loading bar animation during REPAIRING phase
    useEffect(() => {
        if (phase === 'REPAIRING') {
            setLoadingProgress(0);
            setShowStats(false);
            setShowButton(false);

            // Animate loading bar over 3 seconds
            const startTime = Date.now();
            const duration = 3000;

            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration * 100, 100);
                setLoadingProgress(progress);

                if (progress >= 100) {
                    clearInterval(interval);
                    setShowStats(true);
                    setTimeout(() => setShowButton(true), 500);
                }
            }, 50);

            return () => clearInterval(interval);
        }
    }, [phase]);

    const handleNextDayClick = useCallback(() => {
        if (fadingOut) return;
        setButtonPressed(true);

        setTimeout(() => {
            setFadingOut(true);
            setTimeout(() => {
                onNextDay();
            }, 600);
        }, 150);
    }, [fadingOut, onNextDay]);

    // White flash overlay (during IMPACT)
    if (phase === 'IMPACT') {
        return (
            <div className="fixed inset-0 bg-white z-[500] pointer-events-none animate-pulse" />
        );
    }

    // Fade to black (during FADE)
    if (phase === 'FADE') {
        return (
            <div
                className="fixed inset-0 bg-black z-[500] pointer-events-none transition-opacity duration-[600ms]"
                style={{ opacity: 1 }}
            />
        );
    }

    // Repairing screen (during REPAIRING and COMPLETE)
    if (phase === 'REPAIRING' || phase === 'COMPLETE') {
        return (
            <div className="fixed inset-0 bg-black z-[500] flex flex-col items-center justify-center">
                {/* Repairing text */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-amber-500 uppercase tracking-widest animate-pulse">
                        Repairing...
                    </h1>
                </div>

                {/* Loading bar */}
                <div className="w-64 h-3 bg-stone-800 rounded-full overflow-hidden mb-12 border border-stone-700">
                    <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-100 ease-out rounded-full"
                        style={{ width: `${loadingProgress}%` }}
                    />
                </div>

                {/* Stats display */}
                <div
                    className={`text-center mb-10 transition-all duration-500 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                    <p className="text-stone-400 text-lg mb-3">
                        Today's Distance: <span className="text-white font-bold">{deathDepth * 10}m</span>
                    </p>
                    <p className="text-stone-400 text-lg">
                        Furthest Distance: <span className="text-amber-400 font-bold">{furthestDepth * 10}m</span>
                    </p>
                </div>

                {/* Next Day button */}
                <div
                    className={`transition-all duration-500 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                    <button
                        onClick={handleNextDayClick}
                        disabled={fadingOut || !showButton}
                        className={`group relative px-12 py-4 bg-gradient-to-b from-amber-500 to-amber-600 
                       text-amber-950 font-black rounded-lg border-2 border-amber-400/50
                       shadow-xl hover:from-amber-400 hover:to-amber-500 
                       transition-all text-lg tracking-wide
                       ${buttonPressed ? 'scale-95 brightness-125' : 'active:translate-y-1'}
                       ${fadingOut ? 'pointer-events-none' : ''}`}
                    >
                        <span className="relative z-10">Next Day</span>
                        <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>

                {/* Fade out overlay */}
                <div
                    className={`fixed inset-0 bg-black pointer-events-none transition-opacity duration-[600ms] ease-in-out
                     ${fadingOut ? 'opacity-100' : 'opacity-0'}`}
                />
            </div>
        );
    }

    return null;
};

export default DeathScreen;
