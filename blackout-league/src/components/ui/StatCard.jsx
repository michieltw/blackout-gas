import React from 'react';

export default function StatCard({ label, value, icon: Icon, accent = false }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />}
      </div>
      <p className={`text-2xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
