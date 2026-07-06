import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PlayerTiles from '@/components/scorekeeper/PlayerTiles';

export default function GoalDialog({ open, onClose, teamPlayers, teamName, onConfirm }) {
  const [scorer, setScorer] = useState([]);
  const [assist1, setAssist1] = useState([]);
  const [assist2, setAssist2] = useState([]);

  const handleConfirm = () => {
    onConfirm({
      player_id: scorer[0] || null,
      assist1_player_id: assist1[0] || null,
      assist2_player_id: assist2[0] || null,
    });
    setScorer([]);
    setAssist1([]);
    setAssist2([]);
  };

  const handleClose = () => {
    setScorer([]);
    setAssist1([]);
    setAssist2([]);
    onClose();
  };

  const availableForA1 = teamPlayers.filter(p => !scorer.includes(p.id));
  const availableForA2 = teamPlayers.filter(p => !scorer.includes(p.id) && !assist1.includes(p.id));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">🚨 GOAL — {teamName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <PlayerTiles
            label="Goal Scorer *"
            players={teamPlayers}
            selectedIds={scorer}
            onSelect={setScorer}
            maxSelect={1}
          />
          <PlayerTiles
            label="1st Assist (optional)"
            players={availableForA1}
            selectedIds={assist1}
            onSelect={setAssist1}
            maxSelect={1}
          />
          <PlayerTiles
            label="2nd Assist (optional)"
            players={availableForA2}
            selectedIds={assist2}
            onSelect={setAssist2}
            maxSelect={1}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white">
            Confirm Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}