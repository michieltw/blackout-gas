import React from 'react';

export default function PlayerTiles({ players, selectedIds = [], onSelect, maxSelect = 1, label = '' }) {
  const handleClick = (playerId) => {
    if (selectedIds.includes(playerId)) {
      onSelect(selectedIds.filter(id => id !== playerId));
    } else if (selectedIds.length < maxSelect) {
      onSelect([...selectedIds, playerId]);
    } else if (maxSelect === 1) {
      onSelect([playerId]);
    }
  };

  return (
    <div>
      {label && <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {players.map(player => {
          const isSelected = selectedIds.includes(player.id);
          return (
            <button
              key={player.id}
              onClick={() => handleClick(player.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border
                ${isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                  : 'bg-card border-border hover:border-primary/40 hover:bg-secondary'
                }`}
            >
              <span className="font-bold mr-1">#{player.jersey_number || '?'}</span>
              <span>{player.last_name}</span>
            </button>
          );
        })}
        {players.length === 0 && <p className="text-xs text-muted-foreground">No players available</p>}
      </div>
    </div>
  );
}
