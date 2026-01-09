import React, { useEffect, useState } from 'react';

interface RopeAscendArrowProps {
    visible: boolean;
    // We don't need manual props anymore, we query the DOM element
    ropeX?: number;
    cameraX?: number;
    scale?: number;
    topBarHeight?: number;
}

/**
 * Arrow pointing up to the rope/elevator.
 * Uses exact DOM positioning by tracking the 'mining-rope' element.
 * This ensures it is always perfectly aligned regardless of camera math.
 */
const RopeAscendArrow: React.FC<RopeAscendArrowProps> = ({ visible }) => {
    const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

    useEffect(() => {
        if (!visible) {
            setPosition(null);
            return;
        }

        const updatePosition = () => {
            const ropeElement = document.getElementById('mining-rope');
            if (ropeElement) {
                const rect = ropeElement.getBoundingClientRect();
                setPosition({
                    left: rect.left + rect.width / 2,
                    top: rect.top + 30 // 30px down from the top of the rope (which is usually top of screen)
                });
            }
        };

        // Update immediately
        updatePosition();

        // Update on frame/resize/scroll
        // We can use requestAnimationFrame for smooth tracking if camera moves
        let animationFrameId: number;

        const loop = () => {
            updatePosition();
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('resize', updatePosition);
            cancelAnimationFrame(animationFrameId);
        };
    }, [visible]);

    if (!visible || !position) return null;

    return (
        <div
            className="fixed pointer-events-none z-[150]"
            style={{
                left: `${position.left}px`,
                top: `${position.top}px`,
                transform: 'translate(-50%, 0)', // Center horizontally
            }}
        >
            <div className="flex flex-col items-center gap-1 animate-bounce">
                <div className="bg-cyan-500 text-black font-bold rounded-lg shadow-lg uppercase tracking-wider whitespace-nowrap px-3 py-2 text-sm">
                    ↑ Ascend
                </div>
                <svg width="20" height="30" viewBox="0 0 20 30" className="text-cyan-500">
                    <path d="M10 30 L10 5 M10 5 L3 12 M10 5 L17 12" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
};

export default RopeAscendArrow;
