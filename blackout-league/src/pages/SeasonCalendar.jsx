import React, { useState, useEffect } from 'react';
import { gasClient as base44 } from '@/api/gasClient';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import moment from 'moment';

const STATUS_COLORS = {
  Final: 'bg-green-500/20 border-green-500/40 text-green-400',
  Live: 'bg-red-500/20 border-red-500/40 text-red-400',
  Scheduled: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  Cancelled: 'bg-secondary border-border text-muted-foreground',
};

export default function SeasonCalendar() {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [current, setCurrent] = useState(moment());

  useEffect(() => {
    Promise.all([base44.entities.Game.list(), base44.entities.Team.list()])
      .then(([g, t]) => { setGames(g); setTeams(t); });
  }, []);

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));

  const startOfMonth = current.clone().startOf('month');
  const endOfMonth = current.clone().endOf('month');
  const startOfGrid = startOfMonth.clone().startOf('week');
  const endOfGrid = endOfMonth.clone().endOf('week');

  const days = [];
  const d = startOfGrid.clone();
  while (d.isSameOrBefore(endOfGrid)) {
    days.push(d.clone());
    d.add(1, 'day');
  }

  const gamesByDay = {};
  games.forEach(g => {
    if (!g.scheduled_date) return;
    const key = moment(g.scheduled_date).format('YYYY-MM-DD');
    if (!gamesByDay[key]) gamesByDay[key] = [];
    gamesByDay[key].push(g);
  });

  const [selected, setSelected] = useState(null);
  const selectedGames = selected ? (gamesByDay[selected] || []) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-primary" /> Season Calendar
        </h1>
        <p className="text-muted-foreground mt-1">All league games and sessions plotted for the active season</p>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent(c => c.clone().subtract(1, 'month'))} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">{current.format('MMMM YYYY')}</h2>
        <button onClick={() => setCurrent(c => c.clone().add(1, 'month'))} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
        ))}

        {/* Day cells */}
        {days.map(day => {
          const key = day.format('YYYY-MM-DD');
          const dayGames = gamesByDay[key] || [];
          const isToday = day.isSame(moment(), 'day');
          const isCurrentMonth = day.isSame(current, 'month');
          const isSelected = selected === key;

          return (
            <div
              key={key}
              onClick={() => setSelected(isSelected ? null : key)}
              className={`min-h-[64px] p-1.5 rounded-lg border cursor-pointer transition-all
                ${isCurrentMonth ? 'bg-card border-border' : 'bg-transparent border-transparent opacity-40'}
                ${isToday ? 'border-primary/50 ring-1 ring-primary/30' : ''}
                ${isSelected ? 'ring-2 ring-primary' : 'hover:border-primary/30'}
              `}
            >
              <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {day.format('D')}
              </div>
              <div className="space-y-0.5">
                {dayGames.slice(0, 2).map(g => {
                  const ht = teamMap[g.home_team_id];
                  const at = teamMap[g.away_team_id];
                  return (
                    <div key={g.id} className={`text-[10px] px-1 py-0.5 rounded border truncate ${STATUS_COLORS[g.status] || STATUS_COLORS.Scheduled}`}>
                      {ht?.short_name || '?'} v {at?.short_name || '?'}
                    </div>
                  );
                })}
                {dayGames.length > 2 && (
                  <div className="text-[10px] text-muted-foreground px-1">+{dayGames.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selected && selectedGames.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">{moment(selected).format('dddd, D MMMM YYYY')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedGames.map(g => {
              const ht = teamMap[g.home_team_id];
              const at = teamMap[g.away_team_id];
              return (
                <div key={g.id} className={`bg-card border rounded-xl p-4 space-y-2 ${STATUS_COLORS[g.status] || ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide">{g.game_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[g.status]}`}>{g.status}</span>
                  </div>
                  <div className="font-bold text-center text-sm">
                    {ht?.name || 'TBD'} <span className="text-muted-foreground font-normal">vs</span> {at?.name || 'TBD'}
                  </div>
                  {g.status === 'Final' && (
                    <div className="text-center font-mono font-bold text-lg">{g.home_score} – {g.away_score}</div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {g.scheduled_date && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{moment(g.scheduled_date).format('HH:mm')}</span>
                    )}
                    {g.venue && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{g.venue}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {selected && selectedGames.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-4">No games scheduled on {moment(selected).format('D MMMM')}</div>
      )}
    </div>
  );
}
