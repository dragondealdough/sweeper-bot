import React, { useCallback, useRef, useState, useEffect } from 'react';

interface TouchButtonProps {
    keys: string[]; // Keys to simulate (e.g., ['ArrowUp', 'w'])
    className?: string;
    label?: string;
    color?: string;
    disabled?: boolean;
}

const TouchButton: React.FC<TouchButtonProps> = ({ keys, className = '', label, color = 'bg-stone-700', disabled }) => {
    const isPressed = useRef(false);
    const [active, setActive] = useState(false);

    const triggerKey = useCallback((type: 'keydown' | 'keyup') => {
        keys.forEach(key => {
            window.dispatchEvent(new KeyboardEvent(type, { key, code: key, bubbles: true }));
        });
    }, [keys]);

    const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault(); // Prevent scrolling/selecting
        if (!isPressed.current) {
            isPressed.current = true;
            setActive(true);
            triggerKey('keydown');
            if (navigator.vibrate) navigator.vibrate(10); // Haptic feedback
        }
    }, [triggerKey, disabled]);

    const handleEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault();
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
                ${color}
                ${active ? 'scale-95 brightness-125 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)]' : 'shadow-[0_4px_8px_rgba(0,0,0,0.5)] border-b-4 border-black/30 active:border-b-0 active:translate-y-1'}
                ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
            `}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onTouchStart={handleStart}
            onTouchEnd={handleEnd}
            onMouseDown={handleStart}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
        >
            {label && <span className="text-white font-black uppercase tracking-wider drop-shadow-md">{label}</span>}
        </div>
    );
};

interface TouchControlsProps {
    visible: boolean;
}

const TouchControls: React.FC<TouchControlsProps> = ({ visible }) => {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] flex flex-col justify-end pb-8 px-6 select-none touch-none">
            {/* Controls Container */}
            <div className="flex justify-between items-end w-full max-w-4xl mx-auto pointer-events-auto">

                {/* D-PAD (Left) */}
                <div className="relative w-48 h-48 bg-black/20 rounded-full backdrop-blur-sm p-2 border border-white/10 shadow-xl">
                    <div className="w-full h-full relative">
                        {/* UP */}
                        <TouchButton
                            keys={['ArrowUp', 'w', 'W']}
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-16 rounded-t-lg rounded-b-none"
                            color="bg-stone-800 border-2 border-stone-600"
                            label="▲"
                        />
                        {/* DOWN */}
                        <TouchButton
                            keys={['ArrowDown', 's', 'S']}
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-16 rounded-b-lg rounded-t-none"
                            color="bg-stone-800 border-2 border-stone-600"
                            label="▼"
                        />
                        {/* LEFT */}
                        <TouchButton
                            keys={['ArrowLeft', 'a', 'A']}
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-14 rounded-l-lg rounded-r-none"
                            color="bg-stone-800 border-2 border-stone-600"
                            label="◀"
                        />
                        {/* RIGHT */}
                        <TouchButton
                            keys={['ArrowRight', 'd', 'D']}
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-14 rounded-r-lg rounded-l-none"
                            color="bg-stone-800 border-2 border-stone-600"
                            label="▶"
                        />
                        {/* Center Decor */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-900 border border-stone-700 shadow-inner" />
                    </div>
                </div>

                {/* ACTION BUTTONS (Right) */}
                <div className="relative w-48 h-48">
                    {/* Interact (Green) - Bottom */}
                    <TouchButton
                        keys={['e', 'E', 'Enter']}
                        className="absolute bottom-0 right-1/2 translate-x-1/2 w-20 h-20 shadow-lg border-2 border-green-400/50"
                        color="bg-green-600"
                        label="E"
                    />

                    {/* Mine/Space (Blue) - Left */}
                    <TouchButton
                        keys={[' ']}
                        className="absolute bottom-12 left-0 w-24 h-24 shadow-xl border-2 border-blue-400/50 z-10"
                        color="bg-blue-600"
                        label="⛏️"
                    />

                    {/* Flag (Red) - Top Right */}
                    <TouchButton
                        keys={['z', 'Z']}
                        className="absolute top-0 right-0 w-16 h-16 shadow-lg border-2 border-red-400/50"
                        color="bg-red-600"
                        label="🚩"
                    />
                </div>
            </div>
        </div>
    );
};

export default TouchControls;
