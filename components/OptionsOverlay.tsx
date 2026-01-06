import React, { useEffect, useState } from 'react';
import { GameSettings } from '../hooks/useGameSettings';

interface OptionsOverlayProps {
    settings: GameSettings;
    onUpdateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
    onResetSettings: () => void;
    onClose: () => void;
}

const OptionsOverlay: React.FC<OptionsOverlayProps> = ({
    settings,
    onUpdateSetting,
    onResetSettings,
    onClose,
}) => {
    const [activeTab, setActiveTab] = useState<'audio' | 'graphics' | 'controls'>('audio');

    // ESC to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const VolumeSlider: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({
        label,
        value,
        onChange,
    }) => (
        <div className="flex items-center justify-between gap-4 mb-4">
            <label className="text-stone-300 text-sm uppercase tracking-wider w-32">{label}</label>
            <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="flex-1 h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
            <span className="text-yellow-500 font-bold w-12 text-right">{value}%</span>
        </div>
    );

    const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({
        label,
        value,
        onChange,
    }) => (
        <div className="flex items-center justify-between mb-4">
            <label className="text-stone-300 text-sm uppercase tracking-wider">{label}</label>
            <button
                onClick={() => onChange(!value)}
                className={`w-14 h-8 rounded-full transition-colors ${value ? 'bg-yellow-500' : 'bg-stone-700'
                    } relative`}
            >
                <div
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${value ? 'translate-x-7' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );

    const ControlRow: React.FC<{ action: string; keys: string }> = ({ action, keys }) => (
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-stone-800">
            <span className="text-stone-300 text-sm">{action}</span>
            <span className="text-yellow-500 font-mono text-sm">{keys}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-stone-900 border-2 border-yellow-500/50 rounded-lg shadow-2xl w-full max-w-lg mx-4">
                {/* Header */}
                <div className="border-b border-stone-800 p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-yellow-500 uppercase tracking-wider">Options</h2>
                    <button
                        onClick={onClose}
                        className="text-stone-500 hover:text-white transition-colors text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-800">
                    {(['audio', 'graphics', 'controls'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-sm uppercase tracking-wider transition-colors ${activeTab === tab
                                ? 'text-yellow-500 border-b-2 border-yellow-500 bg-stone-800/50'
                                : 'text-stone-500 hover:text-stone-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'audio' && (
                        <div>
                            <VolumeSlider
                                label="Master"
                                value={settings.masterVolume}
                                onChange={(v) => onUpdateSetting('masterVolume', v)}
                            />
                            <VolumeSlider
                                label="Sound FX"
                                value={settings.sfxVolume}
                                onChange={(v) => onUpdateSetting('sfxVolume', v)}
                            />
                            <VolumeSlider
                                label="Music"
                                value={settings.musicVolume}
                                onChange={(v) => onUpdateSetting('musicVolume', v)}
                            />
                            <p className="text-stone-600 text-xs mt-4 italic">
                                Sound FX coming soon
                            </p>
                        </div>
                    )}

                    {activeTab === 'graphics' && (
                        <div>
                            <Toggle
                                label="Screen Shake"
                                value={settings.screenShake}
                                onChange={(v) => onUpdateSetting('screenShake', v)}
                            />
                            <Toggle
                                label="Particle Effects"
                                value={settings.particleEffects}
                                onChange={(v) => onUpdateSetting('particleEffects', v)}
                            />
                        </div>
                    )}

                    {activeTab === 'controls' && (
                        <div>
                            <ControlRow action="Move" keys="W A S D / Arrow Keys" />
                            <ControlRow action="Interact" keys="E" />
                            <ControlRow action="Dig" keys="Spacebar" />
                            <ControlRow action="Flag Mine" keys="Z / X" />
                            <ControlRow action="Inventory" keys="I" />
                            <ControlRow action="Jump" keys="W / Up Arrow" />

                            <div className="mt-6 pt-6 border-t border-stone-800">
                                <h3 className="text-stone-400 text-xs uppercase tracking-widest mb-4">Touch Controls</h3>
                                <VolumeSlider
                                    label="Button Opacity"
                                    value={settings.controlOpacity}
                                    onChange={(v) => onUpdateSetting('controlOpacity', Math.max(10, v))}
                                />
                                <p className="text-stone-600 text-xs italic">Minimum visibility is 10%</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-stone-800 p-4 flex justify-between">
                    <button
                        onClick={onResetSettings}
                        className="px-4 py-2 text-stone-500 hover:text-white text-sm uppercase tracking-wider transition-colors"
                    >
                        Reset Defaults
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm uppercase tracking-wider rounded transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OptionsOverlay;
