
import React, { useState, useCallback, useRef } from 'react';
import { TileState, FlagType, GameStatus, Inventory, WorldItem, ItemType } from '../types';
import { GRID_CONFIG, INITIAL_ROPE_LENGTH, SAFE_ROWS, CARD_DEFINITIONS } from '../constants';
import { TutorialState } from './useTutorial';

const CHARGES_PER_KIT = 3;

export const useMining = (
    ROPE_X: number,
    setDepth: React.Dispatch<React.SetStateAction<number>>,
    setStatus: React.Dispatch<React.SetStateAction<GameStatus>>,
    setInventory: React.Dispatch<React.SetStateAction<Inventory>>,
    setMessage: React.Dispatch<React.SetStateAction<string | null>>,
    handlePlayerDeath: () => void,
    setWorldItems: React.Dispatch<React.SetStateAction<WorldItem[]>>,
    tutorialState?: TutorialState,
    onMineHit?: () => void,
    onTileRevealed?: () => void,
    onMineCollected?: () => void,
    setScreenShake?: React.Dispatch<React.SetStateAction<number>>,
    setPlayerHitFlash?: React.Dispatch<React.SetStateAction<boolean>>,
    onMineAttemptInterrupt?: (x: number, y: number) => void,
    onTileFlagged?: (x: number, y: number) => void
) => {
    const [grid, setGrid] = useState<TileState[][]>([]);
    const gridRef = useRef<TileState[][]>([]);
    const [selectedTarget, setSelectedTarget] = useState<{ x: number, y: number } | null>(null);

    const initGrid = useCallback(() => {
        const newGrid: TileState[][] = [];
        const mines: boolean[] = new Array(GRID_CONFIG.COLUMNS * GRID_CONFIG.ROWS).fill(false);
        let placed = 0;
        const mineStartOffset = GRID_CONFIG.COLUMNS * SAFE_ROWS;

        while (placed < GRID_CONFIG.INITIAL_MINE_COUNT) {
            const idx = Math.floor(Math.random() * (mines.length - mineStartOffset)) + mineStartOffset;
            if (!mines[idx] && !(idx % GRID_CONFIG.COLUMNS === ROPE_X && Math.floor(idx / GRID_CONFIG.COLUMNS) < INITIAL_ROPE_LENGTH)) {
                mines[idx] = true; placed++;
            }
        }
        for (let y = 0; y < GRID_CONFIG.ROWS; y++) {
            const row: TileState[] = [];
            for (let x = 0; x < GRID_CONFIG.COLUMNS; x++) {
                row.push({
                    x, y,
                    isMine: mines[y * GRID_CONFIG.COLUMNS + x],
                    isRevealed: y < SAFE_ROWS || (x === ROPE_X && y < INITIAL_ROPE_LENGTH),
                    flag: FlagType.NONE,
                    neighborMines: 0
                });
            }
            newGrid.push(row);
        }
        for (let y = 0; y < GRID_CONFIG.ROWS; y++) {
            for (let x = 0; x < GRID_CONFIG.COLUMNS; x++) {
                if (!newGrid[y][x].isMine) {
                    let count = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = y + dy, nx = x + dx;
                            if (ny >= 0 && ny < GRID_CONFIG.ROWS && nx >= 0 && nx < GRID_CONFIG.COLUMNS && newGrid[ny][nx].isMine) count++;
                        }
                    }
                    newGrid[y][x].neighborMines = count;
                }
            }
        }
        gridRef.current = newGrid;
        setGrid(newGrid);
        return newGrid;
    }, [ROPE_X]);

    const revealTileAt = useCallback((x: number, y: number, inventory: Inventory, depth: number, isInitial: boolean = true) => {
        if (x < 0 || x >= GRID_CONFIG.COLUMNS || y < 0 || y >= GRID_CONFIG.ROWS) return;
        const tile = gridRef.current[y][x];
        if (tile.isRevealed && !(isInitial && tile.item === 'SILVER_BLOCK')) return;

        const newGrid = gridRef.current.map(row => row.map(t => ({ ...t })));

        if (tile.item === 'SILVER_BLOCK') {
            newGrid[y][x].item = undefined;
            setInventory(prev => ({ ...prev, silverBlocks: prev.silverBlocks + 1 }));
        } else if (isInitial && tile.flag === FlagType.MINE) {
            // Flagged tile - attempting disarm, uses a charge regardless of mine presence
            const hasCharges = inventory.disarmCharges > 0 || inventory.disarmKits > 0;

            if (hasCharges) {
                const isMine = tile.isMine;

                setInventory(prev => {
                    let newCharges = prev.disarmCharges;
                    let newKits = prev.disarmKits;
                    let equippedNewKit = false;

                    // If no charges but have kits, equip a new kit first
                    if (newCharges === 0 && newKits > 0) {
                        newKits -= 1;
                        newCharges = CHARGES_PER_KIT;
                        equippedNewKit = true;
                    }

                    // Use a charge
                    newCharges -= 1;

                    // Show pickup-style message for defused mine
                    if (isMine) {
                        setMessage(equippedNewKit ? "+1 DEFUSED MINE 💣 (new kit equipped)" : "+1 DEFUSED MINE 💣");
                    } else {
                        setMessage(equippedNewKit ? "NO MINE - NEW KIT EQUIPPED" : "NO MINE - CHARGE USED");
                    }

                    // Auto-equip new kit immediately if current one is now empty
                    if (newCharges === 0 && newKits > 0) {
                        newKits -= 1;
                        newCharges = CHARGES_PER_KIT;
                        setTimeout(() => {
                            setMessage("KIT EMPTY - NEW KIT EQUIPPED (" + newKits + " remaining)");
                            setTimeout(() => setMessage(null), 1500);
                        }, 1500);
                    } else if (newCharges === 0 && newKits === 0) {
                        setTimeout(() => {
                            setMessage("WARNING: NO DISARM KITS LEFT!");
                            setTimeout(() => setMessage(null), 2000);
                        }, 1500);
                    } else {
                        setTimeout(() => setMessage(null), 1500);
                    }

                    return {
                        ...prev,
                        disarmCharges: newCharges,
                        disarmKits: newKits,
                        defusedMines: isMine ? prev.defusedMines + 1 : prev.defusedMines
                    };
                });

                if (isMine) {
                    // Was a mine - defuse it and update neighbor counts
                    newGrid[y][x] = { ...newGrid[y][x], isRevealed: true, isMine: false, flag: FlagType.NONE };

                    // Trigger tutorial callback if mine was collected
                    if (onMineCollected) {
                        onMineCollected();
                    }

                    // Track tiles that become 0 after update
                    const tilesBecomingZero: { x: number, y: number }[] = [];

                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = y + dy, nx = x + dx;
                            if (ny >= 0 && ny < GRID_CONFIG.ROWS && nx >= 0 && nx < GRID_CONFIG.COLUMNS) {
                                const oldCount = newGrid[ny][nx].neighborMines;
                                const newCount = Math.max(0, oldCount - 1);
                                newGrid[ny][nx] = { ...newGrid[ny][nx], neighborMines: newCount };

                                // If this revealed tile just became 0, it should trigger flood fill
                                if (newGrid[ny][nx].isRevealed && oldCount > 0 && newCount === 0) {
                                    tilesBecomingZero.push({ x: nx, y: ny });
                                }
                            }
                        }
                    }

                    // Flood fill from any revealed tiles that just became 0
                    const floodFill = (tx: number, ty: number) => {
                        if (tx < 0 || tx >= GRID_CONFIG.COLUMNS || ty < 0 || ty >= GRID_CONFIG.ROWS) return;
                        if (newGrid[ty][tx].isRevealed || newGrid[ty][tx].isMine) return;
                        newGrid[ty][tx].isRevealed = true;
                        if (newGrid[ty][tx].neighborMines === 0) {
                            for (let dy = -1; dy <= 1; dy++) {
                                for (let dx = -1; dx <= 1; dx++) {
                                    if (dy !== 0 || dx !== 0) floodFill(tx + dx, ty + dy);
                                }
                            }
                        }
                    };

                    tilesBecomingZero.forEach(tile => {
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dy !== 0 || dx !== 0) floodFill(tile.x + dx, tile.y + dy);
                            }
                        }
                    });
                } else {
                    // No mine - just reveal normally
                    newGrid[y][x] = { ...newGrid[y][x], isRevealed: true, flag: FlagType.NONE };
                    // Check for item drops - spawn as world items with gravity
                    const depthFactor = Math.floor(y / 5);
                    const stoneChance = 0.20 + (depthFactor * 0.01);
                    const gemChance = 0.10 + (depthFactor * 0.02);
                    const coalChance = 0.15 + (depthFactor * 0.025);
                    const rand = Math.random();
                    let dropType: ItemType | null = null;
                    if (rand < stoneChance) dropType = 'STONE';
                    else if (rand < stoneChance + gemChance) dropType = 'GEM';
                    else if (rand < stoneChance + gemChance + coalChance) dropType = 'COAL';
                    else if (Math.random() < 0.1) dropType = 'COIN';

                    if (dropType) {
                        setWorldItems(prev => [...prev, {
                            id: `drop-${Date.now()}-${Math.random()}`,
                            x: x + 0.25,
                            y,
                            vy: 0,
                            type: dropType
                        }]);
                    }

                    // Flood fill if no neighbors
                    if (newGrid[y][x].neighborMines === 0) {
                        const floodFill = (tx: number, ty: number) => {
                            if (tx < 0 || tx >= GRID_CONFIG.COLUMNS || ty < 0 || ty >= GRID_CONFIG.ROWS || newGrid[ty][tx].isRevealed || newGrid[ty][tx].isMine) return;
                            newGrid[ty][tx].isRevealed = true;
                            if (newGrid[ty][tx].neighborMines === 0) {
                                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) floodFill(tx + dx, ty + dy);
                            }
                        };
                        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dy !== 0 || dx !== 0) floodFill(x + dx, y + dy);
                    }
                }
            } else {
                // No charges and tile is flagged - can't dig
                setMessage("NO DISARM CHARGES - REMOVE FLAG OR BUY KIT");
                setTimeout(() => setMessage(null), 2000);
                return; // Don't reveal
            }
        } else if (tile.isMine) {
            // Check if we're in mine collection tutorial FIRST - before any explosion
            // During MINE_COLLECT_2: intercept the attempt without exploding, prompt to flag
            if (tutorialState && tutorialState.currentStep === 'MINE_COLLECT_2' && !tutorialState.waitingForDisarm) {
                // Don't touch the grid - just trigger the flagging prompt
                if (onMineAttemptInterrupt) {
                    onMineAttemptInterrupt(x, y);
                }
                return; // Exit early - let tutorial handle it, mine stays intact
            }

            // Check if we're in mine intro tutorial (extended list) - if so, don't kill player OR explode mine!
            // Trigger tutorial dialogue instead and preserve the state so they can try again
            const mineIntroSteps: string[] = [
                'MINE_INTRO_1', 'MINE_INTRO_2', 'MINE_INTRO_3', 'MINE_INTRO_4',
                'MINE_INTRO_5', 'MINE_INTRO_6', 'MINE_INTRO_7', 'MINE_INTRO_8', 'MINE_INTRO_9',
                'MINE_EXPLAIN_NUMBERS', 'MINE_COLLECT_1', 'MINE_COLLECT_2', 'MINE_COLLECT_WAIT'
            ];

            if (tutorialState && mineIntroSteps.includes(tutorialState.currentStep) && onMineHit) {
                // Trigger screen shake and sound effect via callback
                onMineHit();

                // Also trigger visual feedback directly if needed
                const cameraShake = document.getElementById('camera-shake-layer');
                if (cameraShake) {
                    cameraShake.classList.add('animate-shake');
                    setTimeout(() => cameraShake.classList.remove('animate-shake'), 500);
                }

                return;
            }

            // Unflagged mine - explosion! Remove the mine (it exploded)
            newGrid[y][x] = { ...newGrid[y][x], isRevealed: true, isMine: false };
            // Update neighbor counts since the mine is gone
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const ny = y + dy, nx = x + dx;
                    if (ny >= 0 && ny < GRID_CONFIG.ROWS && nx >= 0 && nx < GRID_CONFIG.COLUMNS) {
                        newGrid[ny][nx] = { ...newGrid[ny][nx], neighborMines: Math.max(0, newGrid[ny][nx].neighborMines - 1) };
                    }
                }
            }
            gridRef.current = newGrid;
            setGrid(newGrid);

            // Trigger visual effects for mine explosion
            if (setScreenShake) {
                setScreenShake(1); // Trigger screen shake
                setTimeout(() => setScreenShake(0), 500); // Reset after 500ms
            }
            if (setPlayerHitFlash) {
                setPlayerHitFlash(true); // Flash player red
                setTimeout(() => setPlayerHitFlash(false), 500); // Reset after 500ms
            }

            handlePlayerDeath();
            return; // Exit early - death handled
        } else {
            // Normal tile (not flagged, not mine)
            const floodFill = (tx: number, ty: number) => {
                if (tx < 0 || tx >= GRID_CONFIG.COLUMNS || ty < 0 || ty >= GRID_CONFIG.ROWS || newGrid[ty][tx].isRevealed || newGrid[ty][tx].isMine) return;
                newGrid[ty][tx].isRevealed = true;
                if (newGrid[ty][tx].neighborMines === 0) {
                    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) floodFill(tx + dx, ty + dy);
                }
            };
            newGrid[y][x].isRevealed = true;
            if (isInitial) {
                // Drop rates - spawn as world items with gravity
                const depthFactor = Math.floor(y / 5);
                const stoneChance = 0.20 + (depthFactor * 0.01);  // 20% base, +1% per 50m
                const gemChance = 0.10 + (depthFactor * 0.02);    // 10% base, +2% per 50m
                const coalChance = 0.15 + (depthFactor * 0.025);  // 15% base, +2.5% per 50m
                const rand = Math.random();
                let dropType: ItemType | null = null;
                if (rand < stoneChance) dropType = 'STONE';
                else if (rand < stoneChance + gemChance) dropType = 'GEM';
                else if (rand < stoneChance + gemChance + coalChance) dropType = 'COAL';
                else if (Math.random() < 0.1) dropType = 'COIN';

                if (dropType) {
                    setWorldItems(prev => [...prev, {
                        id: `drop-${Date.now()}-${Math.random()}`,
                        x: x + 0.25,
                        y,
                        vy: 0,
                        type: dropType
                    }]);
                }
            }
            if (newGrid[y][x].neighborMines === 0) {
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dy !== 0 || dx !== 0) floodFill(x + dx, y + dy);
            }

            // Check if we're in mine tutorial and successfully revealed a tile - show number explanation
            if (tutorialState && tutorialState.currentStep === 'MINE_INTRO_9' && onTileRevealed) {
                onTileRevealed();
            }
        }
        gridRef.current = newGrid;
        setGrid(newGrid);
        if (y > depth) setDepth(y);
        if (y === GRID_CONFIG.ROWS - 1) setStatus(GameStatus.WON);
    }, [setDepth, setStatus, setInventory, setMessage, handlePlayerDeath, setWorldItems, tutorialState, onMineHit, onTileRevealed, onMineCollected, setScreenShake, setPlayerHitFlash, onMineAttemptInterrupt]);

    const handleFlagAction = useCallback((tx: number, ty: number, status: GameStatus, isMenuOpen: boolean) => {
        if (status !== GameStatus.PLAYING || isMenuOpen || ty < 0) return;
        setGrid(prev => {
            const newGrid = prev.map(row => row.map(t => ({ ...t })));
            if (!newGrid[ty][tx].isRevealed) {
                const wasNotFlagged = newGrid[ty][tx].flag !== FlagType.MINE;
                newGrid[ty][tx].flag = newGrid[ty][tx].flag === FlagType.MINE ? FlagType.NONE : FlagType.MINE;

                // Call tutorial callback if tile was just flagged (not unflagged)
                if (wasNotFlagged && newGrid[ty][tx].flag === FlagType.MINE && onTileFlagged) {
                    onTileFlagged(tx, ty);
                }
            }
            gridRef.current = newGrid;
            return newGrid;
        });
    }, [onTileFlagged]);

    return { grid, setGrid, gridRef, initGrid, revealTileAt, handleFlagAction, selectedTarget, setSelectedTarget };
};

