import React, { useEffect, useState } from 'react';
import { useTypingEffect } from '../hooks/useTypingEffect';
import { TutorialMessage } from '../hooks/useTutorial';

interface TutorialMessageDisplayProps {
    message: TutorialMessage;
    onAdvance: () => void;
    renderText?: (text: string) => React.ReactNode;
    isTaskStep?: boolean;
    onMinimize?: () => void;
}

const TutorialMessageDisplay: React.FC<TutorialMessageDisplayProps> = ({
    message,
    onAdvance,
    renderText,
    isTaskStep = false,
    onMinimize
}) => {
    const { displayedText, isComplete, skip } = useTypingEffect(message.text, 2);

    // Anti-spam: enforce 1s delay before interaction is allowed
    const [canInteract, setCanInteract] = useState(false);
    useEffect(() => {
        setCanInteract(false);
        const timer = setTimeout(() => setCanInteract(true), 1000);
        return () => clearTimeout(timer);
    }, [message]);

    // Only show button when typing is complete AND we've displayed the full current message
    // AND interaction delay has passed
    const shouldShowButton = isComplete && displayedText === message.text && canInteract && !isTaskStep;

    // Handle E key / Enter / Space: skip typing animation if in progress, otherwise advance
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'e' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isComplete) {
                    // Skip the typing animation
                    skip();
                } else if (shouldShowButton) {
                    // Only advance if interaction is allowed
                    onAdvance();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isComplete, skip, onAdvance, shouldShowButton]);

    return (
        <div className="fixed inset-x-0 bottom-8 z-[160] flex justify-center pointer-events-none px-4">
            <div className="pointer-events-auto max-w-lg w-full">
                {/* key added to force re-mount on message change, preventing stale state */}
                <div key={message.text} className={`relative bg-stone-900/95 border-2 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.2)] p-4 ${isTaskStep ? 'border-white' : 'border-amber-500'}`}>
                    {/* Character indicator with minimize button for task steps */}
                    <div className="absolute -top-2.5 left-4 flex items-center gap-1">
                        <div className={`px-2 py-0.5 rounded-full ${isTaskStep ? 'bg-white' : 'bg-amber-500'}`}>
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isTaskStep ? 'text-black' : 'text-black'}`}>
                                {isTaskStep ? '❗ Task' : (message.character === 'narrator' ? '📖 Guide' : '🤖 Unit 734')}
                            </span>
                        </div>
                        {/* Minimize button for task steps */}
                        {isTaskStep && onMinimize && (
                            <button
                                onClick={onMinimize}
                                className="bg-white hover:bg-gray-200 text-black font-bold w-5 h-5 rounded-full text-[10px] flex items-center justify-center transition-colors"
                                title="Minimize task"
                            >
                                −
                            </button>
                        )}
                    </div>

                    <p className="text-sm text-white font-medium leading-relaxed mt-1 min-h-[3rem]">
                        {renderText ? renderText(displayedText) : displayedText}
                        {!isComplete && <span className="inline-block w-1 h-4 bg-amber-500 ml-1 animate-pulse">|</span>}
                    </p>

                    <div className={`flex justify-end mt-3 pt-2 border-t border-stone-700/50 transition-opacity duration-300 ${shouldShowButton ? 'opacity-100' : 'opacity-0'}`}>
                        <button
                            onClick={shouldShowButton ? onAdvance : undefined}
                            className={`bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${shouldShowButton ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            {message.buttonText}
                            <span className="text-[10px] opacity-70">[E]</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialMessageDisplay;

