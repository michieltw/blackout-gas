import React from 'react';
import { formatGameTime } from '@/lib/gameHelpers';

export default function PenaltyTimers({ penalties, players, currentPeriod, timeRemaining }) {
  const active = penalties.filter(p => {
    if (!p.penalty_end_time) return false;
    const parts = p.penalty_end_time.split(':');
    const endPeriod = parseInt(parts[0]);
    const endTime = parseInt(parts[1]);
    if (currentPeriod < endPeriod) return true;
    if (currentPeriod === endPeriod && timeRemaining < endTime) return true;
    return false;
  });

  if (active.length === 0) return null;

  return (
    <div className="space-y-1">
      {active.map((pen, i) => {
        const player = players[pen.player_id];
        const parts = pen.penalty_end_time.split(':');
        const endPeriod = parseInt(parts[0]);
        const endTime = parseInt(parts[1]);
        let remaining = 0;
        if (currentPeriod === endPeriod) {
          remaining = endTime - timeRemaining;
        } else {
          remaining = (endPeriod - currentPeriod) * 1200 + endTime - timeRemaining;
        }
        return (
          <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-xs">
            <span className="text-red-400 font-bold">⚠️</span>
            <span className="font-medium">#{player?.jersey_number || '?'} {player?.last_name || 'Unknown'}</span>
            <span className="text-red-400 font-clock ml-auto">{formatGameTime(Math.max(0, remaining))}</span>
          </div>
        );
      })}
    </div>
  );
}