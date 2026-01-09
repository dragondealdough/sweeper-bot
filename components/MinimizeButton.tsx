import React from 'react';

interface MinimizeButtonProps {
    onClick: () => void;
    title?: string;
}

/**
 * Isolated minimize button component for tutorial task popups.
 * Extracted to prevent accidental breakage during TutorialMessageDisplay edits.
 */
const MinimizeButton: React.FC<MinimizeButtonProps> = ({ onClick, title = "Minimize task" }) => (
    <button
        onClick={onClick}
        className="bg-white hover:bg-gray-200 text-black font-bold w-5 h-5 rounded-full text-[10px] flex items-center justify-center transition-colors"
        title={title}
    >
        −
    </button>
);

export default MinimizeButton;
