import { useState, useEffect } from 'react';

export const useDeviceDetection = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isLandscape, setIsLandscape] = useState(true);

    useEffect(() => {
        const checkMobile = () => {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            // A generous width check, but touch is the main indicator
            const isSmallScreen = window.innerWidth <= 1024;

            // We consider it mobile if it has touch AND isn't a massive desktop touchscreen monitor (heuristic)
            // Or if the user agent explicitly says so
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

            setIsMobile(hasTouch && (isSmallScreen || isMobileUA));
            setIsLandscape(window.innerWidth > window.innerHeight);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        window.addEventListener('orientationchange', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('orientationchange', checkMobile);
        };
    }, []);

    return { isMobile, isLandscape };
};
