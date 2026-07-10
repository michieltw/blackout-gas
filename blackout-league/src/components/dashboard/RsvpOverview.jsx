import React from 'react';
import { CheckCircle2, XCircle, Clock, Users } from 'lucide-react';

const MIN_PLAYERS = 6; // threshold to consider enough players

export default function RsvpOverview({ upcomingGames, rsvps, teams }) {
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));

  if (upcomingGames.length === 0) {
    return <p className="text-muted-foreground text-sm">Geen aanstaande wedstrijden.</p>;
  }

  return (
    <div className="space-y-3">
      {upcomingGames.map(game => {
        const gameRsvps = rsvps.filter(r => r.game_id === game.id);
        const attending = gameRsvps.filter(r => r.status === 'Attending').length;
        const absent = gameRsvps.filter(r => r.status === 'Absent').length;
        const pending = gameRsvps.filter(r => r.status === 'Pending').length;
        const total = gameRsvps.length;
        const enough = attending >= MIN_PLAYERS;
        const home = teamMap[game.home_team_id];
        const away = teamMap[game.away_team_id];

        return (
          <div key={game.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {home?.name || 'TBD'} vs {away?.name || 'TBD'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {game.scheduled_date
                    ? new Date(game.scheduled_date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'Datum onbekend'} · {game.game_type}
                </p>
              </div>
              <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${enough ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                {enough ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {enough ? 'Genoeg' : 'Te weinig'}
              </span>
            </div>

            {/* RSVP bar */}
            {total > 0 && (
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden flex mb-2">
                <div className="bg-green-500 h-full transition-all" style={{ width: `${(attending / total) * 100}%` }} />
                <div className="bg-red-500 h-full transition-all" style={{ width: `${(absent / total) * 100}%` }} />
                <div className="bg-muted h-full transition-all" style={{ width: `${(pending / total) * 100}%` }} />
              </div>
            )}

            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle2 className="w-3 h-3" /> {attending} aanwezig
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <XCircle className="w-3 h-3" /> {absent} afwezig
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" /> {pending} onbeslist
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
