import React, { useState, useEffect } from 'react';
import { gasClient as base44 } from '@/api/gasClient';
import { Trophy, Target, TrendingUp, Shield, Flame, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateStandings, calculatePlayerStats } from '@/lib/gameHelpers';
import { getLevel, LEVEL_NAMES } from '@/lib/xp';

// ── Win streak calculator ──────────────────────────────────────────────
function getStreak(games, teamId) {
  const finished = games
    .filter(g => g.status === 'Final' && (g.home_team_id === teamId || g.away_team_id === teamId))
    .sort((a, b) => new Date(b.scheduled_date || b.created_date) - new Date(a.scheduled_date || a.created_date));

  if (!finished.length) return { count: 0, type: null };
  let count = 0;
  const firstResult = finished[0].home_team_id === teamId
    ? (finished[0].home_score > finished[0].away_score ? 'W' : 'L')
    : (finished[0].away_score > finished[0].home_score ? 'W' : 'L');

  for (const g of finished) {
    const isHome = g.home_team_id === teamId;
    const result = isHome
      ? (g.home_score > g.away_score ? 'W' : 'L')
      : (g.away_score > g.home_score ? 'W' : 'L');
    if (result === firstResult) count++;
    else break;
  }
  return { count, type: firstResult };
}

// ── Diff badge ─────────────────────────────────────────────────────────
function DiffBadge({ diff }) {
  if (diff > 0) return <span className="text-green-400 font-bold">+{diff}</span>;
  if (diff < 0) return <span className="text-red-400 font-bold">{diff}</span>;
  return <span className="text-muted-foreground">0</span>;
}

