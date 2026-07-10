import React, { useState, useEffect } from 'react';
import { gasClient as base44 } from '@/api/gasClient';
import { Zap, Crown, Star, Medal, TrendingUp } from 'lucide-react';
import { getLevel, getXPProgress, LEVEL_NAMES } from '@/lib/xp';

const getLevelTitle = (xp) => LEVEL_NAMES[getLevel(xp)] || 'Rookie';
const getLevelProgress = (xp) => getXPProgress(xp);

const RANK_COLORS = ['text-primary', 'text-slate-300', 'text-amber-600'];
const RANK_BG = ['bg-primary/10', 'bg-slate-300/10', 'bg-amber-600/10'];
const RANK_ICONS = [Crown, Star, Medal];

export default function GamificationHall() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Player.list(),
      base44.entities.Team.list(),
      base44.entities.GameEvent.list(),
    ]).then(([p, t, e]) => {
      setPlayers(p); setTeams(t); setEvents(e);
      setLoading(false);
    });
  }, []);

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));

  const ranked = [...players]
    .filter(p => p.status === 'Active')
    .sort((a, b) => (b.xp || 0) - (a.xp || 0));

  const topThree = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
          <Zap className="w-8 h-8 text-primary" /> Gamification Hall
        </h1>
        <p className="text-muted-foreground mt-1">Top-ranked players by XP and level progression</p>
      </div>

      {/* Podium */}
      {topThree.length > 0 && (
        <div className="flex items-end justify-center gap-4 pt-4">
          {[topThree[1], topThree[0], topThree[2]].filter(Boolean).map((p, i) => {
            const realRank = p === topThree[0] ? 0 : p === topThree[1] ? 1 : 2;
            const heights = ['h-40', 'h-52', 'h-32'];
            const podiumOrder = [1, 0, 2];
            const rank = podiumOrder[i];
            const lv = getLevel(p.xp || 0);
            const title = getLevelTitle(p.xp || 0);
            const RIcon = RANK_ICONS[rank];
            return (
              <div key={p.id} className={`flex flex-col items-center gap-2`}>
                <RIcon className={`w-6 h-6 ${RANK_COLORS[rank]}`} />
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm overflow-hidden">
                  {p.photo_url ? <img src={p.photo_url} className="w-full h-full object-cover" alt="" /> : (p.first_name[0] + p.last_name[0])}
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold leading-tight">{p.first_name} {p.last_name}</div>
                  <div className="text-xs text-muted-foreground">{title}</div>
                </div>
                <div className={`w-20 ${heights[rank]} rounded-t-lg ${RANK_BG[rank]} border-t-2 border-x-2 ${RANK_COLORS[rank].replace('text-', 'border-')} flex flex-col items-center justify-start pt-2 gap-1`}>
                  <span className={`text-2xl font-black ${RANK_COLORS[rank]}`}>#{rank + 1}</span>
                  <span className="text-xs text-muted-foreground">{(p.xp || 0).toLocaleString()} XP</span>
                  <span className="text-xs font-mono text-foreground">Lv.{lv}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full leaderboard */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="font-semibold">Full Leaderboard</span>
          <span className="ml-auto text-xs text-muted-foreground">{ranked.length} active players</span>
        </div>
        <div className="divide-y divide-border">
          {ranked.map((p, idx) => {
            const lv = getLevel(p.xp || 0);
            const title = getLevelTitle(p.xp || 0);
            const prog = getLevelProgress(p.xp || 0);
            const team = teamMap[p.team_id];
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-secondary/20 transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${idx < 3 ? `${RANK_BG[idx]} ${RANK_COLORS[idx]}` : 'bg-secondary text-muted-foreground'}`}>
                  {idx + 1}
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                  {p.photo_url ? <img src={p.photo_url} className="w-full h-full object-cover" alt="" /> : (p.first_name[0] + p.last_name[0])}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{p.first_name} {p.last_name}</span>
                    <span className="text-xs text-muted-foreground">{title}</span>
                    {team && <span className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{team.name}</span>}
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${prog}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-sm font-bold">Lv.{lv}</div>
                  <div className="text-xs text-muted-foreground font-mono">{(p.xp || 0).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
          {ranked.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No active players found</div>
          )}
        </div>
      </div>
    </div>
  );
}
