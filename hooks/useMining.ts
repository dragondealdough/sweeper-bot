
import React, { useState, useCallback, useRef } from 'react';
import { TileState, FlagType, GameStatus, Inventory, WorldItem, ItemType } from '../types';
import { GRID_CONFIG, INITIAL_ROPE_LENGTH, SAFE_ROWS, CARD_DEFINITIONS } from '../constants';
import { TutorialState } from './useTutorial';

import { DIRECTIONS, TUTORIAL_MESSAGES, CHARGES_PER_KIT, TOKEN_DEFINITIONS } from '../constants';
import { TokenId } from '../types';

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

    // Blueprint drop helper - rolls for each unfound blueprint
    const tryDropBlueprint = useCallback((inventory: Inventory) => {
        const tokenIds = Object.keys(TOKEN_DEFINITIONS) as TokenId[];
        for (const tokenId of tokenIds) {
            // Skip if already found
            if (inventory.foundBlueprints.includes(tokenId)) continue;

            const def = TOKEN_DEFINITIONS[tokenId];
            const dropChance = def.baseDropChance + (inventory.minesDisarmedTotal * def.dropChancePerDisarm);

            if (Math.random() < dropChance) {
                // Blueprint found!
                setMessage(`📜 BLUEPRINT FOUND: ${def.name}!`);
                setTimeout(() => setMessage(null), 3000);
                setInventory(prev => ({
                    ...prev,
                    foundBlueprints: [...prev.foundBlueprints, tokenId]
                }));
                return; // Only one blueprint per tile
            }
        }
    }, [setMessage, setInventory]);

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
        } else if (tile.isDisarmed) {
            // Tile was disarmed when flagged - safely reveal without any explosion risk
            // Charges were already consumed when the flag was placed
            const isMine = tile.isMine;

            if (isMine) {
                // Was a mine - collect it safely
                setMessage("+1 DEFUSED MINE 💣");
                setTimeout(() => setMessage(null), 1500);

                setInventory(prev => ({
                    ...prev,
                    defusedMines: prev.defusedMines + 1,
                    minesDisarmedTotal: prev.minesDisarmedTotal + 1
                }));

                // Reveal tile and remove mine status
                newGrid[y][x] = { ...newGrid[y][x], isRevealed: true, isMine: false, flag: FlagType.NONE, isDisarmed: false };

                // Trigger tutorial callback if mine was collected
                if (onMineCollected) {
                    onMineCollected();
                }

                // Update neighbor counts since the mine is gone
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
                // No mine - just reveal normally (disarm was a false positive but that's okay)
                newGrid[y][x] = { ...newGrid[y][x], isRevealed: true, flag: FlagType.NONE, isDisarmed: false };

                // Check for item drops
                const depthFactor = Math.floor(y / 5);
                const hasStoneToken = inventory.equippedTokens.includes('STONE_TOKEN');
                const stoneChance = (0.20 + (depthFactor * 0.01)) * (hasStoneToken ? 1.2 : 1.0);
                const silverChance = 0.15 + (depthFactor * 0.008);  // 15% base, slightly rarer than stone
                const gemChance = 0.10 + (depthFactor * 0.02);
                const coalChance = 0.15 + (depthFactor * 0.025);
                const rand = Math.random();
                let dropType: ItemType | null = null;
                if (rand < stoneChance) dropType = 'STONE';
                else if (rand < stoneChance + silverChance) dropType = 'SILVER';
                else if (rand < stoneChance + silverChance + gemChance) dropType = 'GEM';
                else if (rand < stoneChance + silverChance + gemChance + coalChance) dropType = 'COAL';
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
        } else if (tile.flag === FlagType.MINE && !tile.isDisarmed) {
            // Has flag but NOT disarmed - this shouldn't happen in normal play since 
            // flagging now always sets isDisarmed. But handle edge case: treat as unable to dig.
            setMessage("FLAG NOT DISARMED - REFLAG TILE");
            setTimeout(() => setMessage(null), 2000);
            return; // Don't reveal
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

            // Check if we're in mine intro tutorial (extended list) - if so, don't kill player but DO explode the mine!
            // The tile should be revealed/destroyed, just no death sequence
            const mineIntroSteps: string[] = [
                'MINE_INTRO_1', 'MINE_INTRO_2', 'MINE_INTRO_3', 'MINE_INTRO_4',
                'MINE_INTRO_5', 'MINE_INTRO_6', 'MINE_INTRO_7', 'MINE_INTRO_8', 'MINE_INTRO_9',
                'MINE_EXPLAIN_NUMBERS', 'MINE_COLLECT_1', 'MINE_COLLECT_WAIT'
            ];

            if (tutorialState && mineIntroSteps.includes(tutorialState.currentStep) && onMineHit) {
                // Tutorial mode: Reveal and destroy the mine tile, but don't trigger death
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

                // Trigger tutorial dialogue and visual effects
                onMineHit();
                return; // Exit early - tutorial handled it, no death
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

            // Check if we're in tutorial mine phase - don't trigger death, just show tutorial
            const tutorialMinePhases = [
                'MINE_INTRO_1', 'MINE_INTRO_2', 'MINE_INTRO_3', 'MINE_INTRO_4',
                'MINE_INTRO_5', 'MINE_INTRO_6', 'MINE_INTRO_7', 'MINE_INTRO_8', 'MINE_INTRO_9',
                'MINE_HIT_MINE_1', 'MINE_HIT_MINE_2', 'MINE_EXPLAIN_NUMBERS',
                'MINE_COLLECT_1', 'MINE_COLLECT_2', 'MINE_COLLECT_WAIT'
            ];
            const isInTutorialMine = tutorialState?.isActive && tutorialMinePhases.includes(tutorialState.currentStep);

            if (isInTutorialMine && onMineHit) {
                // Tutorial handles the mine hit - no death
                onMineHit();
            } else {
                // Check if armor can absorb the hit
                if (inventory.armorHitsRemaining > 0) {
                    // Armor absorbs the hit!
                    setInventory(prev => ({ ...prev, armorHitsRemaining: prev.armorHitsRemaining - 1 }));
                    setMessage("🛡️ ARMOR ABSORBED THE HIT!");
                    setScreenShake(8);
                    setPlayerHitFlash(true);
                    setTimeout(() => setPlayerHitFlash(false), 300);
                    setTimeout(() => setMessage(null), 2000);
                    // Don't die - armor saved us
                } else {
                    // Normal game - trigger death sequence
                    handlePlayerDeath();
                }
            }
            return; // Exit early - mine hit handled
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
                const hasStoneToken = inventory.equippedTokens.includes('STONE_TOKEN');
                const stoneChance = (0.20 + (depthFactor * 0.01)) * (hasStoneToken ? 1.2 : 1.0);  // 20% base, +1% per 50m, +20% if token
                const silverChance = 0.15 + (depthFactor * 0.008);  // 15% base, slightly rarer than stone
                const gemChance = 0.10 + (depthFactor * 0.02);    // 10% base, +2% per 50m
                const coalChance = 0.15 + (depthFactor * 0.025);  // 15% base, +2.5% per 50m
                const rand = Math.random();
                let dropType: ItemType | null = null;
                if (rand < stoneChance) dropType = 'STONE';
                else if (rand < stoneChance + silverChance) dropType = 'SILVER';
                else if (rand < stoneChance + silverChance + gemChance) dropType = 'GEM';
                else if (rand < stoneChance + silverChance + gemChance + coalChance) dropType = 'COAL';
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

        // Roll for blueprint drop on successful tile reveal
        tryDropBlueprint(inventory);
    }, [setDepth, setStatus, setInventory, setMessage, handlePlayerDeath, setWorldItems, tutorialState, onMineHit, onTileRevealed, onMineCollected, setScreenShake, setPlayerHitFlash, onMineAttemptInterrupt, tryDropBlueprint]);

    const handleFlagAction = useCallback((tx: number, ty: number, status: GameStatus, isMenuOpen: boolean) => {
        if (status !== GameStatus.PLAYING || isMenuOpen || ty < 0) return;

        const tile = gridRef.current[ty]?.[tx];
        if (!tile || tile.isRevealed) return; // Can't flag revealed tiles

        // If already flagged, allow unflagging (no refund)
        if (tile.flag === FlagType.MINE) {
            setGrid(prev => {
                const newGrid = prev.map(row => row.map(t => ({ ...t })));
                newGrid[ty][tx].flag = FlagType.NONE;
                // Note: isDisarmed stays true - the mine is still safe even after removing flag
                gridRef.current = newGrid;
                return newGrid;
            });
            return;
        }

        // If already disarmed but no flag (shouldn't happen normally), just add flag visually
        if (tile.isDisarmed) {
            setGrid(prev => {
                const newGrid = prev.map(row => row.map(t => ({ ...t })));
                newGrid[ty][tx].flag = FlagType.MINE;
                gridRef.current = newGrid;
                return newGrid;
            });
            return;
        }

        // Read current inventory state synchronously via ref workaround
        // We need to check if we can place a flag before doing it
        // Use a ref to track the inventory state internally
        let canPlaceFlag = false;

        setInventory(prev => {
            let newCharges = prev.disarmCharges;
            let newKits = prev.disarmKits;

            // Check if we have charges or can equip a new kit
            if (newCharges === 0 && newKits > 0) {
                newKits -= 1;
                newCharges = CHARGES_PER_KIT;
                setMessage("NEW KIT EQUIPPED");
                setTimeout(() => setMessage(null), 1500);
            }

            if (newCharges === 0) {
                // Check if we're in tutorial mine phase - provide safety net
                const tutorialMinePhases = [
                    'MINE_INTRO_1', 'MINE_INTRO_2', 'MINE_INTRO_3', 'MINE_INTRO_4',
                    'MINE_INTRO_5', 'MINE_INTRO_6', 'MINE_INTRO_7', 'MINE_INTRO_8', 'MINE_INTRO_9',
                    'MINE_HIT_MINE_1', 'MINE_HIT_MINE_2', 'MINE_EXPLAIN_NUMBERS',
                    'MINE_COLLECT_1', 'MINE_COLLECT_2', 'MINE_COLLECT_WAIT'
                ];
                const isInTutorialMine = tutorialState?.isActive && tutorialMinePhases.includes(tutorialState.currentStep);

                if (isInTutorialMine) {
                    // Tutorial safety net - replenish charges with helpful message
                    newCharges = CHARGES_PER_KIT;
                    setMessage("Oops! Let me give you more charges. Try to flag the actual mine!");
                    setTimeout(() => setMessage(null), 3000);
                    // Don't consume a charge this time - give them a fresh start
                    return {
                        ...prev,
                        disarmCharges: newCharges,
                    };
                }

                // No charges available (non-tutorial)
                setMessage("NO DISARM CHARGES - BUY MORE KITS!");
                setTimeout(() => setMessage(null), 2000);
                canPlaceFlag = false;
                return prev; // Don't modify inventory
            }

            // Consume a charge
            newCharges -= 1;
            canPlaceFlag = true;

            // Auto-equip new kit if charges are now empty
            if (newCharges === 0 && newKits > 0) {
                newKits -= 1;
                newCharges = CHARGES_PER_KIT;
                setTimeout(() => {
                    setMessage("KIT EMPTY - NEW KIT EQUIPPED (" + newKits + " remaining)");
                    setTimeout(() => setMessage(null), 1500);
                }, 500);
            } else if (newCharges === 0 && newKits === 0) {
                setTimeout(() => {
                    setMessage("WARNING: NO DISARM KITS LEFT!");
                    setTimeout(() => setMessage(null), 2000);
                }, 500);
            }

            return {
                ...prev,
                disarmCharges: newCharges,
                disarmKits: newKits
            };
        });

        // Place the flag after inventory update - use setTimeout to defer to next tick
        // This ensures the inventory update completes first
        setTimeout(() => {
            if (canPlaceFlag) {
                setGrid(prevGrid => {
                    const newGrid = prevGrid.map(row => row.map(t => ({ ...t })));
                    // Double-check the tile isn't already flagged (race condition guard)
                    if (newGrid[ty][tx].flag === FlagType.MINE) {
                        return prevGrid; // Already flagged, don't change
                    }
                    newGrid[ty][tx].flag = FlagType.MINE;
                    newGrid[ty][tx].isDisarmed = true;
                    gridRef.current = newGrid;

                    // Call tutorial callback if tile was just flagged
                    if (onTileFlagged) {
                        onTileFlagged(tx, ty);
                    }

                    return newGrid;
                });
            }
        }, 0);
    }, [onTileFlagged, setInventory, setMessage]);

    return { grid, setGrid, gridRef, initGrid, revealTileAt, handleFlagAction, selectedTarget, setSelectedTarget };
};

