import React, { useEffect, useState } from 'react';

interface TimerSpotlightProps {
    visible: boolean;
}

/**
 * Spotlight overlay that highlights the timer during the mining tutorial.
 * Creates a dark overlay with a circular cutout around the timer area.
 * Uses getBoundingClientRect on the timer element for accurate positioning.
 */
const TimerSpotlight: React.FC<TimerSpotlightProps> = ({ visible }) => {
    const [position, setPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    useEffect(() => {
        if (!visible) {
            setPosition(null);
            return;
        }

        // Find the timer element by its ID
        const timerElement = document.getElementById('game-timer');
        if (timerElement) {
            const rect = timerElement.getBoundingClientRect();
            setPosition({
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
            });
        }

        // Update position on resize
        const handleResize = () => {
            const el = document.getElementById('game-timer');
            if (el) {
                const rect = el.getBoundingClientRect();
                setPosition({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [visible]);

    if (!visible || !position) return null;

    const centerX = position.x + position.width / 2;
    const centerY = position.y + position.height / 2;
    const spotlightRadiusX = Math.max(position.width * 0.8, 60);
    const spotlightRadiusY = Math.max(position.height * 0.8, 35);

    return (
        <div className="fixed inset-0 z-[180] pointer-events-none animate-in fade-in duration-500">
            {/* Dark overlay with spotlight cutout using CSS mask */}
            <div
                className="absolute inset-0 bg-black/85"
                style={{
                    maskImage: `radial-gradient(ellipse ${spotlightRadiusX}px ${spotlightRadiusY}px at ${centerX}px ${centerY}px, transparent 70%, black 100%)`,
                    WebkitMaskImage: `radial-gradient(ellipse ${spotlightRadiusX}px ${spotlightRadiusY}px at ${centerX}px ${centerY}px, transparent 70%, black 100%)`,
                }}
            />
            {/* Pulsing ring around the timer */}
            <div
                className="absolute rounded-lg border-2 border-amber-400 animate-pulse"
                style={{
                    left: position.x - 8,
                    top: position.y - 6,
                    width: position.width + 16,
                    height: position.height + 12,
                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3)',
                }}
            />
        </div>
    );
};

export default TimerSpotlight;
