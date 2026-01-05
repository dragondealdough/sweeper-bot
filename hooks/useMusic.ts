import { useEffect, useRef, useCallback } from 'react';
import { getMusicEngine } from '../audio/MusicEngine';
import { getMenuMusicEngine } from '../audio/MenuMusicEngine';

interface UseMusicOptions {
    masterVolume: number;
    musicVolume: number;
}

export const useMusic = (options: UseMusicOptions) => {
    const gameEngineRef = useRef(getMusicEngine());
    const menuEngineRef = useRef(getMenuMusicEngine());
    const hasGameStartedRef = useRef(false);
    const hasMenuStartedRef = useRef(false);

    // Update volume when settings change
    useEffect(() => {
        const effectiveVolume = (options.masterVolume / 100) * (options.musicVolume / 100) * 100;
        gameEngineRef.current.setVolume(effectiveVolume);
        menuEngineRef.current.setVolume(effectiveVolume);
    }, [options.masterVolume, options.musicVolume]);

    const startMusic = useCallback(() => {
        // Stop menu music and start game music
        menuEngineRef.current.stop();
        hasMenuStartedRef.current = false;

        if (hasGameStartedRef.current) return;
        hasGameStartedRef.current = true;
        gameEngineRef.current.start();
    }, []);

    const stopMusic = useCallback(() => {
        hasGameStartedRef.current = false;
        gameEngineRef.current.stop();
    }, []);

    const startMenuMusic = useCallback(() => {
        // Stop game music if playing
        gameEngineRef.current.stop();
        hasGameStartedRef.current = false;

        if (hasMenuStartedRef.current) return;
        hasMenuStartedRef.current = true;
        menuEngineRef.current.start();
    }, []);

    const stopMenuMusic = useCallback(() => {
        hasMenuStartedRef.current = false;
        menuEngineRef.current.stop();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            gameEngineRef.current.stop();
            menuEngineRef.current.stop();
        };
    }, []);

    return {
        startMusic,
        stopMusic,
        startMenuMusic,
        stopMenuMusic,
        isPlaying: hasGameStartedRef.current,
        isMenuPlaying: hasMenuStartedRef.current,
    };
};
