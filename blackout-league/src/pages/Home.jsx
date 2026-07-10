import React, { useState, useEffect } from 'react';
import { gasClient as base44 } from '@/api/gasClient';
import { Link } from 'react-router-dom';
import { Timer, Trophy, Calendar, Users, ArrowRight } from 'lucide-react';
import LiveBadge from '@/components/ui/LiveBadge';
import StatCard from '@/components/ui/StatCard';
import { formatGameTime } from '@/lib/gameHelpers';
import RsvpOverview from '@/components/dashboard/RsvpOverview';
import TeamPlayerStats from '@/components/dashboard/TeamPlayerStats';

export default function Home() {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Game.list('-scheduled_date', 50),
      base44.entities.Team.list(),
      base44.entities.Player.list(),
      base44.entities.RSVP.list(),
      base44.entities.GameEvent.list(),
    ]).then(([g, t, p, r, e]) => {
      setGames(g);
      setTeams(t);
      setPlayers(p);
      setRsvps(r);
      setEvents(e);
    }).finally(() => setLoading(false));
  }, []);

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));
  const liveGames = games.filter(g => g.status === 'Live');
  const upcoming = games.filter(g => g.status === 'Scheduled').sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  const recent = games.filter(g => g.status === 'Final').slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to Blackout League Manager</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Live Games" value={liveGames.length} icon={Timer} accent={liveGames.length > 0} />
        <StatCard label="Total Games" value={games.length} icon={Calendar} />
        <StatCard label="Teams" value={teams.length} icon={Trophy} />
        <StatCard label="Players" value={players.length} icon={Users} />
      </div>

      {/* Live Games */}
      {liveGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <LiveBadge />
            <h2 className="text-lg font-bold">Live Now</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {liveGames.map(game => {
              const home = teamMap[game.home_team_id];
              const away = teamMap[game.away_team_id];
              return (
                <Link key={game.id} to={`/live/${game.id}`} className="block">
                  <div className="rounded-xl border border-primary/30 bg-card p-5 hover:border-primary/60 transition-all pulse-gold">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground">Periode {game.current_period} · {formatGameTime(game.period_time_remaining)}</span>
                      <LiveBadge />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <p className="font-bold text-lg">{home?.short_name || home?.name || 'Thuis'}</p>
                        <p className="text-3xl font-black text-primary mt-1">{game.home_score}</p>
                      </div>
                      <span className="text-muted-foreground text-sm font-medium px-4">VS</span>
                      <div className="text-center flex-1">
                        <p className="font-bold text-lg">{away?.short_name || away?.name || 'Uit'}</p>
                        <p className="text-3xl font-black text-primary mt-1">{game.away_score}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* RSVP Overview + Recent Results */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* RSVP per upcoming game */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">RSVP Aankomende Wedstrijden</h2>
            <Link to="/schedule" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
              Rooster <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <RsvpOverview upcomingGames={upcoming.slice(0, 6)} rsvps={rsvps} teams={teams} />
        </section>

        {/* Recent results */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recente Resultaten</h2>
            <Link to="/schedule" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
              Alles <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nog geen afgeronde wedstrijden.</p>
          ) : (
            <div className="space-y-2">
              {recent.map(game => {
                const home = teamMap[game.home_team_id];
                const away = teamMap[game.away_team_id];
                return (
                  <div key={game.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                    <div>
                      <p className="text-sm font-medium">{home?.name || 'TBD'} vs {away?.name || 'TBD'}</p>
                      <p className="text-xs text-muted-foreground">Eindstand</p>
                    </div>
                    <p className="font-bold font-clock">{game.home_score} - {game.away_score}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Team & Player Stats */}
      <section>
        <h2 className="text-lg font-bold mb-4">Statistieken</h2>
        <TeamPlayerStats games={games} teams={teams} players={players} events={events} />
      </section>
    </div>
  );
}
