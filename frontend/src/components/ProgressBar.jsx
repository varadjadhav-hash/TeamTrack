import React from 'react';

const ProgressBar = ({ progress = 0, showLabel = true, size = 'md', className = '' }) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  // Dynamic color depending on completion level
  const getColor = () => {
    if (clamped === 100) return 'bg-emerald-500';
    if (clamped >= 50) return 'bg-indigo-600';
    if (clamped > 0) return 'bg-amber-500';
    return 'bg-slate-300';
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold">
          <span className="text-slate-600">Progress</span>
          <span className={clamped === 100 ? 'text-emerald-600 font-bold' : 'text-slate-800'}>
            {clamped}%
          </span>
        </div>
      )}
      <div className={`w-full bg-slate-200/80 rounded-full overflow-hidden ${sizeClasses[size] || sizeClasses.md}`}>
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${getColor()}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
