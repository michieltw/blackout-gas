import React from 'react';
import { Trash2 } from 'lucide-react';

export default function EventLog({ events, players, teams, onDelete }) {
  if (events.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">No events yet</p>;
  }

  const typeIcon = {
    Goal: '🚨',
    Penalty: '⚠️',
    Shot: '🏒',
    Faceoff: '🔵',
    Timeout: '⏸️',
    'Period Start': '▶️',
    'Period End': '⏹️',
    'Game Start': '🏁',
    'Game End': '🏆',
  };

  return (
    <div className="space-y-1 max-h-80 overflow-y-auto">
      {events.map(evt => {
        const player = players[evt.player_id];
        const team = teams[evt.team_id];
        const a1 = players[evt.assist1_player_id];
        const a2 = players[evt.assist2_player_id];

        return (
          <div key={evt.id} className="flex items-start gap-2 p-2 rounded-lg bg-card/50 border border-border group text-xs">
            <span className="shrink-0 mt-0.5">{typeIcon[evt.event_type] || '•'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium">
                <span className="text-muted-foreground">[P{evt.period} {evt.game_time}]</span>{' '}
                {evt.event_type}
                {player && ` — #${player.jersey_number || ''} ${player.last_name}`}
                {evt.goal_type && ` (${evt.goal_type})`}
                {evt.penalty_minutes && ` ${evt.penalty_minutes}min`}
              </p>
              {(a1 || a2) && (
                <p className="text-muted-foreground">
                  Assists: {a1 ? `#${a1.jersey_number} ${a1.last_name}` : ''}
                  {a2 ? `, #${a2.jersey_number} ${a2.last_name}` : ''}
                </p>
              )}
              {team && <span className="text-muted-foreground">{team.short_name || team.name}</span>}
            </div>
            {onDelete && (
              <button
                onClick={() => onDelete(evt)}
                className="opacity-40 hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1 shrink-0"
                title="Delete event"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
