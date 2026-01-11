import { useCallback } from 'react';
import { GameStatus, Inventory, PlayerPosition, TileState } from '../types';

export interface SaveGameData {
    version: number;
    timestamp: number;
    player: PlayerPosition;
    coins: number;
    inventory: Inventory;
    dayTime: number;
    dayCount: number;
    ropeLength: number;
    depth: number;
    grid: TileState[][];
    tutorialCompleted: boolean;
}

const SAVE_KEY = 'sweeper_bot_save';
const SAVE_VERSION = 1;

export const useSaveGame = () => {
    const hasSaveGame = useCallback((): boolean => {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (!saved) return false;
            const data = JSON.parse(saved) as SaveGameData;
            return data.version === SAVE_VERSION;
        } catch {
            return false;
        }
    }, []);

    const getSaveInfo = useCallback((): { dayCount: number; depth: number; timestamp: number } | null => {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (!saved) return null;
            const data = JSON.parse(saved) as SaveGameData;
            if (data.version !== SAVE_VERSION) return null;
            return {
                dayCount: data.dayCount,
                depth: data.depth,
                timestamp: data.timestamp,
            };
        } catch {
            return null;
        }
    }, []);

    const saveGame = useCallback((
        player: PlayerPosition,
        coins: number,
        inventory: Inventory,
        dayTime: number,
        dayCount: number,
        ropeLength: number,
        depth: number,
        grid: TileState[][],
        tutorialCompleted: boolean
    ): boolean => {
        try {
            const saveData: SaveGameData = {
                version: SAVE_VERSION,
                timestamp: Date.now(),
                player,
                coins,
                inventory,
                dayTime,
                dayCount,
                ropeLength,
                depth,
                grid,
                tutorialCompleted,
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }, []);

    const loadGame = useCallback((): SaveGameData | null => {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (!saved) return null;
            const data = JSON.parse(saved) as SaveGameData;

            // Allow loading saves from version 1 or 2, migrate as needed
            if (data.version < 1 || data.version > SAVE_VERSION) {
                console.warn('Save version incompatible, cannot load');
                return null;
            }

            // Migrate inventory fields for old saves (add defaults for new systems)
            if (!data.inventory.foundBlueprints) data.inventory.foundBlueprints = [];
            if (!data.inventory.ownedTokens) data.inventory.ownedTokens = [];
            if (!data.inventory.equippedTokens) data.inventory.equippedTokens = [];
            if (data.inventory.minesDisarmedTotal === undefined) data.inventory.minesDisarmedTotal = 0;
            // Armor system migration
            if (data.inventory.armorLevel === undefined) data.inventory.armorLevel = 0;
            if (data.inventory.armorHitsRemaining === undefined) data.inventory.armorHitsRemaining = 0;
            // Armadillo NPC migration
            if (data.inventory.armadilloIntroSeen === undefined) data.inventory.armadilloIntroSeen = false;

            return data;
        } catch (e) {
            console.error('Failed to load game:', e);
            return null;
        }
    }, []);

    const deleteSave = useCallback((): void => {
        try {
            localStorage.removeItem(SAVE_KEY);
        } catch (e) {
            console.error('Failed to delete save:', e);
        }
    }, []);

    return {
        hasSaveGame,
        getSaveInfo,
        saveGame,
        loadGame,
        deleteSave,
    };
};
