import { useState, useEffect, useCallback } from 'react';

export interface GameSettings {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    screenShake: boolean;
    particleEffects: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
    masterVolume: 80,
    sfxVolume: 100,
    musicVolume: 70,
    screenShake: true,
    particleEffects: true,
};

const SETTINGS_KEY = 'sweeper_bot_settings';

export const useGameSettings = () => {
    const [settings, setSettings] = useState<GameSettings>(() => {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (saved) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
        return DEFAULT_SETTINGS;
    });

    // Persist settings to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }, [settings]);

    const updateSetting = useCallback(<K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
    }, []);

    return {
        settings,
        updateSetting,
        resetSettings,
    };
};
