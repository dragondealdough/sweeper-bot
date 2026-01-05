import React, { useRef, useState, useCallback, useEffect } from 'react';

interface VirtualJoystickProps {
    size?: number; // Diameter of the joystick base
    className?: string;
}

/**
 * A virtual analog stick that simulates KeyDown/KeyUp events for Arrow keys & WASD.
 * Supports diagonal movement.
 */
const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ size = 160, className = '' }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
    const [isActive, setIsActive] = useState(false);

    // Internal state to track which keys are currently "pressed" to avoid spamming events
    // and to ensure we send KeyUp when a direction is released.
    const activeKeysRef = useRef<Set<string>>(new Set());

    // Sensitivity threshold (pixels from center) to trigger movement
    const THRESHOLD = size * 0.15;

    // Helper to simulate key events
    const triggerKey = useCallback((key: string, type: 'keydown' | 'keyup') => {
        const code = key === 'ArrowUp' ? 'ArrowUp' :
            key === 'ArrowDown' ? 'ArrowDown' :
                key === 'ArrowLeft' ? 'ArrowLeft' :
                    key === 'ArrowRight' ? 'ArrowRight' : key;

        // Also fire WASD equivalents for broad compatibility
        const wasdMap: Record<string, string> = {
            'ArrowUp': 'w',
            'ArrowDown': 's',
            'ArrowLeft': 'a',
            'ArrowRight': 'd'
        };

        const event = new KeyboardEvent(type, {
            key: key,
            code: code,
            bubbles: true,
            cancelable: true,
        });
        window.dispatchEvent(event);

        const wasdKey = wasdMap[key];
        if (wasdKey) {
            const wasdEvent = new KeyboardEvent(type, {
                key: wasdKey,
                code: `Key${wasdKey.toUpperCase()}`,
                bubbles: true,
                cancelable: true,
            });
            window.dispatchEvent(wasdEvent);
        }

    }, []);

    // Update keys based on joystick position
    const updateKeys = useCallback((x: number, y: number) => {
        const newActiveKeys = new Set<string>();

        // We use a simpler 8-way (or 4-way overlapping) logic
        // UP: y < -threshold
        // DOWN: y > threshold
        // LEFT: x < -threshold
        // RIGHT: x > threshold

        if (y < -THRESHOLD) newActiveKeys.add('ArrowUp');
        if (y > THRESHOLD) newActiveKeys.add('ArrowDown');
        if (x < -THRESHOLD) newActiveKeys.add('ArrowLeft');
        if (x > THRESHOLD) newActiveKeys.add('ArrowRight');

        // Diff against activeKeysRef to send updates
        // 1. Keys that are NO LONGER active -> KeyUp
        activeKeysRef.current.forEach(key => {
            if (!newActiveKeys.has(key)) {
                triggerKey(key, 'keyup');
            }
        });

        // 2. Keys that are NEWLY active -> KeyDown
        newActiveKeys.forEach(key => {
            if (!activeKeysRef.current.has(key)) {
                triggerKey(key, 'keydown');
            }
        });

        activeKeysRef.current = newActiveKeys;
    }, [THRESHOLD, triggerKey]);

    // Cleanup on unmount or touch end
    const releaseAll = useCallback(() => {
        activeKeysRef.current.forEach(key => {
            triggerKey(key, 'keyup');
        });
        activeKeysRef.current.clear();
    }, [triggerKey]);

    const handleTouch = useCallback((clientX: number, clientY: number) => {
        if (!wrapperRef.current) return;

        const rect = wrapperRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = size / 2;

        let finalX = dx;
        let finalY = dy;

        // Clamp to circle
        if (distance > radius) {
            const angle = Math.atan2(dy, dx);
            finalX = Math.cos(angle) * radius;
            finalY = Math.sin(angle) * radius;
        }

        setKnobPosition({ x: finalX, y: finalY });
        updateKeys(finalX, finalY);
    }, [size, updateKeys]);

    const onTouchStart = (e: React.TouchEvent) => {
        e.preventDefault(); // Prevent scroll
        setIsActive(true);
        handleTouch(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isActive) return;
        e.preventDefault();
        handleTouch(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        e.preventDefault();
        setIsActive(false);
        setKnobPosition({ x: 0, y: 0 });
        releaseAll();
    };

    return (
        <div
            ref={wrapperRef}
            className={`virtual-joystick relative rounded-full backdrop-blur-md shadow-2xl touch-none select-none ${className}`}
            style={{
                width: size,
                height: size,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isActive ? '0 0 20px rgba(255, 255, 255, 0.1)' : 'none',
                transition: 'box-shadow 0.2s ease',
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
        >
            {/* Inner Knob */}
            <div
                className="absolute rounded-full shadow-lg"
                style={{
                    width: size * 0.4,
                    height: size * 0.4,
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(200,200,200,1))',
                    top: '50%',
                    left: '50%',
                    marginTop: -(size * 0.4) / 2,
                    marginLeft: -(size * 0.4) / 2,
                    transform: `translate(${knobPosition.x}px, ${knobPosition.y}px)`,
                    transition: isActive ? 'none' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Snap back
                    pointerEvents: 'none', // Pass touches to parent
                }}
            />
            {/* Center Indication */}
            <div
                className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 pointer-events-none"
            />
        </div>
    );
};

export default VirtualJoystick;
