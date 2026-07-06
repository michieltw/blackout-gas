import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Target, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { sendRsvpEmail } from '@/lib/emailNotifications';
import StatCard from '@/components/ui/StatCard';
import XpBar from '@/components/ui/XpBar';
import { calculatePlayerStats } from '@/lib/gameHelper';
import { getLevel, LEVEL_NAMES } from '@/lib/xp';

export default function Profile() {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [player, setPlayer] = useState(null);
  const [events, setEvents] = useState([]);
  const [games, setGames] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      setMe(user);
      
      const [allPlayers, allEvents, allGames, allRsvps, allTeams] = await Promise.all([
        base44.entities.Player.list(),
        base44.entities.GameEvent.list(),
        base44.entities.Game.list('-scheduled_date', 20),
        base44.entities.RSVP.list(),
        base44.entities.Team.list(),
      ]);
      
      const myPlayer = allPlayers.find(p => p.user_id === user.id);
      setPlayer(myPlayer);
      setEvents(allEvents);
      setGames(allGames);
      setRsvps(allRsvps.filter(r => myPlayer && r.player_id === myPlayer.id));
      setTeams(Object.fromEntries(allTeams.map(t => [t.id, t])));
      setLoading(false);
    };
    load();
  }, []);

  const handleRSVP = async (gameId, status) => {
    const existing = rsvps.find(r => r.game_id === gameId);
    if (existing) {
      await base44.entities.RSVP.update(existing.id, { status });
      setRsvps(prev => prev.map(r => r.id === existing.id ? { ...r, status } : r));
    } else {
      const rsvp = await base44.entities.RSVP.create({ game_id: gameId, player_id: player.id, status });
      setRsvps(prev => [...prev, rsvp]);
    }
    toast({ title: `RSVP: ${status}` });
    // Send RSVP confirmation email
    const game = games.find(g => g.id === gameId);
    if (game && me?.email) {
      const homeTeam = teams[game.home_team_id];
      const awayTeam = teams[game.away_team_id];
      sendRsvpEmail(player, me.email, game, homeTeam, awayTeam, status).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const stats = player ? calculatePlayerStats(events, player.id) : { goals: 0, assists: 0, points: 0, pim: 0 };
  const level = player ? getLevel(player.xp || 0) : 1;
  const team = player ? teams[player.team_id] : null;
  const upcomingGames = games.filter(g => g.status === 'Scheduled' && (player?.team_id === g.home_team_id || player?.team_id === g.away_team_id));

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
            {player?.jersey_number ? (
              <span className="text-2xl font-black text-primary">{player.jersey_number}</span>
            ) : (
              <User className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {player ? `${player.first_name} ${player.last_name}` : me?.full_name || 'My Profile'}
            </h1>
            {player && (
              <p className="text-muted-foreground">{player.position} · {team?.name || 'No team'}</p>
            )}
            {!player && <p className="text-muted-foreground text-sm">No player profile linked to your account.</p>}
          </div>
        </div>
        {player && (
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-bold text-primary">Level {level} — {LEVEL_NAMES[level]}</span>
            </div>
            <XpBar xp={player.xp || 0} />
          </div>
        )}
      </div>

      {/* Stats */}
      {player && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Goals" value={stats.goals} icon={Target} accent />
          <StatCard label="Assists" value={stats.assists} icon={User} />
          <StatCard label="Points" value={stats.points} icon={Target} accent />
          <StatCard label="PIM" value={stats.pim} icon={AlertTriangle} />
        </div>
      )}

      {/* RSVP Section */}
      {player && upcomingGames.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4">Upcoming — RSVP</h2>
          <div className="space-y-3">
            {upcomingGames.map(game => {
              const home = teams[game.home_team_id];
              const away = teams[game.away_team_id];
              const myRsvp = rsvps.find(r => r.game_id === game.id);
              return (
                <div key={game.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                  <div>
                    <p className="font-medium">{home?.name || 'TBD'} vs {away?.name || 'TBD'}</p>
                    <p className="text-xs text-muted-foreground">
                      {game.scheduled_date ? new Date(game.scheduled_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                      {game.venue && ` · ${game.venue}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={myRsvp?.status === 'Attending' ? 'default' : 'outline'}
                      className={myRsvp?.status === 'Attending' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                      onClick={() => handleRSVP(game.id, 'Attending')}
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant={myRsvp?.status === 'Absent' ? 'default' : 'outline'}
                      className={myRsvp?.status === 'Absent' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                      onClick={() => handleRSVP(game.id, 'Absent')}
                    >
                      ✗
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}