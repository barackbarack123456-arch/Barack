import React from 'react';

const SkeletonRow = () => (
  <div className="flex items-center justify-between p-4 border-b border-gray-200">
    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    <div className="h-4 bg-gray-300 rounded w-1/6"></div>
  </div>
);

const GridSkeletonLoader = ({ rows = 5 }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg animate-pulse">
      {/* Skeleton Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-gray-300">
        <div className="h-5 bg-gray-400 rounded w-1/4"></div>
        <div className="h-5 bg-gray-400 rounded w-1/2"></div>
        <div className="h-5 bg-gray-400 rounded w-1/6"></div>
      </div>

      {/* Skeleton Body */}
      <div>
        {[...Array(rows)].map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
};

export default GridSkeletonLoader;
