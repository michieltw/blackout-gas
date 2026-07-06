import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Timer, Play, Square, RefreshCw, ArrowLeftRight, FileText, Target, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import IceRink from '@/components/scorekeeper/IceRink';
import GameClock from '@/components/scorekeeper/GameClock';
import PenaltyTiles from '@/components/scorekeeper/PenaltyTiles';
import PenaltyTimers from '@/components/scorekeeper/PenaltyTimers';
import EventLog from '@/components/scorekeeper/EventLog';
import GoalDialog from '@/components/scorekeeper/GoalDialog';
import PenaltyDialog from '@/components/scorekeeper/PenaltyDialog';
import LiveBadge from '@/components/ui/LiveBadge';
import { formatGameTime, determineGoalType } from '@/lib/gameHelper';
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
  const [shotDialog, setShotDialog] = useState(null);
  const [newGameDialog, setNewGameDialog] = useState(false);
  
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
    setShotDialog({ teamId, side, x, y });
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
    setShotDialog(null);
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setActiveGame(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold">Scorekeeper</h1>
          {activeGame.status === 'Live' && <LiveBadge />}
        </div>
        <div className="flex items-center gap-2">
          {(activeGame.game_type === 'Open Practice' || activeGame.game_type === 'Practice') && (
            <Button variant="outline" size="sm" onClick={autoBalance}>
              <RefreshCw className="w-4 h-4 mr-1" /> Auto Balance
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={switchSides}>
            <ArrowLeftRight className="w-4 h-4 mr-1" /> Switch Sides
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
          {activeGame.status === 'Live' && (
            <Button variant="destructive" size="sm" onClick={endGame}>
              <Square className="w-4 h-4 mr-1" /> End Game
            </Button>
          )}
        </div>
      </div>

      {/* Scoreboard + Clock */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <p className="text-sm font-bold" style={{ color: home?.color || '#FFD700' }}>{home?.name || 'Home'}</p>
            <p className="text-4xl font-black mt-1">{activeGame.home_score}</p>
            <p className="text-xs text-muted-foreground">SOG: {activeGame.home_shots || 0}</p>
          </div>
          <GameClock
            timeRemaining={activeGame.period_time_remaining}
            period={activeGame.current_period}
            isRunning={activeGame.is_clock_running}
            onToggle={toggleClock}
            onNextPeriod={nextPeriod}
          />
          <div className="text-center flex-1">
            <p className="text-sm font-bold" style={{ color: away?.color || '#FFD700' }}>{away?.name || 'Away'}</p>
            <p className="text-4xl font-black mt-1">{activeGame.away_score}</p>
            <p className="text-xs text-muted-foreground">SOG: {activeGame.away_shots || 0}</p>
          </div>
        </div>

        {/* Penalty Timers */}
        <div className="grid grid-cols-2 gap-4">
          <PenaltyTimers penalties={homePens} players={playerMap} currentPeriod={activeGame.current_period} timeRemaining={activeGame.period_time_remaining} />
          <PenaltyTimers penalties={awayPens} players={playerMap} currentPeriod={activeGame.current_period} timeRemaining={activeGame.period_time_remaining} />
        </div>
      </div>

      {/* Ice Rink */}
      <IceRink homeAttacksLeft={activeGame.home_attacks_left} onClickSide={handleRinkClick} />

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase font-medium" style={{ color: home?.color }}>{home?.name || 'Home'}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setGoalDialog({ teamId: activeGame.home_team_id })}>
              🚨 Goal
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setPenaltyDialog({ teamId: activeGame.home_team_id })}>
              ⚠️ Penalty
            </Button>
            <Button size="sm" variant="outline" onClick={() => registerTimeout(activeGame.home_team_id)}>
              ⏸️ Timeout
            </Button>
            <Button size="sm" variant="outline" onClick={() => registerFaceoff(activeGame.home_team_id, true)}>
              Won FO
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase font-medium" style={{ color: away?.color }}>{away?.name || 'Away'}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setGoalDialog({ teamId: activeGame.away_team_id })}>
              🚨 Goal
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setPenaltyDialog({ teamId: activeGame.away_team_id })}>
              ⚠️ Penalty
            </Button>
            <Button size="sm" variant="outline" onClick={() => registerTimeout(activeGame.away_team_id)}>
              ⏸️ Timeout
            </Button>
            <Button size="sm" variant="outline" onClick={() => registerFaceoff(activeGame.away_team_id, true)}>
              Won FO
            </Button>
          </div>
        </div>
      </div>

      {/* Event Log */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-muted-foreground">Play-by-Play Log</h3>
        <EventLog events={[...events].reverse()} players={playerMap} teams={teamMap} onDelete={deleteEvent} />
      </div>

      {/* Dialogs */}
      {shotDialog && (
        <Dialog open={!!shotDialog} onOpenChange={() => setShotDialog(null)}>
          <DialogContent className="sm:max-w-xs bg-card border-border">
            <DialogHeader><DialogTitle>Register Event</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Button className="w-full" variant="outline" onClick={() => {
                registerShot(shotDialog.teamId, shotDialog.side, shotDialog.x, shotDialog.y);
              }}>
                🏒 Shot on Goal
              </Button>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                setShotDialog(null);
                setGoalDialog(shotDialog);
              }}>
                🚨 GOAL!
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
    </div>
  );
}