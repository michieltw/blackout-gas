import React from 'react';

export default function IceRink({ homeAttacksLeft, onClickSide }) {
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const side = x < 50 ? 'left' : 'right';
    onClickSide(side, x, y);
  };

  return (
    <div
      className="relative w-full aspect-[2/1] rounded-2xl border-2 border-white/20 bg-gradient-to-b from-blue-900/30 to-blue-950/30 cursor-crosshair overflow-hidden select-none"
      onClick={handleClick}
    >
      {/* Ice surface markings */}
      <div className="absolute inset-0">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-500/60 -translate-x-1/2" />
        {/* Center circle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-blue-400/40" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400/60" />
        {/* Blue lines */}
        <div className="absolute left-[33%] top-0 bottom-0 w-0.5 bg-blue-500/50" />
        <div className="absolute left-[67%] top-0 bottom-0 w-0.5 bg-blue-500/50" />
        {/* Goal creases */}
        <div className="absolute left-[4%] top-1/2 -translate-y-1/2 w-8 h-16 border-2 border-red-400/40 rounded-r-full" />
        <div className="absolute right-[4%] top-1/2 -translate-y-1/2 w-8 h-16 border-2 border-red-400/40 rounded-l-full" />
        {/* Faceoff circles */}
        {[[20, 25], [20, 75], [80, 25], [80, 75]].map(([x, y], i) => (
          <div key={i} className="absolute w-10 h-10 rounded-full border border-red-400/30" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400/50" />
            </div>
          </div>
        ))}
      </div>

      {/* Team labels */}
      <div className="absolute top-2 left-4 text-xs font-bold text-white/70 uppercase tracking-wider">
        {homeAttacksLeft ? '← Home' : '← Away'}
      </div>
      <div className="absolute top-2 right-4 text-xs font-bold text-white/70 uppercase tracking-wider">
        {homeAttacksLeft ? 'Away →' : 'Home →'}
      </div>

      {/* Hover hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/40">
        Click side to register shot/goal
      </div>
    </div>
  );
}