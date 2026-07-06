import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy, Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateStandings, calculatePlayerStats } from '@/lib/gameHelpers';

export default function Standings() {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Game.list(),
      base44.entities.Team.list(),
      base44.entities.Player.list(),
      base44.entities.GameEvent.filter({ event_type: 'Goal' }),
      base44.entities.Division.list(),
    ]).then(([g, t, p, e, d]) => {
      setGames(g);
      setTeams(t);
      setPlayers(p);
      setEvents(e);
      setDivisions(d);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const standings = calculateStandings(games, teams);

  const playerStats = players.map(p => {
    const stats = calculatePlayerStats(events, p.id);
    const team = teams.find(t => t.id === p.team_id);
    return { ...p, ...stats, team_name: team?.short_name || team?.name || '' };
  }).sort((a, b) => b.points - a.points);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Standings & Stats</h1>

      <Tabs defaultValue="standings" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="standings">Team Standings</TabsTrigger>
          <TabsTrigger value="scoring">Player Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="standings" className="mt-6">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 text-muted-foreground">
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Team</th>
                    <th className="text-center p-3 font-medium">GP</th>
                    <th className="text-center p-3 font-medium">W</th>
                    <th className="text-center p-3 font-medium">L</th>
                    <th className="text-center p-3 font-medium">GF</th>
                    <th className="text-center p-3 font-medium">GA</th>
                    <th className="text-center p-3 font-medium">DIFF</th>
                    <th className="text-center p-3 font-medium text-primary">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, i) => (
                    <tr key={row.team.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                      <td className="p-3 font-bold text-muted-foreground">{i + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: row.team.color || '#FFD700', color: '#000' }}>
                            {row.team.short_name?.charAt(0) || row.team.name?.charAt(0) || '?'}
                          </div>
                          <span className="font-medium">{row.team.name}</span>
                        </div>
                      </td>
                      <td className="text-center p-3">{row.gp}</td>
                      <td className="text-center p-3 text-green-400">{row.w}</td>
                      <td className="text-center p-3 text-red-400">{row.l}</td>
                      <td className="text-center p-3">{row.gf}</td>
                      <td className="text-center p-3">{row.ga}</td>
                      <td className="text-center p-3">{row.gf - row.ga > 0 ? '+' : ''}{row.gf - row.ga}</td>
                      <td className="text-center p-3 font-bold text-primary">{row.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {standings.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No games completed yet.</p>
          )}
        </TabsContent>

        <TabsContent value="scoring" className="mt-6">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 text-muted-foreground">
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Player</th>
                    <th className="text-left p-3 font-medium">Team</th>
                    <th className="text-center p-3 font-medium">G</th>
                    <th className="text-center p-3 font-medium">A</th>
                    <th className="text-center p-3 font-medium text-primary">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.slice(0, 50).map((p, i) => (
                    <tr key={p.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                      <td className="p-3 font-bold text-muted-foreground">{i + 1}</td>
                      <td className="p-3 font-medium">
                        {p.jersey_number && <span className="text-muted-foreground mr-1">#{p.jersey_number}</span>}
                        {p.first_name} {p.last_name}
                      </td>
                      <td className="p-3 text-muted-foreground">{p.team_name}</td>
                      <td className="text-center p-3">{p.goals}</td>
                      <td className="text-center p-3">{p.assists}</td>
                      <td className="text-center p-3 font-bold text-primary">{p.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {playerStats.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No player stats available yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}