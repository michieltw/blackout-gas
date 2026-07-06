import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Timer, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LiveBadge from '@/components/ui/LiveBadge';
import { formatGameTime } from '@/lib/gameHelpers';

export default function LiveGames() {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    Promise.all([
      base44.entities.Game.filter({ status: 'Live' }),
      base44.entities.Team.list(),
    ]).then(([g, t]) => {
      setGames(g);
      setTeams(t);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Games</h1>
          <p className="text-muted-foreground mt-1">Auto-refreshes every 30 seconds</p>
        </div>
        <Link to="/scorekeeper">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Timer className="w-4 h-4 mr-2" /> Scorekeeper
          </Button>
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-20">
          <Timer className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Live Games</h2>
          <p className="text-muted-foreground">Check back later or start a game from the Scorekeeper.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {games.map(game => {
            const home = teamMap[game.home_team_id];
            const away = teamMap[game.away_team_id];
            return (
              <div key={game.id} className="rounded-xl border border-primary/30 bg-card overflow-hidden pulse-gold">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <LiveBadge />
                      <span className="text-xs text-muted-foreground">{game.game_type}</span>
                    </div>
                    <span className="font-clock text-sm text-primary">
                      P{game.current_period} · {formatGameTime(game.period_time_remaining)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-black" style={{ backgroundColor: home?.color || '#FFD700', color: '#000' }}>
                        {home?.short_name?.charAt(0) || 'H'}
                      </div>
                      <p className="font-bold">{home?.name || 'Home'}</p>
                      <p className="text-4xl font-black mt-2">{game.home_score}</p>
                      <p className="text-xs text-muted-foreground mt-1">SOG: {game.home_shots}</p>
                    </div>
                    <div className="text-muted-foreground font-bold px-4">VS</div>
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-black" style={{ backgroundColor: away?.color || '#FFD700', color: '#000' }}>
                        {away?.short_name?.charAt(0) || 'A'}
                      </div>
                      <p className="font-bold">{away?.name || 'Away'}</p>
                      <p className="text-4xl font-black mt-2">{game.away_score}</p>
                      <p className="text-xs text-muted-foreground mt-1">SOG: {game.away_shots}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border p-3 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{game.venue || 'Unknown Venue'}</span>
                  <Link to={`/live/${game.id}`}>
                    <Button variant="ghost" size="sm" className="text-primary">
                      <Eye className="w-4 h-4 mr-1" /> Watch
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}