import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Shield, Users } from 'lucide-react';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Team.list(),
      base44.entities.Player.list(),
      base44.entities.Division.list(),
    ]).then(([t, p, d]) => {
      setTeams(t);
      setPlayers(p);
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

  const divMap = Object.fromEntries(divisions.map(d => [d.id, d]));

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Teams</h1>

      {teams.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Teams Yet</h2>
          <p className="text-muted-foreground">Teams will appear here once an admin creates them.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => {
            const rosterCount = players.filter(p => p.team_id === team.id).length;
            const div = divMap[team.division_id];
            return (
              <Link key={team.id} to={`/teams/${team.id}`}>
                <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shrink-0 group-hover:scale-105 transition-transform" style={{ backgroundColor: team.color || '#FFD700', color: '#000' }}>
                      {team.short_name?.charAt(0) || team.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{team.name}</h3>
                      {team.short_name && <p className="text-xs text-muted-foreground">{team.short_name}</p>}
                      {div && <p className="text-xs text-primary">{div.name}</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{rosterCount} players</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}