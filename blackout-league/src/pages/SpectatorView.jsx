import React, { useState, useEffect } from 'react';
import { gasClient as base44 } from '@/api/gasClient';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LiveBadge from '@/components/ui/LiveBadge';
import { formatGameTime } from '@/lib/gameHelpers';

export default function SpectatorView() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [teams, setTeams] = useState({});
  const [events, setEvents] = useState([]);
  const [players, setPlayers] = useState({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [g, evts, allTeams, allPlayers] = await Promise.all([
      base44.entities.Game.get(id),
      base44.entities.GameEvent.filter({ game_id: id }, '-created_date', 50),
      base44.entities.Team.list(),
      base44.entities.Player.list(),
    ]);
    setGame(g);
    setEvents(evts);
    setTeams(Object.fromEntries(allTeams.map(t => [t.id, t])));
    setPlayers(Object.fromEntries(allPlayers.map(p => [p.id, p])));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading || !game) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const home = teams[game.home_team_id];
  const away = teams[game.away_team_id];
  const isLive = game.status === 'Live';

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/live">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="text-xl font-bold flex-1">Game Details</h1>
        {isLive && <LiveBadge />}
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Auto-refresh 30s
        </span>
      </div>

      {/* Scoreboard */}
      <div className={`rounded-2xl border p-6 lg:p-10 ${isLive ? 'border-primary/40 pulse-gold' : 'border-border'} bg-card`}>
        <div className="text-center mb-4">
          <span className="font-clock text-lg text-primary">
            {game.status === 'Final' ? 'FINAL' : `P${game.current_period} · ${formatGameTime(game.period_time_remaining)}`}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-black" style={{ backgroundColor: home?.color || '#FFD700', color: '#000' }}>
              {home?.short_name?.charAt(0) || 'H'}
            </div>
            <p className="font-bold text-lg">{home?.name || 'Home'}</p>
            <p className="text-5xl lg:text-7xl font-black mt-2">{game.home_score}</p>
            <p className="text-sm text-muted-foreground mt-2">SOG: {game.home_shots}</p>
          </div>
          <div className="text-2xl font-bold text-muted-foreground/30 px-6">VS</div>
          <div className="text-center flex-1">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-black" style={{ backgroundColor: away?.color || '#FFD700', color: '#000' }}>
              {away?.short_name?.charAt(0) || 'A'}
            </div>
            <p className="font-bold text-lg">{away?.name || 'Away'}</p>
            <p className="text-5xl lg:text-7xl font-black mt-2">{game.away_score}</p>
            <p className="text-sm text-muted-foreground mt-2">SOG: {game.away_shots}</p>
          </div>
        </div>
      </div>

      {/* Play by Play */}
      <section>
        <h2 className="text-lg font-bold mb-4">Play-by-Play</h2>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">No events recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map(evt => {
              const player = players[evt.player_id];
              const team = teams[evt.team_id];
              return (
                <div key={evt.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    evt.event_type === 'Goal' ? 'bg-green-500/20 text-green-400' :
                    evt.event_type === 'Penalty' ? 'bg-red-500/20 text-red-400' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {evt.event_type === 'Goal' ? '🚨' : evt.event_type === 'Penalty' ? '⚠️' : '•'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {evt.event_type}
                      {player && ` — #${player.jersey_number || ''} ${player.last_name}`}
                      {evt.goal_type && ` (${evt.goal_type})`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {team?.short_name || team?.name || ''} · P{evt.period} · {evt.game_time || ''}
                      {evt.description && ` · ${evt.description}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
