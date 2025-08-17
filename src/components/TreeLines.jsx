import React from 'react';

const TreeLines = ({ level, isLastChild }) => {
    if (level === 0) return null;

    return (
        <div
            className="absolute top-0 h-full"
            style={{ left: `${(level - 1) * 1.5 + 0.75}rem`, width: '2.25rem' }}
            aria-hidden="true"
        >
            <div
                className={`h-full w-0.5 bg-gray-300 ${isLastChild ? 'h-1/2' : 'h-full'
                    }`}
            ></div>
            <div className="absolute top-1/2 w-full h-0.5 bg-gray-300"></div>
        </div>
    );
};

export default TreeLines;
