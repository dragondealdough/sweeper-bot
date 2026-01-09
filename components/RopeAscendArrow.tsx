import React from 'react';
import { GRID_CONFIG } from '../constants';

interface RopeAscendArrowProps {
    visible: boolean;
    ropeX: number;
    cameraX: number;
    scale: number;
    topBarHeight: number;
}

/**
 * Arrow pointing up to the rope/elevator.
 * Positioned at the top of the screen, but horizontally aligned with the rope's world position.
 * Moves with the camera to stay aligned with the rope.
 */
const RopeAscendArrow: React.FC<RopeAscendArrowProps> = ({
    visible,
    ropeX,
    cameraX,
    scale,
    topBarHeight
}) => {
    if (!visible) return null;

    // Calculate world X position of the rope center
    // ROPE_X is tile index. +20 is half tile? No, TILE_SIZE=40.
    // +4 is board padding?
    // Based on TutorialOverlay logic: ROPE_X * GRID_CONFIG.TILE_SIZE + 20 + 4
    const worldRopeCenterX = ropeX * GRID_CONFIG.TILE_SIZE + (GRID_CONFIG.TILE_SIZE / 2) + 4;

    // Convert to screen coordinates relative to the viewport
    // We assume the container is positioned at the top-left of the gameplay area
    const screenX = (worldRopeCenterX - cameraX) * scale;

    // Fixed vertical position at the top of the gameplay area
    const screenY = topBarHeight * scale + 30;

    return (
        <div
            className="absolute pointer-events-none z-[150]"
            style={{
                left: `${screenX}px`,
                top: `${screenY}px`,
                transform: 'translateX(-50%)',
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
