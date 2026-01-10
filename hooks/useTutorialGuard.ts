import { useCallback } from 'react';
import { TutorialState, TutorialStep, INTERACTIVE_STEPS } from './useTutorial';
import { TileState, FlagType, GRID_CONFIG } from '../types';

// Max depth player can mine during early tutorial (relative to rope length)
const TUTORIAL_DEPTH_BUFFER = 3; // Allow mining TUTORIAL_DEPTH_BUFFER tiles below rope

export const useTutorialGuard = (
    tutorialState: TutorialState,
    grid: TileState[][],
    ropeLength: number = 999 // Default to no limit if not provided
) => {
    // Helper to find "obvious" mines (Anti-Cheat Logic)
    const checkForObviousMines = useCallback((currentGrid: TileState[][]) => {
        const deducibleMines: { x: number, y: number }[] = [];
        const deducibleSet = new Set<string>();

        // Optimization: If grid is empty or undefined, return empty
        if (!currentGrid || currentGrid.length === 0) return [];

        const ROWS = currentGrid.length;
        const COLUMNS = currentGrid[0].length;

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLUMNS; x++) {
                const tile = currentGrid[y][x];
                if (tile.isRevealed && !tile.isMine && tile.neighborMines > 0) {
                    // Count unrevealed neighbors
                    const unrevealedNeighbors: { x: number, y: number }[] = [];
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = y + dy, nx = x + dx;
                            if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLUMNS) {
                                const neighbor = currentGrid[ny][nx];
                                if (!neighbor.isRevealed && !neighbor.isDisarmed && neighbor.flag !== FlagType.MINE) {
                                    unrevealedNeighbors.push({ x: nx, y: ny });
                                }
                            }
                        }
                    }

                    // Count safe/flagged neighbors
                    let adjacentFlags = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = y + dy, nx = x + dx;
                            if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLUMNS) {
                                const neighbor = currentGrid[ny][nx];
                                if (neighbor.isDisarmed || neighbor.flag === FlagType.MINE || (neighbor.isRevealed && neighbor.isMine)) {
                                    adjacentFlags++;
                                }
                            }
                        }
                    }

                    const remainingMinesNeeded = tile.neighborMines - adjacentFlags;

                    // If unrevealed neighbors count matches exactly the mines we still need to find
                    if (unrevealedNeighbors.length > 0 && unrevealedNeighbors.length === remainingMinesNeeded) {
                        unrevealedNeighbors.forEach(pos => {
                            const key = `${pos.x},${pos.y}`;
                            if (!deducibleSet.has(key)) {
                                deducibleSet.add(key);
                                deducibleMines.push(pos);
                            }
                        });
                    }
                }
            }
        }
        return deducibleMines;
    }, []);

    // 1. INPUT BLOCKING GUARD
    // Returns true if generic input (movement, menus) should be blocked
    const isInputBlocked = () => {
        // If NO message is showing, never block (unless specific flags set?)
        if (!tutorialState.showingMessage) return false;

        // If message is showing, allow ONLY interactive steps
        if (INTERACTIVE_STEPS.has(tutorialState.currentStep)) return false;

        // Otherwise block
        return true;
    };

    // 2. MINING GUARD
    // Returns { allowed: boolean, reason?: 'ANTI_CHEAT' | 'TUTORIAL_BLOCK' | 'DEPTH_LIMIT', minePos?: {x,y} }
    const canMine = (x: number, y: number) => {
        // A. General Tutorial Blocking (e.g. don't mine during conversations)
        // If input is generally blocked, mining is definitely blocked
        if (isInputBlocked()) {
            return { allowed: false, reason: 'TUTORIAL_BLOCK' };
        }

        // A2. Depth Limit during Tutorial
        // Prevent player from mining too deep during tutorial so they can always reach the rope
        if (tutorialState.isActive && y >= ropeLength + TUTORIAL_DEPTH_BUFFER) {
            return { allowed: false, reason: 'DEPTH_LIMIT' };
        }

        // B. Anti-Cheat (Guided Discovery)
        // Only enforced during SPECIFIC steps or generic gameplay?
        // User requested "Task 1" (MINE_INTRO_9) was broken.
        // We should strictly enable Anti-Cheat ONLY when we actually WANT it.
        // Originally we said "during free-roam".
        // MINE_INTRO_9 is "Highlight a block and whack it". 
        // IF there is an obvious mine there, we MIGHT want to enforce it?
        // But usually MINE_INTRO_9 is the FIRST mine action. There are NO obvious mines yet.
        // So deducibleMines should be empty.

        // Explicitly DISABLE anti-cheat for the very first whack (MINE_INTRO_9) to be safe?
        // Also disable for MINE_COLLECT_2 (Flagging tutorial).
        // Also disable for all post-flagging steps to prevent softlock when player needs to mine back up.

        const antiCheatExcludedSteps = new Set<TutorialStep>([
            'MINE_INTRO_9',
            'MINE_COLLECT_2',
            'MINE_COLLECT_WAIT',
            'MINE_COLLECTED',
            'ARROW_TO_RECYCLER',
            'RECYCLER_INTRO',
            'RECYCLER_GUIDE',
            'RECYCLER_WAIT',
            'RECYCLER_SUCCESS',
            'CONSTRUCTION_INTRO',
            'CONSTRUCTION_GUIDE',
            'TUTORIAL_COMPLETE',
        ]);

        // C. Recycler Redirect Block (moved before Anti-Cheat)
        // After collecting the mine and before recycling is complete, block mining
        // and direct player to the recycler
        const recyclerRedirectSteps = new Set<TutorialStep>([
            'MINE_COLLECTED',
            'MINE_CHARGES_1',
            'MINE_CHARGES_2',
            'ARROW_TO_ROPE',
            'ARROW_TO_RECYCLER',
            'RECYCLER_INTRO',
            'RECYCLER_GUIDE',
            'RECYCLER_WAIT',
        ]);
        if (tutorialState.isActive && recyclerRedirectSteps.has(tutorialState.currentStep)) {
            return { allowed: false, reason: 'RECYCLER_REDIRECT' };
        }

        if (tutorialState.isActive && !antiCheatExcludedSteps.has(tutorialState.currentStep)) {
            const deducibleMines = checkForObviousMines(grid);
            if (deducibleMines.length > 0) {
                // Is target one of them?
                const isTargetObvious = deducibleMines.some(m => m.x === x && m.y === y);
                if (!isTargetObvious) {
                    // BLOCK!
                    return { allowed: false, reason: 'ANTI_CHEAT', minePos: deducibleMines[0] };
                }
            }
        }



        // D. Guided Mine Discovery Lock
        // If foundMinePosition is set (tutorial is showing "Mine Here!"),
        // ONLY allow mining that specific tile. Block ALL other mining.
        // This ONLY applies during MINE_COLLECT_2 and MINE_COLLECT_WAIT steps
        const mineDiscoverySteps = new Set<TutorialStep>([
            'MINE_COLLECT_2',
            'MINE_COLLECT_WAIT',
        ]);
        if (tutorialState.foundMinePosition && mineDiscoverySteps.has(tutorialState.currentStep)) {
            const fmp = tutorialState.foundMinePosition;
            // Block if target is NOT the highlighted tile
            if (x !== fmp.x || y !== fmp.y) {
                return { allowed: false, reason: 'OBVIOUS_MINE_IGNORED', minePos: fmp };
            }
        }

        return { allowed: true };
    };

    return {
        isInputBlocked,
        canMine,
    };
};
