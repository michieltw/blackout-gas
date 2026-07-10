import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Timer, Users, Calendar, Shield, Star } from 'lucide-react';

const sections = [
  {
    id: 'scorekeeper',
    icon: Timer,
    title: 'Using the Scorekeeper',
    color: 'text-primary',
    articles: [
      {
        q: 'How do I start a live game?',
        a: 'Navigate to the Scorekeeper page and select an upcoming game from the dropdown. Press "Start Game" to set the status to Live. The clock will begin once you press the green Play button.',
      },
      {
        q: 'How do I log a goal?',
        a: 'Click the "Goal" button in the action panel. A dialog will appear letting you select the scoring team, the goal scorer, and up to two assistants. Choose the goal type (EV, PPG, SHG, EN, or PS) and confirm.',
      },
      {
        q: 'How do I undo the last event?',
        a: 'In the Event Log panel on the right side, find the last entry and click the trash icon next to it. This removes the event and recalculates the score automatically.',
      },
      {
        q: 'How do I record a penalty?',
        a: 'Click the "Penalty" button, select the offending team and player, then enter the infraction type and minutes. The penalty timer will appear in the Penalty Timers panel and count down in real-time.',
      },
      {
        q: 'How do I advance to the next period?',
        a: 'When the clock reaches 00:00 or you want to end a period manually, click "End Period". Confirm the period end and the system will automatically switch to the next period.',
      },
    ],
  },
  {
    id: 'rsvp',
    icon: Calendar,
    title: 'Managing RSVPs',
    color: 'text-blue-400',
    articles: [
      {
        q: 'How does the RSVP system work?',
        a: 'Each player can be assigned an RSVP status (Attending, Absent, or Pending) for every scheduled game. Managers can view and update these from the Dashboard or the Schedule page.',
      },
      {
        q: 'How do I mark a player as attending?',
        a: 'Open the game on the Schedule page and find the RSVP panel. Click the status badge next to the player\'s name to cycle through Pending → Attending → Absent.',
      },
      {
        q: 'Can I send RSVP reminders?',
        a: 'Yes. In the Schedule page, open any upcoming game and click "Send Reminders" to trigger an email notification to all players still marked as Pending.',
      },
    ],
  },
  {
    id: 'teams',
    icon: Shield,
    title: 'Team Management',
    color: 'text-green-400',
    articles: [
      {
        q: 'How do I move a player to a different team?',
        a: 'Go to the Teams page, open the player\'s current team, and click the "Move" button next to the player. Select the destination team from the dropdown and confirm.',
      },
      {
        q: 'How do I change a player\'s status?',
        a: 'On the Team Detail page, each player row has a status dropdown. Select Active, Inactive, Injured, or Suspended to update immediately.',
      },
      {
        q: 'How do I bulk-update players in Admin?',
        a: 'In the Admin Panel under the Players tab, check the boxes next to the players you want to update. An action bar will appear at the top with options to change team or status for all selected players at once.',
      },
    ],
  },
  {
    id: 'xp',
    icon: Star,
    title: 'XP & Gamification',
    color: 'text-purple-400',
    articles: [
      {
        q: 'How is XP calculated?',
        a: 'XP is earned based on game events: goals, assists, and attendance are the primary sources. The more you play and contribute, the faster you level up.',
      },
      {
        q: 'What are levels and titles?',
        a: 'Players progress through levels as they accumulate XP. Each level threshold unlocks a new title (e.g., Rookie → Pro → Elite). View your current level on your Profile page.',
      },
      {
        q: 'Where can I see the top players?',
        a: 'Visit the Gamification Hall page to see the full leaderboard of top-ranked players by XP and level.',
      },
    ],
  },
];

function Section({ section }) {
  const [open, setOpen] = useState(null);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-secondary/20">
        <section.icon className={`w-5 h-5 ${section.color}`} />
        <h2 className="font-bold text-base">{section.title}</h2>
        <span className="ml-auto text-xs text-muted-foreground">{section.articles.length} articles</span>
      </div>
      <div className="divide-y divide-border">
        {section.articles.map((a, i) => (
          <div key={i}>
            <button
              className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-secondary/20 transition-colors"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-medium text-sm">{a.q}</span>
              {open === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{a.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HelpCenter() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-primary" /> Help Center
        </h1>
        <p className="text-muted-foreground mt-1">Guides and answers for everything in Blackout League Manager</p>
      </div>

      <div className="space-y-4">
        {sections.map(s => <Section key={s.id} section={s} />)}
      </div>
    </div>
  );
}
