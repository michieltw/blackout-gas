import React, { useState, useEffect } from 'react';
import { gasClient as base44 } from '@/api/gasClient';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Layers, Users, GripVertical, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const LINES = [
  { id: 'line1', label: 'Line 1', positions: ['LW', 'C', 'RW', 'LD', 'RD'] },
  { id: 'line2', label: 'Line 2', positions: ['LW', 'C', 'RW', 'LD', 'RD'] },
  { id: 'line3', label: 'Line 3', positions: ['LW', 'C', 'RW', 'LD', 'RD'] },
  { id: 'line4', label: 'Line 4', positions: ['LW', 'C', 'RW'] },
  { id: 'goalies', label: 'Goalies', positions: ['G1', 'G2'] },
  { id: 'scratch', label: 'Scratched', positions: [] },
];

function initSlots(lines) {
  const s = {};
  lines.forEach(l => {
    l.positions.forEach(p => { s[`${l.id}-${p}`] = null; });
  });
  return s;
}

export default function LineupBuilder() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [slots, setSlots] = useState(initSlots(LINES));
  const [bench, setBench] = useState([]);
  const [scratch, setScratch] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([base44.entities.Team.list(), base44.entities.Player.list()])
      .then(([t, p]) => { setTeams(t); setPlayers(p); });
  }, []);

  useEffect(() => {
    if (!selectedTeam) return;
    const roster = players.filter(p => p.team_id === selectedTeam && p.status === 'Active');
    const goalies = roster.filter(p => p.position === 'Goalie');
    const skaters = roster.filter(p => p.position !== 'Goalie');
    const newSlots = initSlots(LINES);
    goalies.forEach((g, i) => { if (i < 2) newSlots[`goalies-G${i + 1}`] = g; });
    setBench(skaters);
    setScratch([]);
    setSlots(newSlots);
  }, [selectedTeam, players]);

  const getPlayerById = (id) => players.find(p => p.id === id);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const player = players.find(p => p.id === draggableId);
    if (!player) return;

    // Remove from source
    const newSlots = { ...slots };
    const newBench = [...bench];
    const newScratch = [...scratch];

    if (source.droppableId === 'bench') {
      newBench.splice(source.index, 1);
    } else if (source.droppableId === 'scratch') {
      newScratch.splice(source.index, 1);
    } else {
      newSlots[source.droppableId] = null;
    }

    // If destination slot already has a player, push them back to bench
    if (destination.droppableId !== 'bench' && destination.droppableId !== 'scratch') {
      const displaced = newSlots[destination.droppableId];
      if (displaced) newBench.push(displaced);
      newSlots[destination.droppableId] = player;
    } else if (destination.droppableId === 'bench') {
      newBench.splice(destination.index, 0, player);
    } else {
      newScratch.splice(destination.index, 0, player);
    }

    setSlots(newSlots);
    setBench(newBench);
    setScratch(newScratch);
  };

  const reset = () => {
    const roster = players.filter(p => p.team_id === selectedTeam && p.status === 'Active');
    const goalies = roster.filter(p => p.position === 'Goalie');
    const skaters = roster.filter(p => p.position !== 'Goalie');
    const newSlots = initSlots(LINES);
    goalies.forEach((g, i) => { if (i < 2) newSlots[`goalies-G${i + 1}`] = g; });
    setSlots(newSlots);
    setBench(skaters);
    setScratch([]);
  };

  const save = () => {
    toast({ title: 'Lineup saved', description: 'The lineup has been recorded (local session only).' });
  };

  const PlayerChip = ({ player, isDragging }) => (
    <div className={`flex items-center gap-1.5 bg-secondary rounded-md px-2 py-1 text-xs font-medium transition-all ${isDragging ? 'shadow-lg ring-1 ring-primary scale-105' : ''}`}>
      <GripVertical className="w-3 h-3 text-muted-foreground" />
      <span className="text-muted-foreground font-mono">#{player.jersey_number ?? '—'}</span>
      <span>{player.first_name[0]}. {player.last_name}</span>
      <span className="text-[10px] text-muted-foreground">{player.position?.slice(0, 3)}</span>
    </div>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Layers className="w-8 h-8 text-primary" /> Lineup Builder
            </h1>
            <p className="text-muted-foreground mt-1">Drag and drop players into game lines and positions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset} disabled={!selectedTeam} className="gap-2"><RotateCcw className="w-4 h-4" /> Reset</Button>
            <Button onClick={save} disabled={!selectedTeam} className="gap-2"><Save className="w-4 h-4" /> Save Lineup</Button>
          </div>
        </div>

        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="bg-card max-w-xs"><SelectValue placeholder="Select a team…" /></SelectTrigger>
          <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>

        {!selectedTeam ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
            Select a team above to start building the lineup
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_220px] gap-6">
            {/* Lines */}
            <div className="space-y-3">
              {LINES.filter(l => l.id !== 'scratch').map(line => (
                <div key={line.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{line.label}</div>
                  {line.positions.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {line.positions.map(pos => {
                        const slotKey = `${line.id}-${pos}`;
                        const occupant = slots[slotKey];
                        return (
                          <Droppable key={slotKey} droppableId={slotKey}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`min-w-[120px] min-h-[52px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-1 transition-colors
                                  ${snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-border bg-secondary/20'}`}
                              >
                                <div className="text-[10px] font-bold text-muted-foreground mb-1">{pos}</div>
                                {occupant ? (
                                  <Draggable draggableId={occupant.id} index={0}>
                                    {(prov, snap) => (
                                      <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                                        <PlayerChip player={occupant} isDragging={snap.isDragging} />
                                      </div>
                                    )}
                                  </Draggable>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/50">Empty</span>
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))}

              {/* Scratch */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Scratched</div>
                <Droppable droppableId="scratch" direction="horizontal">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[44px] flex gap-2 flex-wrap rounded-lg p-2 border-2 border-dashed transition-colors
                        ${snapshot.isDraggingOver ? 'border-red-400/50 bg-red-400/5' : 'border-border bg-secondary/10'}`}
                    >
                      {scratch.map((p, i) => (
                        <Draggable key={p.id} draggableId={p.id} index={i}>
                          {(prov, snap) => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                              <PlayerChip player={p} isDragging={snap.isDragging} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {scratch.length === 0 && <span className="text-xs text-muted-foreground/50 p-1">Drag scratched players here</span>}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            {/* Bench */}
            <div className="bg-card border border-border rounded-xl p-4 self-start">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bench ({bench.length})</span>
              </div>
              <Droppable droppableId="bench">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] space-y-1.5 rounded-lg p-2 border-2 border-dashed transition-colors
                      ${snapshot.isDraggingOver ? 'border-primary/50 bg-primary/5' : 'border-border'}`}
                  >
                    {bench.map((p, i) => (
                      <Draggable key={p.id} draggableId={p.id} index={i}>
                        {(prov, snap) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                            <PlayerChip player={p} isDragging={snap.isDragging} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {bench.length === 0 && <div className="text-xs text-muted-foreground/50 p-2 text-center">All players assigned</div>}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
}
