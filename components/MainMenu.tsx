import React, { useEffect, useState, useMemo } from 'react';
import { GameSettings } from '../hooks/useGameSettings';
import { APP_VERSION } from '../constants';

interface MainMenuProps {
    hasSave: boolean;
    onStartNewGame: () => void;
    onContinueGame: () => void;
    onOpenOptions: () => void;
    onMenuClick: () => void;
    isOptionsOpen: boolean;
    settings: GameSettings;
    onUpdateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
    onResetSettings: () => void;
    onCloseOptions: () => void;
}

// Floating cloud component
const Cloud: React.FC<{ delay: number; duration: number; top: string; size: 'sm' | 'md' | 'lg' }> = ({
    delay, duration, top, size
}) => {
    const sizeClasses = {
        sm: 'w-16 h-8',
        md: 'w-24 h-12',
        lg: 'w-32 h-16',
    };

    return (
        <div
            className={`absolute ${sizeClasses[size]} opacity-60`}
            style={{
                top,
                animation: `floatCloud ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                left: '-150px',
            }}
        >
            <div className="relative w-full h-full">
                <div className="absolute bg-white/80 rounded-full w-1/2 h-full left-0 top-0" />
                <div className="absolute bg-white/90 rounded-full w-2/3 h-full left-1/4 top-[-20%]" />
                <div className="absolute bg-white/80 rounded-full w-1/2 h-full right-0 top-0" />
            </div>
        </div>
    );
};

// Floating leaf component
const Leaf: React.FC<{ delay: number; left: string }> = ({ delay, left }) => (
    <div
        className="absolute w-3 h-3 text-amber-600/70"
        style={{
            left,
            animation: `floatLeaf 8s ease-in-out infinite`,
            animationDelay: `${delay}s`,
            top: '-20px',
        }}
    >
        🍂
    </div>
);

// Twinkling star component
const Star: React.FC<{ top: string; left: string; delay: number; size: number }> = ({
    top, left, delay, size
}) => (
    <div
        className="absolute rounded-full bg-yellow-200"
        style={{
            top,
            left,
            width: size,
            height: size,
            animation: `twinkle 2s ease-in-out infinite`,
            animationDelay: `${delay}s`,
        }}
    />
);

// Small house silhouette for horizon
const HouseSilhouette: React.FC<{ left: string; scale?: number }> = ({ left, scale = 1 }) => (
    <div
        className="absolute bottom-0"
        style={{ left, transform: `scale(${scale})`, transformOrigin: 'bottom center' }}
    >
        {/* House body */}
        <div className="w-8 h-6 bg-stone-800/50 relative">
            {/* Roof */}
            <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                    borderLeft: '20px solid transparent',
                    borderRight: '20px solid transparent',
                    borderBottom: '16px solid rgba(41, 37, 36, 0.5)',
                }}
            />
            {/* Window with glow */}
            <div className="absolute top-1 left-1 w-2 h-2 bg-amber-400/80 animate-pulse" />
            {/* Chimney with smoke */}
            <div className="absolute -top-6 right-1 w-1.5 h-3 bg-stone-800/50" />
        </div>
    </div>
);

// Tree silhouette
const TreeSilhouette: React.FC<{ left: string; height?: number }> = ({ left, height = 40 }) => (
    <div className="absolute bottom-0" style={{ left }}>
        <div
            className="bg-stone-800/40 rounded-full"
            style={{
                width: height * 0.6,
                height: height * 0.7,
                marginBottom: height * 0.3 - 2,
            }}
        />
        <div
            className="bg-stone-800/50 mx-auto"
            style={{
                width: 4,
                height: height * 0.3,
                marginTop: -2,
            }}
        />
    </div>
);

const MainMenu: React.FC<MainMenuProps> = ({
    hasSave,
    onStartNewGame,
    onContinueGame,
    onOpenOptions,
    onMenuClick,
}) => {
    const [time, setTime] = useState(0);

    // Animation timer
    useEffect(() => {
        const interval = setInterval(() => setTime(t => t + 1), 100);
        return () => clearInterval(interval);
    }, []);

    // Generate random elements once
    const clouds = useMemo(() => [
        { delay: 0, duration: 45, top: '8%', size: 'lg' as const },
        { delay: 15, duration: 55, top: '15%', size: 'md' as const },
        { delay: 30, duration: 40, top: '5%', size: 'sm' as const },
        { delay: 8, duration: 50, top: '20%', size: 'md' as const },
    ], []);

    const leaves = useMemo(() => [
        { delay: 0, left: '20%' },
        { delay: 2, left: '45%' },
        { delay: 4, left: '70%' },
        { delay: 1, left: '85%' },
        { delay: 3, left: '30%' },
    ], []);

    const stars = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            top: `${5 + Math.random() * 40}%`,
            left: `${5 + Math.random() * 90}%`,
            delay: Math.random() * 2,
            size: 1 + Math.random() * 2,
        })), []);

    return (
        <div
            className="relative h-screen w-screen overflow-hidden cursor-pointer"
            onClick={onMenuClick}
        >
            {/* Gradient sky background - warm sunset/sunrise feel */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(to bottom, #1a1a2e 0%, #16213e 20%, #0f3460 40%, #e94560 70%, #ff9a3c 90%, #ffd460 100%)',
                }}
            />

            {/* Stars layer */}
            <div className="absolute inset-0">
                {stars.map((star, i) => (
                    <Star key={i} {...star} />
                ))}
            </div>

            {/* Clouds layer */}
            <div className="absolute inset-0 overflow-hidden">
                {clouds.map((cloud, i) => (
                    <Cloud key={i} {...cloud} />
                ))}
            </div>

            {/* Leaves falling */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {leaves.map((leaf, i) => (
                    <Leaf key={i} {...leaf} />
                ))}
            </div>

            {/* Distant hills/horizon */}
            <div className="absolute bottom-0 left-0 right-0 h-32">
                <svg viewBox="0 0 1200 100" className="w-full h-full" preserveAspectRatio="none">
                    <path
                        d="M0,100 L0,60 Q150,20 300,50 Q450,80 600,45 Q750,10 900,40 Q1050,70 1200,35 L1200,100 Z"
                        fill="rgba(41, 37, 36, 0.4)"
                    />
                    <path
                        d="M0,100 L0,70 Q200,40 400,65 Q600,90 800,55 Q1000,20 1200,50 L1200,100 Z"
                        fill="rgba(41, 37, 36, 0.6)"
                    />
                </svg>
            </div>

            {/* Village silhouettes on horizon */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-around px-20">
                <TreeSilhouette left="5%" height={35} />
                <HouseSilhouette left="12%" scale={0.8} />
                <TreeSilhouette left="20%" height={45} />
                <TreeSilhouette left="28%" height={30} />
                <HouseSilhouette left="35%" scale={1} />
                <TreeSilhouette left="42%" height={40} />
                <HouseSilhouette left="55%" scale={0.7} />
                <TreeSilhouette left="62%" height={35} />
                <TreeSilhouette left="68%" height={50} />
                <HouseSilhouette left="75%" scale={0.9} />
                <TreeSilhouette left="82%" height={38} />
                <TreeSilhouette left="90%" height={42} />
            </div>

            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-stone-900/70" />

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
                {/* Title card with warm styling */}
                <div className="mb-10 relative">
                    {/* Decorative banner background */}
                    <div className="absolute -inset-4 bg-gradient-to-b from-amber-900/80 to-amber-950/90 rounded-lg border-4 border-amber-600/50 shadow-2xl" />

                    {/* Decorative corners */}
                    <div className="absolute -top-2 -left-2 w-4 h-4 border-t-4 border-l-4 border-amber-400/70 rounded-tl" />
                    <div className="absolute -top-2 -right-2 w-4 h-4 border-t-4 border-r-4 border-amber-400/70 rounded-tr" />
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-4 border-l-4 border-amber-400/70 rounded-bl" />
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-4 border-r-4 border-amber-400/70 rounded-br" />

                    <div className="relative px-12 py-6">
                        <h1
                            className="text-5xl md:text-7xl font-black text-transparent bg-clip-text mb-3 tracking-tight"
                            style={{
                                backgroundImage: 'linear-gradient(to bottom, #fcd34d, #f59e0b, #d97706)',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                WebkitBackgroundClip: 'text',
                            }}
                        >
                            Sweeper Bot
                        </h1>
                        <p className="text-amber-200/80 text-sm tracking-[0.4em] text-center font-medium">
                            WELCOME TO DUSTY HOLLOW
                        </p>
                    </div>
                </div>

                {/* Buttons with cozy wooden style */}
                <div className="flex flex-col gap-3 items-center">
                    {hasSave && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onContinueGame(); }}
                            className="group relative px-10 py-3 bg-gradient-to-b from-emerald-600 to-emerald-700 
                         text-white font-bold rounded-lg border-2 border-emerald-500/50
                         shadow-lg hover:from-emerald-500 hover:to-emerald-600 
                         active:translate-y-1 transition-all text-sm tracking-wider"
                        >
                            <span className="relative z-10">Continue Journey</span>
                            <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); onStartNewGame(); }}
                        className="group relative px-12 py-4 bg-gradient-to-b from-amber-500 to-amber-600 
                       text-amber-950 font-black rounded-lg border-2 border-amber-400/50
                       shadow-xl hover:from-amber-400 hover:to-amber-500 
                       active:translate-y-1 transition-all text-lg tracking-wide"
                    >
                        <span className="relative z-10">Begin Adventure</span>
                        <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenOptions(); }}
                        className="group relative px-8 py-2.5 bg-gradient-to-b from-stone-600 to-stone-700 
                       text-stone-200 font-semibold rounded-lg border-2 border-stone-500/50
                       shadow-lg hover:from-stone-500 hover:to-stone-600 
                       active:translate-y-1 transition-all text-sm tracking-wider"
                    >
                        <span className="relative z-10">⚙ Options</span>
                        <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>

                {/* Hint text */}
                <p className="absolute bottom-6 text-amber-200/40 text-xs tracking-wider animate-pulse">
                    Click anywhere to start music ♪
                </p>
                {/* Version Number - Moved to Top Left for mobile safety */}
                <div className="absolute top-4 left-4 text-white/20 text-[10px] font-mono pointer-events-none select-none z-50">
                    {APP_VERSION}
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
        @keyframes floatCloud {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(100vw + 200px)); }
        }
        
        @keyframes floatLeaf {
          0% { 
            transform: translateY(0) rotate(0deg); 
            opacity: 0;
          }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { 
            transform: translateY(100vh) rotate(360deg); 
            opacity: 0;
          }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
        </div>
    );
};

export default MainMenu;
