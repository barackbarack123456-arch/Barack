import React from 'react';

const TreeLines = ({ level, isLastChild }) => {
    if (level === 0) return null;

    return (
        <div
            className="absolute top-0 h-full"
            style={{ left: `${(level - 1) * 1.5 + 0.75}rem`, width: '2.25rem' }}
            aria-hidden="true"
        >
            {/* Vertical line */}
            <div
                className={`absolute top-0 left-0 w-0.5 bg-gray-300 ${isLastChild ? 'h-1/2' : 'h-full'}`}
            ></div>
            {/* Horizontal line */}
            <div
                className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-300"
            ></div>
        </div>
    );
};

export default TreeLines;
