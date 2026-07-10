import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gasClient as base44 } from '@/api/gasClient';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Square, RefreshCw, ArrowLeftRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import IceRink from '@/components/scorekeeper/IceRink';
import GameClock from '@/components/scorekeeper/GameClock';
import PlayerTiles from '@/components/scorekeeper/PlayerTiles';
import PenaltyTimers from '@/components/scorekeeper/PenaltyTimers';
import EventLog from '@/components/scorekeeper/EventLog';
import GoalDialog from '@/components/scorekeeper/GoalDialog';
import PenaltyDialog from '@/components/scorekeeper/PenaltyDialog';
import LiveBadge from '@/components/ui/LiveBadge';
import { formatGameTime, determineGoalType } from '@/lib/gameHelpers';
import { snakeDraft } from '@/lib/xp';

export default function Scorekeeper() {
  const { toast } = useToast();
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active game
  const [activeGame, setActiveGame] = useState(null);
  const [events, setEvents] = useState([]);
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);

  // Clock
  const clockRef = useRef(null);

  // Dialogs
  const [goalDialog, setGoalDialog] = useState(null); // { teamId, side, x, y }
  const [penaltyDialog, setPenaltyDialog] = useState(null); // { teamId }
  const [newGameDialog, setNewGameDialog] = useState(false);
  const [confirmEndGame, setConfirmEndGame] = useState(false);
  const [confirmNextPeriod, setConfirmNextPeriod] = useState(false);

  // New game form
  const [newGameType, setNewGameType] = useState('Quick Game');
  const [newHomeTeam, setNewHomeTeam] = useState('');
  const [newAwayTeam, setNewAwayTeam] = useState('');

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));

  useEffect(() => {
    Promise.all([
      base44.entities.Game.list('-created_date', 20),
      base44.entities.Team.list(),
      base44.entities.Player.list(),
    ]).then(([g, t, p]) => {
      setGames(g);
      setTeams(t);
      setPlayers(p);
    }).finally(() => setLoading(false));
  }, []);

  const loadGameData = useCallback(async (gameId) => {
    const [game, evts] = await Promise.all([
      base44.entities.Game.get(gameId),
      base44.entities.GameEvent.filter({ game_id: gameId }, 'created_date'),
    ]);
    setActiveGame(game);
    setEvents(evts);
    if (game.home_team_id) {
      const hp = players.filter(p => p.team_id === game.home_team_id && p.status === 'Active');
      setHomePlayers(hp);
    }
    if (game.away_team_id) {
      const ap = players.filter(p => p.team_id === game.away_team_id && p.status === 'Active');
      setAwayPlayers(ap);
    }
  }, [players]);

  // Use a ref to always have the latest time for periodic saves (avoids stale closure)
  const activeGameRef = useRef(null);
  useEffect(() => { activeGameRef.current = activeGame; }, [activeGame]);

  // Clock tick
  useEffect(() => {
    if (activeGame?.is_clock_running && activeGame.period_time_remaining > 0) {
      clockRef.current = setInterval(() => {
        setActiveGame(prev => {
          if (!prev || prev.period_time_remaining <= 0) return prev;
          return { ...prev, period_time_remaining: prev.period_time_remaining - 1 };
        });
      }, 1000);
      return () => clearInterval(clockRef.current);
    }
    return () => clearInterval(clockRef.current);
  }, [activeGame?.is_clock_running]);

  // Save time to DB every 10s using ref (no stale closure)
  useEffect(() => {
    if (!activeGame?.is_clock_running) return;
    const interval = setInterval(() => {
      const g = activeGameRef.current;
      if (g) base44.entities.Game.update(g.id, { period_time_remaining: g.period_time_remaining });
    }, 10000);
    return () => clearInterval(interval);
  }, [activeGame?.is_clock_running]);

  const toggleClock = async () => {
    const running = !activeGame.is_clock_running;
    await base44.entities.Game.update(activeGame.id, { is_clock_running: running, period_time_remaining: activeGame.period_time_remaining });
    setActiveGame(prev => ({ ...prev, is_clock_running: running }));

    if (running && events.length === 0) {
      const evt = await base44.entities.GameEvent.create({
        game_id: activeGame.id,
        event_type: 'Game Start',
        period: activeGame.current_period,
        game_time: formatGameTime(activeGame.period_time_remaining),
      });
      setEvents(prev => [...prev, evt]);
    }
  };

  const nextPeriod = async () => {
    const endEvt = await base44.entities.GameEvent.create({
      game_id: activeGame.id,
      event_type: 'Period End',
      period: activeGame.current_period,
      game_time: formatGameTime(activeGame.period_time_remaining),
    });

    const newPeriod = activeGame.current_period + 1;
    await base44.entities.Game.update(activeGame.id, {
      current_period: newPeriod,
      period_time_remaining: 1200,
      is_clock_running: false,
      home_attacks_left: !activeGame.home_attacks_left,
    });

    const startEvt = await base44.entities.GameEvent.create({
      game_id: activeGame.id,
      event_type: 'Period Start',
      period: newPeriod,
      game_time: '20:00',
    });

    setActiveGame(prev => ({
      ...prev,
      current_period: newPeriod,
      period_time_remaining: 1200,
      is_clock_running: false,
      home_attacks_left: !prev.home_attacks_left,
    }));
    setEvents(prev => [...prev, endEvt, startEvt]);
  };

  const handleRinkClick = (side, x, y) => {
    if (!activeGame) return;
    const isHomeZone = activeGame.home_attacks_left ? side === 'left' : side === 'right';
    const teamId = isHomeZone ? activeGame.away_team_id : activeGame.home_team_id;
    registerShot(teamId, side, x, y);
  };

  const registerShot = async (teamId, side, x, y) => {
    const isHome = teamId === activeGame.home_team_id;
    const evt = await base44.entities.GameEvent.create({
      game_id: activeGame.id,
      event_type: 'Shot',
      team_id: teamId,
      period: activeGame.current_period,
      game_time: formatGameTime(activeGame.period_time_remaining),
      side, x_pos: x, y_pos: y,
    });

    const update = isHome
      ? { home_shots: (activeGame.home_shots || 0) + 1 }
      : { away_shots: (activeGame.away_shots || 0) + 1 };
    await base44.entities.Game.update(activeGame.id, update);
    setActiveGame(prev => ({ ...prev, ...update }));
    setEvents(prev => [...prev, evt]);
  };

  const registerGoal = async (teamId, goalData, side, x, y) => {
    const isHome = teamId === activeGame.home_team_id;
    const otherTeamId = isHome ? activeGame.away_team_id : activeGame.home_team_id;
    const goalType = determineGoalType(events, teamId, otherTeamId, activeGame.current_period, activeGame.period_time_remaining);

    const evt = await base44.entities.GameEvent.create({
      game_id: activeGame.id,
      event_type: 'Goal',
      team_id: teamId,
      player_id: goalData.player_id,
      assist1_player_id: goalData.assist1_player_id,
      assist2_player_id: goalData.assist2_player_id,
      period: activeGame.current_period,
      game_time: formatGameTime(activeGame.period_time_remaining),
      goal_type: goalType,
      side, x_pos: x, y_pos: y,
    });

    const scoreUpdate = isHome
      ? { home_score: (activeGame.home_score || 0) + 1, home_shots: (activeGame.home_shots || 0) + 1 }
      : { away_score: (activeGame.away_score || 0) + 1, away_shots: (activeGame.away_shots || 0) + 1 };
    await base44.entities.Game.update(activeGame.id, scoreUpdate);
    setActiveGame(prev => ({ ...prev, ...scoreUpdate }));
    setEvents(prev => [...prev, evt]);
    setGoalDialog(null);
    toast({ title: '🚨 GOAL!', description: `${goalType} goal scored!` });
  };

  const registerPenalty = async (teamId, penData) => {
    const penEndTimeRaw = activeGame.period_time_remaining - (penData.penalty_minutes * 60);
    let penEndPeriod = activeGame.current_period;
    let penEndTime = penEndTimeRaw;
    if (penEndTime < 0) {
      penEndPeriod += 1;
      penEndTime = 1200 + penEndTime;
    }

    const evt = await base44.entities.GameEvent.create({
      game_id: activeGame.id,
      event_type: 'Penalty',
      team_id: teamId,
      player_id: penData.player_id,
      period: activeGame.current_period,
      game_time: formatGameTime(activeGame.period_time_remaining),
      penalty_minutes: penData.penalty_minutes,
      penalty_type: penData.penalty_type,
      penalty_end_time: `${penEndPeriod}:${penEndTime}`,
    });
    setEvents(prev => [...prev, evt]);
    setPenaltyDialog(null);
    toast({ title: '⚠️ Penalty', description: `${penData.penalty_minutes} min — ${penData.penalty_type}` });
  };

  const registerTimeout = async (teamId) => {
    const evt = await base44.entities.GameEvent.create({
      game_id: activeGame.id,
      event_type: 'Timeout',
      team_id: teamId,
      period: activeGame.current_period,
      game_time: formatGameTime(activeGame.period_time_remaining),
    });
    setEvents(prev => [...prev, evt]);
    if (activeGame.is_clock_running) {
      await base44.entities.Game.update(activeGame.id, { is_clock_running: false });
      setActiveGame(prev => ({ ...prev, is_clock_running: false }));
    }
  };

  const registerFaceoff = async (teamId, won) => {
    const evt = await base44.entities.GameEvent.create({
      game_id: activeGame.id,
      event_type: 'Faceoff',
      team_id: teamId,
      period: activeGame.current_period,
      game_time: formatGameTime(activeGame.period_time_remaining),
      faceoff_won: won,
    });
    setEvents(prev => [...prev, evt]);
  };

  const deleteEvent = async (evt) => {
    await base44.entities.GameEvent.delete(evt.id);

    if (evt.event_type === 'Goal') {
      const isHome = evt.team_id === activeGame.home_team_id;
      const update = isHome
        ? { home_score: Math.max(0, (activeGame.home_score || 0) - 1), home_shots: Math.max(0, (activeGame.home_shots || 0) - 1) }
        : { away_score: Math.max(0, (activeGame.away_score || 0) - 1), away_shots: Math.max(0, (activeGame.away_shots || 0) - 1) };
      await base44.entities.Game.update(activeGame.id, update);
      setActiveGame(prev => ({ ...prev, ...update }));
    } else if (evt.event_type === 'Shot') {
      const isHome = evt.team_id === activeGame.home_team_id;
      const update = isHome
        ? { home_shots: Math.max(0, (activeGame.home_shots || 0) - 1) }
        : { away_shots: Math.max(0, (activeGame.away_shots || 0) - 1) };
      await base44.entities.Game.update(activeGame.id, update);
      setActiveGame(prev => ({ ...prev, ...update }));
    }

    setEvents(prev => prev.filter(e => e.id !== evt.id));
    toast({ title: 'Event deleted', description: 'Score and stats have been updated.' });
  };

  const endGame = async () => {
    await base44.entities.Game.update(activeGame.id, { status: 'Final', is_clock_running: false });
    const evt = await base44.entities.GameEvent.create({
      game_id: activeGame.id,
      event_type: 'Game End',
      period: activeGame.current_period,
      game_time: formatGameTime(activeGame.period_time_remaining),
    });
    setEvents(prev => [...prev, evt]);
    setActiveGame(prev => ({ ...prev, status: 'Final', is_clock_running: false }));
    toast({ title: 'Game ended!', description: 'Final score has been recorded.' });
  };

  const createQuickGame = async () => {
    if (newGameType !== 'Open Practice' && newHomeTeam && newAwayTeam && newHomeTeam === newAwayTeam) {
      toast({ title: 'Invalid teams', description: 'Home and away team cannot be the same.', variant: 'destructive' });
      return;
    }
    const gameData = {
      game_type: newGameType,
      status: 'Live',
      home_team_id: newHomeTeam || undefined,
      away_team_id: newAwayTeam || undefined,
      scheduled_date: new Date().toISOString(),
    };
    const game = await base44.entities.Game.create(gameData);
    setNewGameDialog(false);
    setNewGameType('Quick Game');
    setNewHomeTeam('');
    setNewAwayTeam('');
    await loadGameData(game.id);
    toast({ title: 'Game created!', description: 'You can now start scorekeeping.' });
  };

  const autoBalance = async () => {
    const allActive = players.filter(p => p.status === 'Active');
    const { teamA, teamB } = snakeDraft(allActive);
    setHomePlayers(teamA);
    setAwayPlayers(teamB);
    toast({ title: 'Teams balanced!', description: `${teamA.length} vs ${teamB.length} players via Snake Draft.` });
  };

  const switchSides = async () => {
    await base44.entities.Game.update(activeGame.id, { home_attacks_left: !activeGame.home_attacks_left });
    setActiveGame(prev => ({ ...prev, home_attacks_left: !prev.home_attacks_left }));
  };

  const exportPDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();
    const home = teamMap[activeGame.home_team_id];
    const away = teamMap[activeGame.away_team_id];

    doc.setFontSize(20);
    doc.text('GAME SHEET', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`${home?.name || 'Home'} ${activeGame.home_score} - ${activeGame.away_score} ${away?.name || 'Away'}`, 105, 35, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(activeGame.scheduled_date || activeGame.created_date).toLocaleDateString()}`, 20, 50);
    doc.text(`Type: ${activeGame.game_type} | Status: ${activeGame.status}`, 20, 57);
    doc.text(`Shots: ${activeGame.home_shots || 0} - ${activeGame.away_shots || 0}`, 20, 64);

    let y = 80;
    doc.setFontSize(12);
    doc.text('Play-by-Play:', 20, y);
    y += 8;
    doc.setFontSize(9);
    events.forEach(evt => {
      if (y > 270) { doc.addPage(); y = 20; }
      const player = playerMap[evt.player_id];
      doc.text(`[P${evt.period} ${evt.game_time}] ${evt.event_type}${player ? ` — #${player.jersey_number || ''} ${player.last_name}` : ''}${evt.goal_type ? ` (${evt.goal_type})` : ''}`, 20, y);
      y += 6;
    });

    doc.save(`gamesheet_${activeGame.id}.pdf`);
    toast({ title: 'PDF exported!', description: 'Game sheet saved.' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Game selection view
  if (!activeGame) {
    const liveGames = games.filter(g => g.status === 'Live');
    const scheduled = games.filter(g => g.status === 'Scheduled');

    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <h1 className="text-3xl font-bold">Scorekeeper</h1>
          </div>
          <Button onClick={() => setNewGameDialog(true)} className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Quick Game
          </Button>
        </div>

        {liveGames.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><LiveBadge /> Resume Game</h2>
            <div className="space-y-2">
              {liveGames.map(g => (
                <button key={g.id} onClick={() => loadGameData(g.id)} className="w-full text-left p-4 rounded-xl border border-primary/30 bg-card hover:bg-secondary/50 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{teamMap[g.home_team_id]?.name || 'Home'} vs {teamMap[g.away_team_id]?.name || 'Away'}</span>
                    <span className="font-clock font-bold">{g.home_score} - {g.away_score}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {scheduled.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3">Start Scheduled Game</h2>
            <div className="space-y-2">
              {scheduled.map(g => (
                <button key={g.id} onClick={async () => {
                  await base44.entities.Game.update(g.id, { status: 'Live' });
                  await loadGameData(g.id);
                }} className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{teamMap[g.home_team_id]?.name || 'TBD'} vs {teamMap[g.away_team_id]?.name || 'TBD'}</span>
                    <span className="text-xs text-muted-foreground">{g.game_type}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* New Game Dialog */}
        <Dialog open={newGameDialog} onOpenChange={setNewGameDialog}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create Game</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1 block">Game Type</label>
                <Select value={newGameType} onValueChange={setNewGameType}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quick Game">Quick Game</SelectItem>
                    <SelectItem value="Practice">Practice</SelectItem>
                    <SelectItem value="Open Practice">Open Practice</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newGameType !== 'Open Practice' && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1 block">Home Team</label>
                    <Select value={newHomeTeam} onValueChange={setNewHomeTeam}>
                      <SelectTrigger className="bg-card"><SelectValue placeholder="Select team..." /></SelectTrigger>
                      <SelectContent>
                        {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1 block">Away Team</label>
                    <Select value={newAwayTeam} onValueChange={setNewAwayTeam}>
                      <SelectTrigger className="bg-card"><SelectValue placeholder="Select team..." /></SelectTrigger>
                      <SelectContent>
                        {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewGameDialog(false)}>Cancel</Button>
              <Button onClick={createQuickGame} className="bg-primary text-primary-foreground">Create & Start</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Active Game View
  const home = teamMap[activeGame.home_team_id];
  const away = teamMap[activeGame.away_team_id];
  const homePens = events.filter(e => e.event_type === 'Penalty' && e.team_id === activeGame.home_team_id);
  const awayPens = events.filter(e => e.event_type === 'Penalty' && e.team_id === activeGame.away_team_id);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setActiveGame(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">Scorekeeper</h1>
          {activeGame.status === 'Live' && <LiveBadge />}
        </div>
        <div className="flex items-center gap-1.5">
          {(activeGame.game_type === 'Open Practice' || activeGame.game_type === 'Practice') && (
            <Button variant="ghost" size="sm" onClick={autoBalance} className="text-muted-foreground hover:text-foreground text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Balance
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={switchSides} className="text-muted-foreground hover:text-foreground text-xs">
            <ArrowLeftRight className="w-3.5 h-3.5 mr-1" /> Sides
          </Button>
          <Button variant="ghost" size="sm" onClick={exportPDF} className="text-muted-foreground hover:text-foreground text-xs">
            <FileText className="w-3.5 h-3.5 mr-1" /> PDF
          </Button>
          {activeGame.status === 'Live' && (
            <Button size="sm" onClick={() => setConfirmEndGame(true)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs ml-1">
              <Square className="w-3.5 h-3.5 mr-1" /> End Game
            </Button>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/80 overflow-hidden">
        {/* Team header bar */}
        <div className="grid grid-cols-3 divide-x divide-white/5">
          <div className="p-5 text-center">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-1">{home?.name || 'Home'}</p>
            <p className="text-6xl font-black tabular-nums text-white leading-none">{activeGame.home_score}</p>
            <p className="text-[11px] text-zinc-600 mt-2 tracking-wider">SOG {activeGame.home_shots || 0}</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <GameClock
              timeRemaining={activeGame.period_time_remaining}
              period={activeGame.current_period}
              isRunning={activeGame.is_clock_running}
              onToggle={toggleClock}
              onNextPeriod={() => setConfirmNextPeriod(true)}
            />
          </div>
          <div className="p-5 text-center">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-1">{away?.name || 'Away'}</p>
            <p className="text-6xl font-black tabular-nums text-white leading-none">{activeGame.away_score}</p>
            <p className="text-[11px] text-zinc-600 mt-2 tracking-wider">SOG {activeGame.away_shots || 0}</p>
          </div>
        </div>

        {/* Penalty Timers */}
        <div className="grid grid-cols-2 divide-x divide-white/5 border-t border-white/5">
          <div className="p-3">
            <PenaltyTimers penalties={homePens} players={playerMap} currentPeriod={activeGame.current_period} timeRemaining={activeGame.period_time_remaining} />
          </div>
          <div className="p-3">
            <PenaltyTimers penalties={awayPens} players={playerMap} currentPeriod={activeGame.current_period} timeRemaining={activeGame.period_time_remaining} />
          </div>
        </div>
      </div>

      {/* Ice Rink */}
      <IceRink homeAttacksLeft={activeGame.home_attacks_left} onClickSide={handleRinkClick} />

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: home?.name || 'Home', teamId: activeGame.home_team_id },
          { label: away?.name || 'Away', teamId: activeGame.away_team_id },
        ].map(({ label, teamId }) => (
          <div key={teamId} className="rounded-xl border border-white/8 bg-zinc-900/60 p-3 space-y-2">
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-500">{label}</p>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                className="bg-white text-black hover:bg-zinc-100 font-bold text-sm h-12 w-full col-span-2"
                onClick={() => setGoalDialog({ teamId })}
              >
                🚨 GOAL
              </Button>
              <Button
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs h-10 w-full"
                onClick={() => setPenaltyDialog({ teamId })}
              >
                ⚠️ Penalty
              </Button>
              <Button
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 text-xs h-10 w-full"
                onClick={() => registerTimeout(teamId)}
              >
                ⏱ Timeout
              </Button>
              <Button
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 text-xs h-10 w-full col-span-2"
                onClick={() => registerFaceoff(teamId, true)}
              >
                🏒 Faceoff Win
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Event Log — visually separated with stronger border + header */}
      <div className="rounded-xl border-2 border-white/10 bg-zinc-900/80 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-400">Play-by-Play</h3>
          <span className="text-xs text-zinc-600 font-mono">{events.length} events</span>
        </div>
        <div className="p-4">
          <EventLog events={[...events].reverse()} players={playerMap} teams={teamMap} onDelete={deleteEvent} />
        </div>
      </div>

      <GoalDialog
        open={!!goalDialog}
        onClose={() => setGoalDialog(null)}
        teamPlayers={goalDialog?.teamId === activeGame.home_team_id ? homePlayers : awayPlayers}
        teamName={goalDialog?.teamId === activeGame.home_team_id ? (home?.name || 'Home') : (away?.name || 'Away')}
        onConfirm={(data) => registerGoal(goalDialog.teamId, data, goalDialog?.side, goalDialog?.x, goalDialog?.y)}
      />

      <PenaltyDialog
        open={!!penaltyDialog}
        onClose={() => setPenaltyDialog(null)}
        teamPlayers={penaltyDialog?.teamId === activeGame.home_team_id ? homePlayers : awayPlayers}
        teamName={penaltyDialog?.teamId === activeGame.home_team_id ? (home?.name || 'Home') : (away?.name || 'Away')}
        onConfirm={(data) => registerPenalty(penaltyDialog.teamId, data)}
      />

      {/* Confirm End Game */}
      <Dialog open={confirmEndGame} onOpenChange={setConfirmEndGame}>
        <DialogContent className="sm:max-w-xs bg-card border-border">
          <DialogHeader><DialogTitle>End Game?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will finalize the score and mark the game as complete. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmEndGame(false)}>Cancel</Button>
            <Button onClick={() => { setConfirmEndGame(false); endGame(); }} className="bg-red-600 hover:bg-red-700 text-white">End Game</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Next Period */}
      <Dialog open={confirmNextPeriod} onOpenChange={setConfirmNextPeriod}>
        <DialogContent className="sm:max-w-xs bg-card border-border">
          <DialogHeader><DialogTitle>Advance to Period {(activeGame.current_period || 1) + 1}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">The clock will reset to 20:00 and sides will switch.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmNextPeriod(false)}>Cancel</Button>
            <Button onClick={() => { setConfirmNextPeriod(false); nextPeriod(); }} className="bg-primary text-primary-foreground">Advance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
