import React, { useState, useEffect, useCallback } from 'react';
import { gasClient as base44 } from '@/api/gasClient';
import { Plus, Pencil, Trash2, Shield, Users, Calendar, Trophy, Layers, RefreshCw, Code2, Save, X, ChevronDown, ChevronRight, ToggleLeft, AlertCircle, CheckSquare, Square, ArrowRightLeft, ToggleRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { sendNewGameEmails } from '@/lib/emailNotifications';

// ── Inline editable field ──────────────────────────────────────────────
function InlineField({ label, value, type = 'text', options, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? '');

  const commit = async () => {
    await onSave(val);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => { setVal(value ?? ''); setEditing(true); }}
        className="group flex items-center gap-1 text-left hover:text-primary transition-colors"
        title={`Edit ${label}`}
      >
        <span>{value !== undefined && value !== null && value !== '' ? String(value) : <em className="text-muted-foreground/50">—</em>}</span>
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 shrink-0" />
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      {options ? (
        <select
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={commit}
          className="bg-secondary border border-primary rounded px-1 text-sm text-foreground"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          autoFocus
          type={type}
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="bg-secondary border border-primary rounded px-1 py-0.5 text-sm w-28 text-foreground"
        />
      )}
      <button onClick={commit} className="text-green-400 hover:text-green-300"><Save className="w-3 h-3" /></button>
      <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
    </span>
  );
}

