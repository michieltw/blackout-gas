import React, { useState } from 'react';
import { Trophy, Target, Star } from 'lucide-react';
import { calculateStandings, calculatePlayerStats } from '@/lib/gameHelpers';
import { getLevel } from '@/lib/xp';

export default function TeamPlayerStats({ games, teams, players, events }) {
  const [tab, setTab] = useState('teams'); // 'teams' | 'scorers'
  const standings = calculateStandings(games, teams);

  // Top scorers
  const scorers = players.map(p => {
    const stats = calculatePlayerStats(events, p.id);
    return { ...p, ...stats };
  }).filter(p => p.points > 0).sort((a, b) => b.points - a.points || b.goals - a.goals).slice(0, 8);

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));

  return (
    <div>
      {/* mini tab switcher */}
      <div className="flex gap-1 mb-4 bg-secondary rounded-lg p-1 w-fit">
        {[{ id: 'teams', label: 'Teams' }, { id: 'scorers', label: 'Topscorers' }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'teams' && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                {['#', 'Team', 'GS', 'W', 'V', 'P', 'DV', 'DP', 'Pts'].map(h => (
                  <th key={h} className="p-2 text-xs font-semibold text-muted-foreground text-center first:text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr><td colSpan={9} className="p-4 text-center text-muted-foreground text-sm">Geen afgeronde wedstrijden.</td></tr>
              ) : standings.map((s, i) => (
                <tr key={s.team.id} className="border-t border-border hover:bg-secondary/20">
                  <td className="p-2 text-xs text-muted-foreground text-left">{i + 1}</td>
                  <td className="p-2 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: s.team.color || '#FFD700' }} />
                    <span className="truncate max-w-[90px]">{s.team.name}</span>
                  </td>
                  <td className="p-2 text-center text-muted-foreground">{s.gp}</td>
                  <td className="p-2 text-center text-green-400">{s.w}</td>
                  <td className="p-2 text-center text-red-400">{s.l}</td>
                  <td className="p-2 text-center">{s.otl}</td>
                  <td className="p-2 text-center">{s.gf}</td>
                  <td className="p-2 text-center">{s.ga}</td>
                  <td className="p-2 text-center font-bold text-primary">{s.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'scorers' && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                {['#', 'Speler', 'Team', 'D', 'A', 'Pts', 'Lvl'].map(h => (
                  <th key={h} className="p-2 text-xs font-semibold text-muted-foreground text-center first:text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scorers.length === 0 ? (
                <tr><td colSpan={7} className="p-4 text-center text-muted-foreground text-sm">Nog geen goals gescoord.</td></tr>
              ) : scorers.map((p, i) => (
                <tr key={p.id} className="border-t border-border hover:bg-secondary/20">
                  <td className="p-2 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="p-2 font-medium">
                    <span className="text-xs text-muted-foreground mr-1">#{p.jersey_number || '?'}</span>
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="p-2 text-xs text-muted-foreground truncate max-w-[80px]">{teamMap[p.team_id]?.short_name || teamMap[p.team_id]?.name || '—'}</td>
                  <td className="p-2 text-center">{p.goals}</td>
                  <td className="p-2 text-center">{p.assists}</td>
                  <td className="p-2 text-center font-bold text-primary">{p.points}</td>
                  <td className="p-2 text-center">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">{getLevel(p.xp || 0)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
