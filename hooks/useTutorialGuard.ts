import { useCallback } from 'react';
import { TutorialState, TutorialStep, INTERACTIVE_STEPS } from './useTutorial';
import { TileState, FlagType, GRID_CONFIG } from '../types';

export const useTutorialGuard = (
    tutorialState: TutorialState,
    grid: TileState[][]
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
    // Returns { allowed: boolean, reason?: 'ANTI_CHEAT' | 'TUTORIAL_BLOCK', minePos?: {x,y} }
    const canMine = (x: number, y: number) => {
        // A. General Tutorial Blocking (e.g. don't mine during conversations)
        // If input is generally blocked, mining is definitely blocked
        if (isInputBlocked()) {
            return { allowed: false, reason: 'TUTORIAL_BLOCK' };
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

        const antiCheatExcludedSteps = new Set<TutorialStep>([
            'MINE_INTRO_9',
            'MINE_COLLECT_2'
        ]);

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

        // C. Guided Mine Discovery Lock
        // If foundMinePosition is set (tutorial is showing "Mine Here!") AND
        // the highlighted tile has been flagged, ONLY allow mining that specific tile.
        if (tutorialState.foundMinePosition) {
            const fmp = tutorialState.foundMinePosition;
            const fmpTile = grid[fmp.y]?.[fmp.x];
            // Check if the foundMinePosition tile is flagged
            if (fmpTile && fmpTile.flag === FlagType.MINE) {
                // Locked state: ONLY the flagged mine tile can be mined
                if (x !== fmp.x || y !== fmp.y) {
                    return { allowed: false, reason: 'TUTORIAL_BLOCK' };
                }
            }
        }

        return { allowed: true };
    };

    return {
        isInputBlocked,
        canMine,
    };
};
