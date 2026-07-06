import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import XpBar from '@/components/ui/XpBar';

export default function TeamDetail() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Team.get(id),
      base44.entities.Player.filter({ team_id: id }),
    ]).then(([t, p]) => {
      setTeam(t);
      setPlayers(p);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading || !team) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const statusColors = {
    Active: 'bg-green-500/20 text-green-400',
    Inactive: 'bg-gray-500/20 text-gray-400',
    Injured: 'bg-red-500/20 text-red-400',
    Suspended: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/teams"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black" style={{ backgroundColor: team.color || '#FFD700', color: '#000' }}>
          {team.short_name?.charAt(0) || team.name?.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          {team.short_name && <p className="text-sm text-muted-foreground">{team.short_name}</p>}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4">Roster ({players.length})</h2>
        {players.length === 0 ? (
          <p className="text-muted-foreground">No players on this team yet.</p>
        ) : (
          <div className="space-y-2">
            {players.sort((a, b) => (a.jersey_number || 99) - (b.jersey_number || 99)).map(player => (
              <div key={player.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm shrink-0">
                  {player.jersey_number || <User className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{player.first_name} {player.last_name}</p>
                  <p className="text-xs text-muted-foreground">{player.position}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[player.status] || ''}`}>
                  {player.status}
                </span>
                <div className="w-32 hidden sm:block">
                  <XpBar xp={player.xp || 0} showLabel={false} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}