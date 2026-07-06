import React from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatGameTime } from '@/lib/gameHelpers';

export default function GameClock({ timeRemaining, period, isRunning, onToggle, onNextPeriod }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
        Period {period}
      </div>
      <div className={`font-clock text-5xl lg:text-6xl font-black tracking-wider ${isRunning ? 'text-primary' : 'text-foreground'}`}>
        {formatGameTime(timeRemaining)}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Button
          onClick={onToggle}
          size="sm"
          className={isRunning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
        >
          {isRunning ? <><Pause className="w-4 h-4 mr-1" /> Stop</> : <><Play className="w-4 h-4 mr-1" /> Start</>}
        </Button>
        <Button onClick={onNextPeriod} variant="outline" size="sm">
          <SkipForward className="w-4 h-4 mr-1" /> Next Period
        </Button>
      </div>
    </div>
  );
}