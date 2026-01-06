import { useState, useRef, useCallback, useEffect } from 'react';

export const useTypingEffect = (text: string, speed: number = 30) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const skip = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setDisplayedText(text);
        setIsComplete(true);
    }, [text]);

    useEffect(() => {
        if (!text) {
            setDisplayedText('');
            setIsComplete(false);
            return;
        }

        setDisplayedText('');
        setIsComplete(false);
        let currentIndex = 0;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // For very fast speeds, type multiple characters per interval
        const charsPerInterval = speed <= 1 ? 2 : 1;

        intervalRef.current = setInterval(() => {
            if (currentIndex < text.length) {
                const nextIndex = Math.min(currentIndex + charsPerInterval, text.length);
                setDisplayedText(text.slice(0, nextIndex));
                currentIndex = nextIndex;
                if (currentIndex >= text.length) {
                    setIsComplete(true);
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                }
            } else {
                setIsComplete(true);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }
        }, speed);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [text, speed]);

    return { displayedText, isComplete, skip };
};
