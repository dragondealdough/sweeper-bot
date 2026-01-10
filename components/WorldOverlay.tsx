import React from 'react';
import { GRID_CONFIG } from '../constants';


interface WorldOverlayProps {
    foundMinePosition: { x: number, y: number } | null;
    ropeX: number;
    ropeBubbleVisible: boolean;
    scale: number; // Global scale, used for counter-scaling icons
    isMenuOpen: boolean;
}

export const WorldOverlay: React.FC<WorldOverlayProps> = ({
    foundMinePosition,
    ropeX,
    ropeBubbleVisible,
    scale,
    isMenuOpen
}) => {
    if (isMenuOpen) return null;

    // Counter-scale style to keep elements constant size on screen
    // "scale(1 / global_scale)"
    const counterScale = 1 / scale;
    const counterScaleStyle = { transform: `translate(-50%, -100%) scale(${counterScale})` };

    return (
        <div className="absolute inset-0 pointer-events-none z-[50]" style={{ overflow: 'visible' }}>

            {/* Guided Mine Discovery Arrow - Points to the obvious mine */}
            {foundMinePosition && (
                <div
                    className="absolute flex flex-col items-center animate-bounce"
                    style={{
                        // Position exactly at the center-bottom of the target tile
                        left: (foundMinePosition.x * GRID_CONFIG.TILE_SIZE) + (GRID_CONFIG.TILE_SIZE / 2),
                        top: (foundMinePosition.y * GRID_CONFIG.TILE_SIZE),
                        ...counterScaleStyle, // Scale it inversely to zoom so it stays "screen size"
                        transformOrigin: 'bottom center'
                    }}
                >
                    <div className="bg-red-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.8)] uppercase tracking-wider whitespace-nowrap px-3 py-1 mb-1 text-sm border-2 border-white">
                        Mine Here!
                    </div>
                    <svg width="24" height="24" viewBox="0 0 24 24" className="text-red-500 drop-shadow-lg filter">
                        <path d="M12 24 L24 0 L12 8 L0 0 Z" fill="currentColor" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                </div>
            )}

            {/* Rope Ascend Arrow
          Note: The original RopeAscendArrow component used getBoundingClientRect. 
          We should re-implement it here purely transactionally if possible, or wrap it.
          Since we are IN world space, we position it at ropeX.
      */}
            {ropeBubbleVisible && (
                <div
                    className="absolute flex flex-col items-center animate-bounce"
                    style={{
                        left: (ropeX * GRID_CONFIG.TILE_SIZE) + (GRID_CONFIG.TILE_SIZE / 2),
                        top: 0, // Top of the mine/world
                        ...counterScaleStyle,
                        transformOrigin: 'bottom center'
                    }}
                >
                    <div className="bg-blue-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.8)] uppercase tracking-wider whitespace-nowrap px-3 py-1 mb-1 text-sm border-2 border-white">
                        Ascend
                    </div>
                    <svg width="24" height="24" viewBox="0 0 24 24" className="text-blue-500 drop-shadow-lg filter rotate-180">
                        <path d="M12 24 L24 0 L12 8 L0 0 Z" fill="currentColor" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                </div>
            )}

        </div>
    );
};
