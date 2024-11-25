import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'map';
}

export default function LoadingSkeleton({ type = 'card' }: LoadingSkeletonProps) {
  if (type === 'map') {
    return (
      <div className="h-full w-full bg-gray-100 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-4 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="h-40 bg-gray-200 rounded-lg"></div>
        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
      </div>
      <div className="mt-4 flex justify-between">
        <div className="h-8 w-24 bg-gray-200 rounded"></div>
        <div className="h-8 w-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}