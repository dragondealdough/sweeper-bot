import React from 'react';

interface TimerSpotlightProps {
    visible: boolean;
    timerPosition?: { x: number; y: number; width: number; height: number };
}

/**
 * Spotlight overlay that highlights the timer during the mining tutorial.
 * Creates a dark overlay with a circular cutout around the timer area.
 */
const TimerSpotlight: React.FC<TimerSpotlightProps> = ({ visible, timerPosition }) => {
    if (!visible) return null;

    // Default position if not provided (top-right area where timer usually is)
    const pos = timerPosition || { x: window.innerWidth - 120, y: 10, width: 100, height: 40 };

    return (
        <div className="fixed inset-0 z-[180] pointer-events-none animate-in fade-in duration-500">
            {/* Dark overlay with spotlight cutout using CSS mask */}
            <div
                className="absolute inset-0 bg-black/80"
                style={{
                    maskImage: `radial-gradient(ellipse 80px 50px at ${pos.x + pos.width / 2}px ${pos.y + pos.height / 2}px, transparent 60%, black 100%)`,
                    WebkitMaskImage: `radial-gradient(ellipse 80px 50px at ${pos.x + pos.width / 2}px ${pos.y + pos.height / 2}px, transparent 60%, black 100%)`,
                }}
            />
            {/* Pulsing ring around the timer */}
            <div
                className="absolute rounded-full border-2 border-amber-400 animate-pulse"
                style={{
                    left: pos.x - 10,
                    top: pos.y - 10,
                    width: pos.width + 20,
                    height: pos.height + 20,
                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3)',
                }}
            />
        </div>
    );
};

export default TimerSpotlight;
