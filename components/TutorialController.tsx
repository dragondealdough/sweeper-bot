import React, { useEffect, useRef } from 'react';
import { useTutorial } from '../hooks/useTutorial';

interface TutorialControllerProps {
    tutorial: ReturnType<typeof useTutorial>;
}

/**
 * Manages the timing of the initial tutorial start.
 * We move this out of the hook to ensure it correctly restarts every time the game component mounts.
 */
const TutorialController: React.FC<TutorialControllerProps> = ({ tutorial }) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Only start if not already started and not completed
        if (tutorial.tutorialState.tutorialCompleted || tutorial.hasStarted) return;

        // Wait 1.5s before showing the first message
        timeoutRef.current = setTimeout(() => {
            tutorial.startTutorial();
        }, 1500);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []); // Run once on mount

    return null;
};

export default TutorialController;
