import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import XPBar from '@/components/ui/XPBar';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Player.list(),
      base44.entities.Team.list(),
    ]).then(([p, t]) => {
      setPlayers(p);
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

  const filtered = players.filter(p => {
    const q = search.toLowerCase();
    return `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) || String(p.jersey_number).includes(q);
  });

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Players</h1>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search players..."
            className="pl-9 bg-card"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No players found.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(player => {
            const team = teams[player.team_id];
            return (
              <div key={player.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm shrink-0">
                    {player.jersey_number || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{player.first_name} {player.last_name}</p>
                    <p className="text-xs text-muted-foreground">{player.position} · {team?.short_name || team?.name || 'Free Agent'}</p>
                  </div>
                </div>
                <XPBar xp={player.xp || 0} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}