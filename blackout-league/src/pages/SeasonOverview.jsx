import React, { useState, useEffect } from 'react';
import { gasClient as base44 } from '@/api/gasClient';
import { CalendarDays, TrendingUp, Users, Target, CheckCircle2, Clock } from 'lucide-react';
import moment from 'moment';

export default function SeasonOverview() {
  const [seasons, setSeasons] = useState([]);
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Season.list(),
      base44.entities.Game.list(),
      base44.entities.Player.list(),
      base44.entities.Division.list(),
      base44.entities.Team.list(),
    ]).then(([s, g, p, d, t]) => {
      setSeasons(s); setGames(g); setPlayers(p); setDivisions(d); setTeams(t);
    });
  }, []);

  const activeSeason = seasons.find(s => s.is_active);
  const seasonGames = activeSeason ? games.filter(g => g.season_id === activeSeason.id) : games;
  const finalGames = seasonGames.filter(g => g.status === 'Final');
  const liveGames = seasonGames.filter(g => g.status === 'Live');
  const scheduledGames = seasonGames.filter(g => g.status === 'Scheduled');

  const startDate = activeSeason?.start_date ? moment(activeSeason.start_date) : null;
  const endDate = activeSeason?.end_date ? moment(activeSeason.end_date) : null;
  const today = moment();
  const totalDays = startDate && endDate ? endDate.diff(startDate, 'days') : 0;
  const elapsed = startDate ? Math.min(today.diff(startDate, 'days'), totalDays) : 0;
  const progress = totalDays > 0 ? Math.round((elapsed / totalDays) * 100) : 0;

  const stats = [
    { icon: Target, label: 'Games Played', value: finalGames.length, color: 'text-green-400' },
    { icon: Clock, label: 'Upcoming', value: scheduledGames.length, color: 'text-blue-400' },
    { icon: TrendingUp, label: 'Live Now', value: liveGames.length, color: 'text-red-400' },
    { icon: Users, label: 'Active Players', value: players.filter(p => p.status === 'Active').length, color: 'text-primary' },
  ];

  const divisionStats = divisions.map(d => ({
    ...d,
    teamCount: teams.filter(t => t.division_id === d.id).length,
    gameCount: seasonGames.filter(g => g.division_id === d.id).length,
    finishedCount: seasonGames.filter(g => g.division_id === d.id && g.status === 'Final').length,
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-primary" /> Season Overview
        </h1>
        <p className="text-muted-foreground mt-1">Active season timeline, participation milestones, and progress</p>
      </div>

      {activeSeason ? (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold">{activeSeason.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {startDate?.format('D MMM YYYY')} → {endDate?.format('D MMM YYYY')}
              </p>
            </div>
            <span className="bg-primary/20 text-primary text-sm font-semibold px-3 py-1 rounded-full">Active Season</span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Season Progress</span>
              <span>{progress}% complete ({elapsed} / {totalDays} days)</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Milestones on timeline */}
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Season Start</span>
            <span>Midpoint</span>
            <span>Playoffs</span>
            <span>Finals</span>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
          No active season found. Create one in the Admin panel.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div className="text-2xl font-bold font-mono">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Division breakdown */}
      {divisionStats.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Division Breakdown</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {divisionStats.map(d => (
              <div key={d.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{d.level}</div>
                </div>
                <div className="flex gap-4 text-sm text-right">
                  <div>
                    <div className="font-bold">{d.teamCount}</div>
                    <div className="text-xs text-muted-foreground">Teams</div>
                  </div>
                  <div>
                    <div className="font-bold">{d.finishedCount}/{d.gameCount}</div>
                    <div className="text-xs text-muted-foreground">Games</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
