import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PlayerTiles from '@/components/scorekeeper/PlayerTiles';

const PENALTY_TYPES = ['Tripping', 'Hooking', 'Slashing', 'Roughing', 'Holding', 'Interference', 'Cross-checking', 'High-sticking', 'Boarding', 'Unsportsmanlike', 'Delay of Game', 'Too Many Men', 'Other'];

export default function PenaltyDialog({ open, onClose, teamPlayers, teamName, onConfirm }) {
  const [player, setPlayer] = useState([]);
  const [minutes, setMinutes] = useState('2');
  const [penaltyType, setPenaltyType] = useState('');

  const handleConfirm = () => {
    onConfirm({
      player_id: player[0] || null,
      penalty_minutes: parseInt(minutes),
      penalty_type: penaltyType,
    });
    setPlayer([]);
    setMinutes('2');
    setPenaltyType('');
  };

  const handleClose = () => {
    setPlayer([]);
    setMinutes('2');
    setPenaltyType('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">⚠️ Penalty — {teamName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <PlayerTiles
            label="Penalized Player"
            players={teamPlayers}
            selectedIds={player}
            onSelect={setPlayer}
            maxSelect={1}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1 block">Minutes</label>
              <Select value={minutes} onValueChange={setMinutes}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 min (Minor)</SelectItem>
                  <SelectItem value="4">4 min (Double Minor)</SelectItem>
                  <SelectItem value="5">5 min (Major)</SelectItem>
                  <SelectItem value="10">10 min (Misconduct)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1 block">Type</label>
              <Select value={penaltyType} onValueChange={setPenaltyType}>
                <SelectTrigger className="bg-card"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {PENALTY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirm} className="bg-red-600 hover:bg-red-700 text-white">
            Confirm Penalty
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}