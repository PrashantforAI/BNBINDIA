import React from 'react';

const BackButton: React.FC<{ onClick?: () => void; className?: string }> = ({ onClick, className }) => {
    const goBack = () => {
        if (onClick) {
            onClick();
        } else {
            window.history.back();
        }
    };

    return (
        <button
            onClick={goBack}
            className={`flex items-center space-x-2 text-gray-300 hover:text-gray-50 transition-colors font-semibold ${className}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Back</span>
        </button>
    );
};

export default BackButton;