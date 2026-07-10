import React, { useState, useEffect } from 'react';
import { gasClient as base44 } from '@/api/gasClient';
import { Link } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import LiveBadge from '@/components/ui/LiveBadge';

export default function Schedule() {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Game.list('-scheduled_date', 100),
      base44.entities.Team.list(),
    ]).then(([g, t]) => {
      setGames(g);
      setTeams(Object.fromEntries(t.map(t => [t.id, t])));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const grouped = {};
  games.forEach(g => {
    const date = g.scheduled_date ? new Date(g.scheduled_date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Unscheduled';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(g);
  });

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Schedule</h1>
        <p className="text-muted-foreground mt-1">{games.length} games</p>
      </div>

      {Object.entries(grouped).map(([date, dateGames]) => (
        <section key={date}>
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {date}
          </h2>
          <div className="space-y-2">
            {dateGames.map(game => {
              const home = teams[game.home_team_id];
              const away = teams[game.away_team_id];
              return (
                <Link key={game.id} to={game.status === 'Live' ? `/live/${game.id}` : '#'} className="block">
                  <div className={`flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-secondary/50 transition-all ${game.status === 'Live' ? 'border-primary/40' : 'border-border'}`}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-center min-w-[60px]">
                        {game.scheduled_date && (
                          <p className="text-sm font-clock text-muted-foreground">
                            {new Date(game.scheduled_date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{home?.name || 'TBD'} vs {away?.name || 'TBD'}</p>
                        <p className="text-xs text-muted-foreground">{game.venue || ''} · {game.game_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {game.status === 'Live' ? (
                        <LiveBadge />
                      ) : game.status === 'Final' ? (
                        <p className="font-bold font-clock">{game.home_score} - {game.away_score}</p>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">{game.status}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {games.length === 0 && (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Games Scheduled</h2>
          <p className="text-muted-foreground">Games will appear here once an admin schedules them.</p>
        </div>
      )}
    </div>
  );
}