// ── Raw JSON editor dialog ─────────────────────────────────────────────
function RawEditDialog({ open, record, entityName, onClose, onSaved }) {
  const { toast } = useToast();
  const [json, setJson] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (record) setJson(JSON.stringify(record, null, 2));
    setError('');
  }, [record]);

  const save = async () => {
    try {
      const parsed = JSON.parse(json);
      const { id, created_date, updated_date, created_by_id, ...fields } = parsed;
      await base44.entities[entityName].update(record.id, fields);
      toast({ title: 'Record updated via raw editor' });
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Code2 className="w-4 h-4 text-primary" /> Raw JSON Editor — {entityName}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">Edit any field directly. Built-in fields (id, dates) are ignored on save.</p>
        <Textarea
          value={json}
          onChange={e => { setJson(e.target.value); setError(''); }}
          className="font-mono text-xs h-96 bg-secondary"
        />
        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} className="bg-primary text-primary-foreground">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Entity table row ───────────────────────────────────────────────────
function EntityRow({ record, columns, entityName, onDelete, onRawEdit, onRefresh, selectable, isSelected, onToggleSelect }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const patchField = async (field, value) => {
    await base44.entities[entityName].update(record.id, { [field]: value });
    toast({ title: 'Saved', description: `${field} updated` });
    onRefresh();
  };

  return (
    <>
      <tr className={`border-b border-border hover:bg-secondary/30 transition-colors group ${isSelected ? 'bg-primary/10' : ''}`}>
        {selectable && (
          <td className="p-2 w-8">
            <button onClick={() => onToggleSelect(record.id)} className="text-muted-foreground hover:text-primary">
              {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
            </button>
          </td>
        )}
        <td className="p-2 w-6">
          <button onClick={() => setExpanded(v => !v)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </td>
        {columns.map(col => (
          <td key={col.key} className="p-2 text-sm max-w-[180px] truncate">
            {col.editable !== false ? (
              <InlineField
                label={col.label}
                value={record[col.key]}
                type={col.type || 'text'}
                options={col.options}
                onSave={val => patchField(col.key, col.type === 'number' ? (parseFloat(val) || 0) : val)}
              />
            ) : (
              <span className="text-muted-foreground text-xs">{String(record[col.key] ?? '—')}</span>
            )}
          </td>
        ))}
        <td className="p-2">
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={() => onRawEdit(record)} title="Raw JSON edit">
              <Code2 className="w-3.5 h-3.5 text-primary" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => onDelete(record.id)} title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border bg-secondary/10">
          <td colSpan={columns.length + 2} className="p-3">
            <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">{JSON.stringify(record, null, 2)}</pre>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Generic entity table ───────────────────────────────────────────────
function EntityTable({ rows, columns, entityName, onDelete, onRawEdit, onRefresh, emptyMsg, selectable, selected, onToggleSelect, onToggleAll }) {
  if (rows.length === 0) return <p className="text-muted-foreground text-sm py-4">{emptyMsg || 'No records.'}</p>;
  const allSelected = rows.length > 0 && rows.every(r => selected?.has(r.id));
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left">
        <thead className="bg-secondary/50">
          <tr>
            {selectable && (
              <th className="p-2 w-8">
                <button onClick={() => onToggleAll(rows)} className="text-muted-foreground hover:text-primary">
                  {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
            )}
            <th className="p-2 w-6" />
            {columns.map(col => <th key={col.key} className="p-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</th>)}
            <th className="p-2 w-20" />
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <EntityRow
              key={r.id}
              record={r}
              columns={columns}
              entityName={entityName}
              onDelete={onDelete}
              onRawEdit={onRawEdit}
              onRefresh={onRefresh}
              selectable={selectable}
              isSelected={selected?.has(r.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────────────────────
export default function Admin() {
  const { toast } = useToast();
  const [seasons, setSeasons] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createDialog, setCreateDialog] = useState(null); // entity type
  const [createForm, setCreateForm] = useState({});
  const [rawEdit, setRawEdit] = useState(null); // { record, entityName }
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [bulkDialog, setBulkDialog] = useState(null); // 'team' | 'status'
  const [bulkValue, setBulkValue] = useState('');

  const loadAll = useCallback(() => {
    return Promise.all([
      base44.entities.Season.list(),
      base44.entities.Division.list(),
      base44.entities.Team.list(),
      base44.entities.Player.list('-created_date', 200),
      base44.entities.Game.list('-scheduled_date', 100),
    ]).then(([s, d, t, p, g]) => {
      setSeasons(s); setDivisions(d); setTeams(t); setPlayers(p); setGames(g);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const deleteRecord = async (entityName, id) => {
    if (!window.confirm('Delete this record?')) return;
    await base44.entities[entityName].delete(id);
    toast({ title: 'Deleted' });
    loadAll();
  };

  const createRecord = async () => {
    const entityName = createDialog;
    await base44.entities[entityName].create(createForm);
    // Send emails for new scheduled games
    if (entityName === 'Game') {
      const homeTeam = teams.find(t => t.id === createForm.home_team_id);
      const awayTeam = teams.find(t => t.id === createForm.away_team_id);
      if (homeTeam || awayTeam) sendNewGameEmails(createForm, homeTeam, awayTeam).catch(() => {});
    }
    toast({ title: `${entityName} created` });
    setCreateDialog(null);
    setCreateForm({});
    loadAll();
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const playerSheet = players.map(p => ({
      '#': p.jersey_number ?? '',
      Voornaam: p.first_name,
      Achternaam: p.last_name,
      Positie: p.position,
      Team: teams.find(t => t.id === p.team_id)?.name ?? '',
      Status: p.status,
      XP: p.xp ?? 0,
      Level: p.level ?? 1,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(playerSheet), 'Spelers');

    const gameSheet = games.map(g => ({
      Datum: g.scheduled_date ? new Date(g.scheduled_date).toLocaleDateString('nl-NL') : '',
      Type: g.game_type,
      Status: g.status,
      Thuisteam: teams.find(t => t.id === g.home_team_id)?.name ?? '',
      Uitteam: teams.find(t => t.id === g.away_team_id)?.name ?? '',
      'Score Thuis': g.home_score ?? 0,
      'Score Uit': g.away_score ?? 0,
      'Shots Thuis': g.home_shots ?? 0,
      'Shots Uit': g.away_shots ?? 0,
      Periode: g.current_period ?? 1,
      Locatie: g.venue ?? '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gameSheet), 'Wedstrijden');

    const teamSheet = teams.map(t => ({
      Naam: t.name,
      Afkorting: t.short_name ?? '',
      Divisie: divisions.find(d => d.id === t.division_id)?.name ?? '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teamSheet), 'Teams');

    XLSX.writeFile(wb, `blackout-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));
  const divMap = Object.fromEntries(divisions.map(d => [d.id, d]));
  const seasonMap = Object.fromEntries(seasons.map(s => [s.id, s]));

  const togglePlayerSelect = (id) => setSelectedPlayers(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAllPlayers = (rows) => {
    const allSelected = rows.every(r => selectedPlayers.has(r.id));
    if (allSelected) setSelectedPlayers(new Set());
    else setSelectedPlayers(new Set(rows.map(r => r.id)));
  };

  const applyBulkAction = async () => {
    if (!bulkValue) return;
    const ids = [...selectedPlayers];
    const field = bulkDialog === 'team' ? 'team_id' : 'status';
    await Promise.all(ids.map(id => base44.entities.Player.update(id, { [field]: bulkValue })));
    toast({ title: `${ids.length} speler(s) bijgewerkt` });
    setSelectedPlayers(new Set());
    setBulkDialog(null);
    setBulkValue('');
    loadAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Column definitions per entity
  const seasonCols = [
    { key: 'name', label: 'Name' },
    { key: 'start_date', label: 'Start', type: 'date' },
    { key: 'end_date', label: 'End', type: 'date' },
    { key: 'is_active', label: 'Active', options: ['true', 'false'] },
  ];

  const divisionCols = [
    { key: 'name', label: 'Name' },
    { key: 'season_id', label: 'Season', editable: false, render: r => seasonMap[r.season_id]?.name },
    { key: 'level', label: 'Level', options: ['Recreational', 'Intermediate', 'Competitive', 'Elite'] },
  ];

  const teamCols = [
    { key: 'name', label: 'Name' },
    { key: 'short_name', label: 'Short' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'division_id', label: 'Division', editable: false },
  ];

  const playerCols = [
    { key: 'jersey_number', label: '#', type: 'number' },
    { key: 'first_name', label: 'First' },
    { key: 'last_name', label: 'Last' },
    { key: 'position', label: 'Position', options: ['Goalie', 'Defense', 'Forward', 'Center', 'Left Wing', 'Right Wing'] },
    { key: 'status', label: 'Status', options: ['Active', 'Inactive', 'Injured', 'Suspended'] },
    { key: 'xp', label: 'XP', type: 'number' },
    { key: 'level', label: 'Lvl', type: 'number' },
  ];

  const gameCols = [
    { key: 'game_type', label: 'Type', options: ['Regular', 'Playoff', 'Practice', 'Open Practice', 'Quick Game'] },
    { key: 'status', label: 'Status', options: ['Scheduled', 'Live', 'Final', 'Cancelled'] },
    { key: 'home_score', label: 'Home', type: 'number' },
    { key: 'away_score', label: 'Away', type: 'number' },
    { key: 'home_shots', label: 'SOG H', type: 'number' },
    { key: 'away_shots', label: 'SOG A', type: 'number' },
    { key: 'current_period', label: 'Period', type: 'number' },
    { key: 'venue', label: 'Venue' },
  ];

  const tabs = [
    { id: 'games', label: 'Games', icon: Calendar, data: games, cols: gameCols, entity: 'Game', count: games.length },
    { id: 'players', label: 'Players', icon: Users, data: players, cols: playerCols, entity: 'Player', count: players.length },
    { id: 'teams', label: 'Teams', icon: Shield, data: teams, cols: teamCols, entity: 'Team', count: teams.length },
    { id: 'divisions', label: 'Divisions', icon: Trophy, data: divisions, cols: divisionCols, entity: 'Division', count: divisions.length },
    { id: 'seasons', label: 'Seasons', icon: Layers, data: seasons, cols: seasonCols, entity: 'Season', count: seasons.length },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-screen-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Click any cell to edit inline · hover a row for raw JSON editor · all changes persist immediately</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-1" /> Exporteer Excel
          </Button>
          <Button variant="outline" size="sm" onClick={loadAll}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Games', val: games.length },
          { label: 'Players', val: players.length },
          { label: 'Teams', val: teams.length },
          { label: 'Divisions', val: divisions.length },
          { label: 'Seasons', val: seasons.length },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{s.val}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="games">
        <TabsList className="bg-secondary flex-wrap h-auto gap-1">
          {tabs.map(t => (
            <TabsTrigger key={t.id} value={t.id}>
              <t.icon className="w-4 h-4 mr-1" />
              {t.label}
              <span className="ml-1.5 text-xs bg-border rounded-full px-1.5 py-0.5">{t.count}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-bold text-lg">{tab.label}</h2>
              <div className="flex items-center gap-2">
                {tab.id === 'players' && selectedPlayers.size > 0 && (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5">
                    <span className="text-sm font-semibold text-primary">{selectedPlayers.size} geselecteerd</span>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setBulkDialog('team'); setBulkValue(''); }}>
                      <ArrowRightLeft className="w-3 h-3" /> Verplaats naar team
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setBulkDialog('status'); setBulkValue(''); }}>
                      <ToggleRight className="w-3 h-3" /> Status wijzigen
                    </Button>
                    <button onClick={() => setSelectedPlayers(new Set())} className="text-muted-foreground hover:text-foreground ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <Button size="sm" onClick={() => { setCreateDialog(tab.entity); setCreateForm({}); }}>
                  <Plus className="w-4 h-4 mr-1" /> New {tab.entity}
                </Button>
              </div>
            </div>

            <EntityTable
              rows={tab.data}
              columns={tab.cols}
              entityName={tab.entity}
              onDelete={id => deleteRecord(tab.entity, id)}
              onRawEdit={record => setRawEdit({ record, entityName: tab.entity })}
              onRefresh={loadAll}
              selectable={tab.id === 'players'}
              selected={tab.id === 'players' ? selectedPlayers : undefined}
              onToggleSelect={togglePlayerSelect}
              onToggleAll={toggleAllPlayers}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Raw JSON Editor */}
      <RawEditDialog
        open={!!rawEdit}
        record={rawEdit?.record}
        entityName={rawEdit?.entityName}
        onClose={() => setRawEdit(null)}
        onSaved={loadAll}
      />

      {/* Bulk Action Dialog */}
      <Dialog open={!!bulkDialog} onOpenChange={() => { setBulkDialog(null); setBulkValue(''); }}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {bulkDialog === 'team' ? 'Spelers verplaatsen naar team' : 'Status wijzigen'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{selectedPlayers.size} speler(s) geselecteerd</p>
          {bulkDialog === 'team' ? (
            <Select value={bulkValue} onValueChange={setBulkValue}>
              <SelectTrigger className="bg-card"><SelectValue placeholder="Kies team…" /></SelectTrigger>
              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <Select value={bulkValue} onValueChange={setBulkValue}>
              <SelectTrigger className="bg-card"><SelectValue placeholder="Kies status…" /></SelectTrigger>
              <SelectContent>
                {['Active', 'Inactive', 'Injured', 'Suspended'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBulkDialog(null); setBulkValue(''); }}>Annuleren</Button>
            <Button onClick={applyBulkAction} disabled={!bulkValue} className="bg-primary text-primary-foreground">Toepassen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={!!createDialog} onOpenChange={() => { setCreateDialog(null); setCreateForm({}); }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New {createDialog}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {createDialog === 'Season' && (
              <>
                <Input placeholder="Season Name *" value={createForm.name || ''} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} className="bg-card" />
                <Input type="date" placeholder="Start date" value={createForm.start_date || ''} onChange={e => setCreateForm({ ...createForm, start_date: e.target.value })} className="bg-card" />
                <Input type="date" placeholder="End date" value={createForm.end_date || ''} onChange={e => setCreateForm({ ...createForm, end_date: e.target.value })} className="bg-card" />
              </>
            )}
            {createDialog === 'Division' && (
              <>
                <Input placeholder="Division Name *" value={createForm.name || ''} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} className="bg-card" />
                <Select value={createForm.season_id || ''} onValueChange={v => setCreateForm({ ...createForm, season_id: v })}>
                  <SelectTrigger className="bg-card"><SelectValue placeholder="Season *" /></SelectTrigger>
                  <SelectContent>{seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={createForm.level || 'Recreational'} onValueChange={v => setCreateForm({ ...createForm, level: v })}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Recreational', 'Intermediate', 'Competitive', 'Elite'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </>
            )}
            {createDialog === 'Team' && (
              <>
                <Input placeholder="Team Name *" value={createForm.name || ''} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} className="bg-card" />
                <Input placeholder="Short Name (e.g. BLK)" value={createForm.short_name || ''} onChange={e => setCreateForm({ ...createForm, short_name: e.target.value })} className="bg-card" />
                <Select value={createForm.division_id || ''} onValueChange={v => setCreateForm({ ...createForm, division_id: v })}>
                  <SelectTrigger className="bg-card"><SelectValue placeholder="Division *" /></SelectTrigger>
                  <SelectContent>{divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Team Color</label>
                  <Input type="color" value={createForm.color || '#FFD700'} onChange={e => setCreateForm({ ...createForm, color: e.target.value })} className="h-10 w-24 p-1 bg-card" />
                </div>
              </>
            )}
            {createDialog === 'Player' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="First Name *" value={createForm.first_name || ''} onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })} className="bg-card" />
                  <Input placeholder="Last Name *" value={createForm.last_name || ''} onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })} className="bg-card" />
                </div>
                <Input type="number" placeholder="Jersey #" value={createForm.jersey_number || ''} onChange={e => setCreateForm({ ...createForm, jersey_number: parseInt(e.target.value) || undefined })} className="bg-card" />
                <Select value={createForm.position || 'Forward'} onValueChange={v => setCreateForm({ ...createForm, position: v })}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Goalie', 'Defense', 'Forward', 'Center', 'Left Wing', 'Right Wing'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={createForm.team_id || ''} onValueChange={v => setCreateForm({ ...createForm, team_id: v })}>
                  <SelectTrigger className="bg-card"><SelectValue placeholder="Team *" /></SelectTrigger>
                  <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" placeholder="XP (default 0)" value={createForm.xp ?? ''} onChange={e => setCreateForm({ ...createForm, xp: parseInt(e.target.value) || 0 })} className="bg-card" />
              </>
            )}
            {createDialog === 'Game' && (
              <>
                <Select value={createForm.game_type || 'Regular'} onValueChange={v => setCreateForm({ ...createForm, game_type: v })}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Regular', 'Playoff', 'Practice', 'Open Practice', 'Quick Game'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={createForm.home_team_id || ''} onValueChange={v => setCreateForm({ ...createForm, home_team_id: v })}>
                    <SelectTrigger className="bg-card"><SelectValue placeholder="Home Team" /></SelectTrigger>
                    <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={createForm.away_team_id || ''} onValueChange={v => setCreateForm({ ...createForm, away_team_id: v })}>
                    <SelectTrigger className="bg-card"><SelectValue placeholder="Away Team" /></SelectTrigger>
                    <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Home Score" value={createForm.home_score ?? ''} onChange={e => setCreateForm({ ...createForm, home_score: parseInt(e.target.value) || 0 })} className="bg-card" />
                  <Input type="number" placeholder="Away Score" value={createForm.away_score ?? ''} onChange={e => setCreateForm({ ...createForm, away_score: parseInt(e.target.value) || 0 })} className="bg-card" />
                </div>
                <Input type="datetime-local" value={createForm.scheduled_date ? createForm.scheduled_date.slice(0, 16) : ''} onChange={e => setCreateForm({ ...createForm, scheduled_date: e.target.value })} className="bg-card" />
                <Input placeholder="Venue" value={createForm.venue || ''} onChange={e => setCreateForm({ ...createForm, venue: e.target.value })} className="bg-card" />
                <Select value={createForm.status || 'Scheduled'} onValueChange={v => setCreateForm({ ...createForm, status: v })}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Scheduled', 'Live', 'Final', 'Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialog(null); setCreateForm({}); }}>Cancel</Button>
            <Button onClick={createRecord} className="bg-primary text-primary-foreground">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
