import React, { useCallback, useRef, useState } from 'react';
import VirtualJoystick from './VirtualJoystick';

interface TouchButtonProps {
    keys: string[]; // Keys to simulate (e.g., ['ArrowUp', 'w'])
    className?: string;
    label?: string; // Optional text label
    icon?: React.ReactNode; // Optional icon
    color?: string;
    disabled?: boolean;
    size?: string; // Tailwind size classes (e.g. w-20 h-20)
    style?: React.CSSProperties; // Inline styles (for absolute positioning)
}

const TouchButton: React.FC<TouchButtonProps> = ({
    keys,
    className = '',
    label,
    icon,
    color = 'bg-stone-700',
    disabled,
    size = 'w-16 h-16',
    style
}) => {
    const isPressed = useRef(false);
    const [active, setActive] = useState(false);

    const triggerKey = useCallback((type: 'keydown' | 'keyup') => {
        keys.forEach(key => {
            const code = key === ' ' ? 'Space' : key === 'Enter' ? 'Enter' : `Key${key.toUpperCase()}`;
            window.dispatchEvent(new KeyboardEvent(type, { key, code, bubbles: true }));
        });
    }, [keys]);

    const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault(); // Prevent scrolling/selecting
        e.stopPropagation(); // Avoid ghost clicks
        if (!isPressed.current) {
            isPressed.current = true;
            setActive(true);
            triggerKey('keydown');
            if (navigator.vibrate) navigator.vibrate(15); // Haptic feedback
        }
    }, [triggerKey, disabled]);

    const handleEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        if (isPressed.current) {
            isPressed.current = false;
            setActive(false);
            triggerKey('keyup');
        }
    }, [triggerKey, disabled]);

    return (
        <div
            className={`
                relative rounded-full flex items-center justify-center select-none touch-none transition-transform
                ${className}
                ${size}
                ${color}
                ${active ? 'scale-95 brightness-110 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]' : 'shadow-[0_4px_10px_rgba(0,0,0,0.4)] border-b-4 border-black/20 active:border-b-0 active:translate-y-1'}
                ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
            `}
            style={{ ...style, WebkitTapHighlightColor: 'transparent' }}
            onTouchStart={handleStart}
            onTouchEnd={handleEnd}
            onMouseDown={handleStart}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
        >
            {icon ? (
                <span className="text-white drop-shadow-md text-2xl">{icon}</span>
            ) : (
                label && <span className="text-white font-black uppercase tracking-wider drop-shadow-md text-lg">{label}</span>
            )}
        </div>
    );
};

interface TouchControlsProps {
    visible: boolean;
    opacity?: number;
}

const TouchControls: React.FC<TouchControlsProps> = ({ visible, opacity = 0.7 }) => {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] flex flex-col justify-end select-none touch-none overflow-hidden" style={{ opacity }}>

            {/* Controls Container - Pushed properly to edges for landscape ergonomics */}
            <div className="flex justify-between items-end w-full h-full pointer-events-none">

                {/* LEFT: Virtual Joystick - Needs events */}
                <div className="relative w-1/3 h-full flex items-end justify-start pb-2 pl-2 pointer-events-auto">
                    <VirtualJoystick size={150} className="opacity-80 hover:opacity-100 transition-opacity" />
                </div>

                {/* RIGHT: Action Cluster (Vertical Edge Stack) - Escaping parent padding with fixed positioning */}
                {/* Note: This container is already fixed and pointer-events-none, with children auto */}
                <div className="fixed bottom-0 right-0 w-32 h-screen pointer-events-none flex flex-col justify-end items-end pb-8 pr-6 gap-6 z-[101]">

                    {/* 3. Utility Action: FLAG / Z (Top) */}
                    <div className="pointer-events-auto">
                        <TouchButton
                            keys={['z']}
                            size="w-14 h-14"
                            color="bg-red-600 border-2 border-red-400/30"
                            icon="🚩"
                        />
                    </div>

                    {/* 2. Secondary Action: INTERACT / HAND (Middle) */}
                    <div className="pointer-events-auto">
                        <TouchButton
                            keys={['e']}
                            size="w-16 h-16"
                            color="bg-green-600 border-2 border-green-400/30"
                            icon="✋"
                        />
                    </div>

                    {/* 1. Primary Action: MINE / SPACE (Bottom) */}
                    <div className="pointer-events-auto">
                        <TouchButton
                            keys={[' ']}
                            size="w-20 h-20"
                            color="bg-blue-600 border-2 border-blue-400/30"
                            icon="⛏️"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TouchControls;
