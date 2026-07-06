import React from 'react';
import { getLevel, getXPProgress, LEVEL_NAMES } from '@/lib/xp';

export default function XPBar({ xp = 0, showLabel = true }) {
  const level = getLevel(xp);
  const progress = getXPProgress(xp);
  const levelName = LEVEL_NAMES[level];

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-primary">Level {level} · {levelName}</span>
          <span className="text-muted-foreground">{xp} XP</span>
        </div>
      )}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-yellow-300 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}