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
            if (data.version !== SAVE_VERSION) {
                console.warn('Save version mismatch, cannot load');
                return null;
            }
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
