import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, className = '', size = 'md' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div
        className={`animate-spin rounded-full ${sizeMap[size]} border-t-2 border-b-2 border-primary`}
        aria-label="Loading"
        role="status"
      />
      {message ? (
        <p className="mt-4 text-sm text-muted-foreground text-center">{message}</p>
      ) : null}
    </div>
  );
};

export default LoadingSpinner;
