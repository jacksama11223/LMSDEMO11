
import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 6 }) => {
  const sizeRem = size * 0.25;
  const borderSize = Math.max(2, Math.floor(size / 4));
  return (
    <div
      className={`animate-spin rounded-full border-t-transparent border-solid`}
      style={{
        width: `${sizeRem}rem`,
        height: `${sizeRem}rem`,
        borderWidth: `${borderSize}px`,
        borderColor: 'var(--color-border)',
        borderTopColor: 'var(--color-accent-blue)'
      }}
    ></div>
  );
};

export default LoadingSpinner;
