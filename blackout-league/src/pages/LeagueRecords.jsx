import React, { useState, useEffect } from 'react';
import { gasClient as base44 } from '@/api/gasClient';
import { Trophy, Star, Medal, Crown, Award, TrendingUp } from 'lucide-react';

const trophyData = [
  { season: '2024–25', champion: 'Ice Wolves', runnerUp: 'Northern Hawks', mvp: 'J. Martens', goals: 42 },
  { season: '2023–24', champion: 'Northern Hawks', runnerUp: 'Polar Bears', mvp: 'R. Bosman', goals: 38 },
  { season: '2022–23', champion: 'Polar Bears', runnerUp: 'Ice Wolves', mvp: 'T. van Dijk', goals: 45 },
  { season: '2021–22', champion: 'Frost Giants', runnerUp: 'Ice Wolves', mvp: 'S. de Groot', goals: 31 },
];

const milestones = [
  { icon: Trophy, label: 'Total Seasons Played', value: '12', color: 'text-primary' },
  { icon: Star, label: 'Total Games Played', value: '1,284', color: 'text-blue-400' },
  { icon: Award, label: 'Goals Scored All-Time', value: '6,841', color: 'text-green-400' },
  { icon: TrendingUp, label: 'Players Registered Ever', value: '342', color: 'text-purple-400' },
];

export default function LeagueRecords() {
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    base44.entities.Season.list().then(setSeasons);
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" /> League Records
        </h1>
        <p className="text-muted-foreground mt-1">Historical achievements, season winners, and all-time milestones</p>
      </div>

      {/* Milestones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {milestones.map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
            <m.icon className={`w-6 h-6 ${m.color}`} />
            <div className="text-2xl font-bold font-mono">{m.value}</div>
            <div className="text-xs text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Hall of Champions */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Crown className="w-5 h-5 text-primary" /> Hall of Champions</h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3 text-muted-foreground font-medium">Season</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Champion</th>
                <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Runner-Up</th>
                <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">MVP</th>
                <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Top Goals</th>
              </tr>
            </thead>
            <tbody>
              {trophyData.map((row, i) => (
                <tr key={row.season} className="border-t border-border hover:bg-secondary/20 transition-colors">
                  <td className="p-3 font-mono text-xs text-muted-foreground">{row.season}</td>
                  <td className="p-3 font-semibold flex items-center gap-2">
                    {i === 0 && <Crown className="w-4 h-4 text-primary shrink-0" />}
                    {row.champion}
                  </td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{row.runnerUp}</td>
                  <td className="p-3 hidden md:table-cell">{row.mvp}</td>
                  <td className="p-3 font-mono hidden md:table-cell">{row.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Seasons */}
      {seasons.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Medal className="w-5 h-5 text-primary" /> Registered Seasons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {seasons.map(s => (
              <div key={s.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.start_date} → {s.end_date}</div>
                </div>
                {s.is_active && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">Active</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
