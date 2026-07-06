import React from 'react';

export default function LiveBadge({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 ${className}`}>
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      LIVE
    </span>
  );
}