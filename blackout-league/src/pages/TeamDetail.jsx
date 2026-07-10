import React, { useState, useEffect } from 'react';
import { gasClient as base44 } from '@/api/gasClient';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, ArrowRightLeft, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import XPBar from '@/components/ui/XPBar';

const STATUS_OPTIONS = ['Active', 'Inactive', 'Injured', 'Suspended'];
const STATUS_COLORS = {
  Active: 'bg-green-500/20 text-green-400',
  Inactive: 'bg-gray-500/20 text-gray-400',
  Injured: 'bg-red-500/20 text-red-400',
  Suspended: 'bg-orange-500/20 text-orange-400',
};

function PlayerRow({ player, allTeams, currentTeamId, onStatusChange, onTeamChange }) {
  const [showMove, setShowMove] = useState(false);
  const otherTeams = allTeams.filter(t => t.id !== currentTeamId);

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card flex-wrap">
      {/* Jersey + Name */}
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm shrink-0">
        {player.jersey_number || <User className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{player.first_name} {player.last_name}</p>
        <p className="text-xs text-muted-foreground">{player.position}</p>
      </div>

      {/* XP bar */}
      <div className="w-28 hidden sm:block">
        <XPBar xp={player.xp || 0} showLabel={false} />
      </div>

      {/* Status quick-change */}
      <Select value={player.status || 'Active'} onValueChange={val => onStatusChange(player.id, val)}>
        <SelectTrigger className={`h-7 text-xs w-32 border-0 ${STATUS_COLORS[player.status] || ''} bg-transparent`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map(s => (
            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Move to team */}
      {otherTeams.length > 0 && (
        showMove ? (
          <Select onValueChange={val => { onTeamChange(player.id, val); setShowMove(false); }}>
            <SelectTrigger className="h-7 text-xs w-36 bg-secondary border-primary/40">
              <SelectValue placeholder="Verplaats naar…" />
            </SelectTrigger>
            <SelectContent>
              {otherTeams.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2 gap-1"
            onClick={() => setShowMove(true)}
            title="Verplaats naar ander team"
          >
            <ArrowRightLeft className="w-3 h-3" /> Verplaats
          </Button>
        )
      )}
    </div>
  );
}

export default function TeamDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([
      base44.entities.Team.get(id),
      base44.entities.Player.filter({ team_id: id }),
      base44.entities.Team.list(),
    ]).then(([t, p, all]) => {
      setTeam(t);
      setPlayers(p.sort((a, b) => (a.jersey_number || 99) - (b.jersey_number || 99)));
      setAllTeams(all);
    }).finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const handleStatusChange = async (playerId, status) => {
    await base44.entities.Player.update(playerId, { status });
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, status } : p));
    toast({ title: 'Status bijgewerkt', description: status });
  };

  const handleTeamChange = async (playerId, newTeamId) => {
    await base44.entities.Player.update(playerId, { team_id: newTeamId });
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    const destTeam = allTeams.find(t => t.id === newTeamId);
    toast({ title: 'Speler verplaatst', description: `Naar ${destTeam?.name || 'nieuw team'}` });
  };

  if (loading || !team) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Roster ({players.length})</h2>
          <p className="text-xs text-muted-foreground">Klik op status of "Verplaats" om direct te wijzigen</p>
        </div>

        {players.length === 0 ? (
          <p className="text-muted-foreground">Geen spelers in dit team.</p>
        ) : (
          <div className="space-y-2">
            {players.map(player => (
              <PlayerRow
                key={player.id}
                player={player}
                allTeams={allTeams}
                currentTeamId={id}
                onStatusChange={handleStatusChange}
                onTeamChange={handleTeamChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