// ── Form indicator (last 5) ────────────────────────────────────────────
function FormDots({ games, teamId }) {
  const results = games
    .filter(g => g.status === 'Final' && (g.home_team_id === teamId || g.away_team_id === teamId))
    .sort((a, b) => new Date(b.scheduled_date || b.created_date) - new Date(a.scheduled_date || a.created_date))
    .slice(0, 5)
    .reverse()
    .map(g => {
      const isHome = g.home_team_id === teamId;
      return isHome ? (g.home_score > g.away_score ? 'W' : 'L') : (g.away_score > g.home_score ? 'W' : 'L');
    });

  return (
    <div className="flex gap-0.5 items-center">
      {results.map((r, i) => (
        <span key={i} className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${r === 'W' ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'}`}>
          {r}
        </span>
      ))}
    </div>
  );
}

export default function Standings() {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [divFilter, setDivFilter] = useState('all');
  const [sortKey, setSortKey] = useState('pts');

  useEffect(() => {
    Promise.all([
      base44.entities.Game.list(),
      base44.entities.Team.list(),
      base44.entities.Player.list(),
      base44.entities.GameEvent.list(),
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

  const divMap = Object.fromEntries(divisions.map(d => [d.id, d]));
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));

  // filter teams by division
  const filteredTeams = divFilter === 'all' ? teams : teams.filter(t => t.division_id === divFilter);
  const filteredGames = games.filter(g => {
    if (divFilter === 'all') return true;
    const ht = teamMap[g.home_team_id];
    const at = teamMap[g.away_team_id];
    return ht?.division_id === divFilter || at?.division_id === divFilter;
  });

  const rawStandings = calculateStandings(filteredGames, filteredTeams).map(row => ({
    ...row,
    diff: row.gf - row.ga,
    streak: getStreak(filteredGames, row.team.id),
    wpct: row.gp > 0 ? ((row.w / row.gp) * 100).toFixed(0) : 0,
  }));

  // custom sort
  const standings = [...rawStandings].sort((a, b) => {
    if (sortKey === 'pts') return b.pts - a.pts || b.w - a.w || b.diff - a.diff;
    if (sortKey === 'gf') return b.gf - a.gf;
    if (sortKey === 'diff') return b.diff - a.diff;
    if (sortKey === 'w') return b.w - a.w;
    return 0;
  });

  // Player stats with more detail
  const goalEvents = events.filter(e => e.event_type === 'Goal');
  const penaltyEvents = events.filter(e => e.event_type === 'Penalty');

  const playerStats = players.map(p => {
    const goals = goalEvents.filter(e => e.player_id === p.id).length;
    const assists = goalEvents.filter(e => e.assist1_player_id === p.id || e.assist2_player_id === p.id).length;
    const pim = penaltyEvents.filter(e => e.player_id === p.id).reduce((s, e) => s + (e.penalty_minutes || 0), 0);
    const team = teamMap[p.team_id];
    return { ...p, goals, assists, points: goals + assists, pim, team };
  }).sort((a, b) => b.points - a.points || b.goals - a.goals);

  const topScorers = playerStats.filter(p => p.points > 0).slice(0, 25);
  const topGoalies = players.filter(p => p.position === 'Goalie').map(p => {
    const team = teamMap[p.team_id];
    const teamGames = filteredGames.filter(g => g.status === 'Final' && (g.home_team_id === p.team_id || g.away_team_id === p.team_id));
    const goalsAgainst = teamGames.reduce((s, g) => {
      const isHome = g.home_team_id === p.team_id;
      return s + (isHome ? g.away_score : g.home_score);
    }, 0);
    const gp = teamGames.length;
    const gaa = gp > 0 ? (goalsAgainst / gp).toFixed(2) : '0.00';
    return { ...p, team, gp, goalsAgainst, gaa };
  }).sort((a, b) => parseFloat(a.gaa) - parseFloat(b.gaa));

  const SortBtn = ({ k, label }) => (
    <button
      onClick={() => setSortKey(k)}
      className={`flex items-center gap-1 hover:text-primary transition-colors ${sortKey === k ? 'text-primary' : 'text-muted-foreground'}`}
    >
      {label}
      {sortKey === k ? <ChevronDown className="w-3 h-3" /> : null}
    </button>
  );

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Standen & Statistieken</h1>
          <p className="text-muted-foreground text-sm mt-1">Automatisch bijgehouden op basis van gespeelde wedstrijden</p>
        </div>

        {/* Division filter */}
        <Select value={divFilter} onValueChange={setDivFilter}>
          <SelectTrigger className="w-44 bg-card">
            <SelectValue placeholder="Alle divisies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle divisies</SelectItem>
            {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      {standings.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Leider', value: standings[0]?.team.name, sub: `${standings[0]?.pts} pts`, color: standings[0]?.team.color },
            { label: 'Topscorer', value: topScorers[0] ? `${topScorers[0].first_name} ${topScorers[0].last_name}` : '—', sub: topScorers[0] ? `${topScorers[0].points} pts (${topScorers[0].goals}G ${topScorers[0].assists}A)` : '' },
            { label: 'Meeste doelpunten', value: standings.sort((a,b) => b.gf - a.gf)[0]?.team.name || '—', sub: `${standings.sort((a,b) => b.gf - a.gf)[0]?.gf || 0} doelpunten` },
          ].map((c, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{c.label}</p>
              <p className="font-bold truncate">{c.value}</p>
              <p className="text-xs text-primary mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="standings" className="w-full">
        <TabsList className="bg-secondary flex-wrap h-auto gap-1">
          <TabsTrigger value="standings"><Trophy className="w-4 h-4 mr-1" /> Ranglijst</TabsTrigger>
          <TabsTrigger value="scoring"><Target className="w-4 h-4 mr-1" /> Topscorers</TabsTrigger>
          <TabsTrigger value="goalies"><Shield className="w-4 h-4 mr-1" /> Keepers</TabsTrigger>
          <TabsTrigger value="pim"><Flame className="w-4 h-4 mr-1" /> Strafminuten</TabsTrigger>
        </TabsList>

        {/* ── TEAM STANDINGS ── */}
        <TabsContent value="standings" className="mt-6">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/60 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left p-3 w-8">#</th>
                    <th className="text-left p-3">Team</th>
                    <th className="text-center p-3">GS</th>
                    <th className="text-center p-3"><SortBtn k="w" label="W" /></th>
                    <th className="text-center p-3">V</th>
                    <th className="text-center p-3"><SortBtn k="gf" label="DV" /></th>
                    <th className="text-center p-3">DT</th>
                    <th className="text-center p-3"><SortBtn k="diff" label="+/-" /></th>
                    <th className="text-center p-3">Vorm</th>
                    <th className="text-center p-3">Reeks</th>
                    <th className="text-center p-3 text-primary"><SortBtn k="pts" label="PTS" /></th>
                  </tr>
                </thead>
                <tbody>
                  {standings.length === 0 ? (
                    <tr><td colSpan={11} className="text-center p-10 text-muted-foreground">Nog geen afgeronde wedstrijden.</td></tr>
                  ) : standings.map((row, i) => (
                    <tr key={row.team.id} className={`border-t border-border transition-colors hover:bg-secondary/20 ${i === 0 ? 'bg-primary/5' : ''}`}>
                      <td className="p-3">
                        {i === 0 ? <Trophy className="w-4 h-4 text-primary" /> : <span className="text-muted-foreground font-mono">{i + 1}</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0" style={{ backgroundColor: row.team.color || '#FFD700', color: '#000' }}>
                            {row.team.short_name?.charAt(0) || row.team.name?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{row.team.name}</p>
                            {divMap[row.team.division_id] && <p className="text-xs text-muted-foreground">{divMap[row.team.division_id].name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="text-center p-3 text-muted-foreground">{row.gp}</td>
                      <td className="text-center p-3 text-green-400 font-semibold">{row.w}</td>
                      <td className="text-center p-3 text-red-400">{row.l}</td>
                      <td className="text-center p-3">{row.gf}</td>
                      <td className="text-center p-3">{row.ga}</td>
                      <td className="text-center p-3"><DiffBadge diff={row.diff} /></td>
                      <td className="p-3"><FormDots games={filteredGames} teamId={row.team.id} /></td>
                      <td className="text-center p-3">
                        {row.streak.count > 0 && (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${row.streak.type === 'W' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                            {row.streak.type}{row.streak.count}
                          </span>
                        )}
                      </td>
                      <td className="text-center p-3">
                        <span className="text-lg font-black text-primary">{row.pts}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {standings.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              PTS: 2 per overwinning · GS = gespeeld · W = gewonnen · V = verloren · DV/DT = doelpunten voor/tegen · +/- = doelsaldo · Vorm = laatste 5 wedstrijden
            </p>
          )}
        </TabsContent>

        {/* ── TOPSCORERS ── */}
        <TabsContent value="scoring" className="mt-6">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/60 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left p-3 w-8">#</th>
                    <th className="text-left p-3">Speler</th>
                    <th className="text-left p-3">Team</th>
                    <th className="text-left p-3">Positie</th>
                    <th className="text-center p-3">D</th>
                    <th className="text-center p-3">A</th>
                    <th className="text-center p-3">SM</th>
                    <th className="text-center p-3">Lvl</th>
                    <th className="text-center p-3 text-primary">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {topScorers.length === 0 ? (
                    <tr><td colSpan={9} className="text-center p-10 text-muted-foreground">Nog geen doelpunten gescoord.</td></tr>
                  ) : topScorers.map((p, i) => (
                    <tr key={p.id} className={`border-t border-border transition-colors hover:bg-secondary/20 ${i === 0 ? 'bg-primary/5' : ''}`}>
                      <td className="p-3">
                        {i === 0 ? <Trophy className="w-4 h-4 text-primary" /> : <span className="text-muted-foreground font-mono">{i + 1}</span>}
                      </td>
                      <td className="p-3 font-medium">
                        {p.jersey_number && <span className="text-muted-foreground text-xs mr-1">#{p.jersey_number}</span>}
                        {p.first_name} {p.last_name}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {p.team && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.team.color || '#FFD700' }} />
                            {p.team.short_name || p.team.name}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{p.position}</td>
                      <td className="text-center p-3 font-semibold">{p.goals}</td>
                      <td className="text-center p-3">{p.assists}</td>
                      <td className="text-center p-3 text-orange-400">{p.pim > 0 ? p.pim : '—'}</td>
                      <td className="text-center p-3">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold" title={LEVEL_NAMES[getLevel(p.xp || 0)]}>
                          {getLevel(p.xp || 0)}
                        </span>
                      </td>
                      <td className="text-center p-3 font-black text-primary text-lg">{p.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── GOALKEEPERS ── */}
        <TabsContent value="goalies" className="mt-6">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/60 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left p-3 w-8">#</th>
                    <th className="text-left p-3">Keeper</th>
                    <th className="text-left p-3">Team</th>
                    <th className="text-center p-3">GS</th>
                    <th className="text-center p-3">DT</th>
                    <th className="text-center p-3 text-primary">GAA</th>
                  </tr>
                </thead>
                <tbody>
                  {topGoalies.length === 0 ? (
                    <tr><td colSpan={6} className="text-center p-10 text-muted-foreground">Geen keepers gevonden.</td></tr>
                  ) : topGoalies.map((p, i) => (
                    <tr key={p.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                      <td className="p-3 text-muted-foreground font-mono">{i + 1}</td>
                      <td className="p-3 font-medium">
                        {p.jersey_number && <span className="text-muted-foreground text-xs mr-1">#{p.jersey_number}</span>}
                        {p.first_name} {p.last_name}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {p.team && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.team?.color || '#FFD700' }} />
                            {p.team.short_name || p.team.name}
                          </span>
                        )}
                      </td>
                      <td className="text-center p-3">{p.gp}</td>
                      <td className="text-center p-3">{p.goalsAgainst}</td>
                      <td className="text-center p-3 font-black text-primary">{p.gaa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">GAA = Goals Against Average per gespeeld duel (teamstatistiek)</p>
        </TabsContent>

        {/* ── PENALTY MINUTES ── */}
        <TabsContent value="pim" className="mt-6">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/60 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left p-3 w-8">#</th>
                    <th className="text-left p-3">Speler</th>
                    <th className="text-left p-3">Team</th>
                    <th className="text-center p-3">D</th>
                    <th className="text-center p-3">A</th>
                    <th className="text-center p-3 text-orange-400">SM</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.filter(p => p.pim > 0).sort((a, b) => b.pim - a.pim).slice(0, 25).length === 0 ? (
                    <tr><td colSpan={6} className="text-center p-10 text-muted-foreground">Nog geen strafminuten.</td></tr>
                  ) : playerStats.filter(p => p.pim > 0).sort((a, b) => b.pim - a.pim).slice(0, 25).map((p, i) => (
                    <tr key={p.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                      <td className="p-3 text-muted-foreground font-mono">{i + 1}</td>
                      <td className="p-3 font-medium">
                        {p.jersey_number && <span className="text-muted-foreground text-xs mr-1">#{p.jersey_number}</span>}
                        {p.first_name} {p.last_name}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {p.team && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.team?.color || '#FFD700' }} />
                            {p.team.short_name || p.team.name}
                          </span>
                        )}
                      </td>
                      <td className="text-center p-3">{p.goals}</td>
                      <td className="text-center p-3">{p.assists}</td>
                      <td className="text-center p-3 font-black text-orange-400">{p.pim}'</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
