import React, { useState, useEffect } from 'react';
import { gasClient as base44 } from '@/api/gasClient';
import { BookOpen, ChevronDown, ChevronUp, Scale, Target, AlignLeft } from 'lucide-react';

const globalRules = [
  {
    category: 'Game Format',
    icon: Target,
    rules: [
      'All regular season games consist of 3 periods of 20 minutes each (running clock).',
      'Playoff games use a stop-clock format for the 3rd period and overtime.',
      'Each team must have a minimum of 6 skaters (including goalie) to start a game.',
      'Teams arriving more than 15 minutes late forfeit the game.',
    ],
  },
  {
    category: 'Scoring',
    icon: AlignLeft,
    rules: [
      'Win = 2 points | OT/Shootout Win = 2 points | OT/Shootout Loss = 1 point | Regulation Loss = 0 points.',
      'Forfeit = 5–0 result for the opposing team.',
      'All goals scored during a power play are recorded as PPG.',
      'Goals scored while shorthanded are recorded as SHG.',
    ],
  },
  {
    category: 'Tie-Breaking Criteria',
    icon: Scale,
    rules: [
      '1. Points accumulated during regular season.',
      '2. Head-to-head record between tied teams.',
      '3. Goal differential (GF − GA) in all games.',
      '4. Total goals scored in all games.',
      '5. Fewest penalty minutes accumulated.',
      '6. Coin toss administered by the league commissioner.',
    ],
  },
];

const divisionRules = {
  Recreational: [
    'No body contact or checking allowed.',
    'Slap shots are prohibited in all recreational division games.',
    'Penalties result in a 2-minute bench minor — no power plays.',
    'Score is not officially tracked; participation is the primary goal.',
  ],
  Intermediate: [
    'Light contact is permitted along the boards.',
    'Standard IIHF penalty rules apply.',
    'Teams are required to submit a roster of at least 10 players.',
    'Playoffs include top 4 teams per division bracket.',
  ],
  Competitive: [
    'Full checking is allowed as per IIHF regulations.',
    'Video review may be requested by team captains for disputed goals.',
    'Line changes must be completed within 30 seconds of whistle.',
    'A minimum of 3 referees is required for all competitive games.',
  ],
  Elite: [
    'Elite division follows full IIHF Official Rules of Ice Hockey.',
    'All players must hold a valid league registration and medical clearance.',
    'Video review is mandatory for all playoff games.',
    'Suspensions carry over across seasons in the Elite division.',
  ],
};

export default function DivisionRules() {
  const [divisions, setDivisions] = useState([]);
  const [openSection, setOpenSection] = useState(null);
  const [openDiv, setOpenDiv] = useState(null);

  useEffect(() => {
    base44.entities.Division.list().then(setDivisions);
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" /> Division Rules
        </h1>
        <p className="text-muted-foreground mt-1">Official competition rules, tie-breaking criteria, and scoring regulations</p>
      </div>

      {/* Global Rules */}
      <div>
        <h2 className="text-lg font-bold mb-3">General League Rules</h2>
        <div className="space-y-3">
          {globalRules.map((section, i) => (
            <div key={section.category} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-secondary/20 transition-colors"
                onClick={() => setOpenSection(openSection === i ? null : i)}
              >
                <div className="flex items-center gap-3">
                  <section.icon className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{section.category}</span>
                </div>
                {openSection === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {openSection === i && (
                <ul className="px-5 pb-4 space-y-2 border-t border-border pt-3">
                  {section.rules.map((r, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span> {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Per-Division Rules */}
      <div>
        <h2 className="text-lg font-bold mb-3">Division-Specific Rules</h2>
        <div className="space-y-3">
          {['Recreational', 'Intermediate', 'Competitive', 'Elite'].map((level) => {
            const divMatches = divisions.filter(d => d.level === level);
            const rules = divisionRules[level] || [];
            return (
              <div key={level} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-secondary/20 transition-colors"
                  onClick={() => setOpenDiv(openDiv === level ? null : level)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{level}</span>
                    {divMatches.length > 0 && (
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {divMatches.map(d => d.name).join(', ')}
                      </span>
                    )}
                  </div>
                  {openDiv === level ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {openDiv === level && (
                  <ul className="px-5 pb-4 space-y-2 border-t border-border pt-3">
                    {rules.map((r, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-0.5">•</span> {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
