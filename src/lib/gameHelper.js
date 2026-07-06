import { base44 } from '@/api/base44Client';

/**
 * Send a "new game scheduled" email to all players of the involved teams.
 */
export async function sendNewGameEmails(game, homeTeam, awayTeam) {
  const [allPlayers, allUsers] = await Promise.all([
    base44.entities.Player.list(),
    base44.entities.User.list(),
  ]);

  const teamIds = [game.home_team_id, game.away_team_id].filter(Boolean);
  const involvedPlayers = allPlayers.filter(p => teamIds.includes(p.team_id) && p.user_id);
  const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));

  const dateStr = game.scheduled_date
    ? new Date(game.scheduled_date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : 'Datum TBD';

  const promises = involvedPlayers.map(player => {
    const user = userMap[player.user_id];
    if (!user?.email) return null;

    const subject = `📅 Nieuwe wedstrijd gepland — ${homeTeam?.name || 'Thuis'} vs ${awayTeam?.name || 'Uit'}`;
    const body = `
Hoi ${player.first_name},

Er is een nieuwe wedstrijd ingepland voor jouw team!

🏒 ${homeTeam?.name || 'Thuis'} vs ${awayTeam?.name || 'Uit'}
📅 ${dateStr}
📍 ${game.venue || 'Locatie TBD'}
🏷️ Type: ${game.game_type}

Vergeet niet je RSVP in te vullen via de Blackout League Manager app.

Succes op het ijs! 🏆

— Blackout League Manager
    `.trim();

    return base44.integrations.Core.SendEmail({ to: user.email, subject, body });
  });

  await Promise.all(promises.filter(Boolean));
}

/**
 * Send an RSVP confirmation email to the player.
 */
export async function sendRsvpEmail(player, userEmail, game, homeTeam, awayTeam, newStatus) {
  if (!userEmail) return;

  const dateStr = game.scheduled_date
    ? new Date(game.scheduled_date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : 'Datum TBD';

  const statusText = newStatus === 'Attending' ? '✅ Aanwezig' : '❌ Afwezig';

  const subject = `RSVP bevestigd — ${homeTeam?.name || 'Thuis'} vs ${awayTeam?.name || 'Uit'}`;
  const body = `
Hoi ${player.first_name},

Je RSVP is bijgewerkt!

🏒 ${homeTeam?.name || 'Thuis'} vs ${awayTeam?.name || 'Uit'}
📅 ${dateStr}
📍 ${game.venue || 'Locatie TBD'}
🎯 Jouw status: ${statusText}

${newStatus === 'Attending' ? 'We zien je op het ijs! 🏒' : 'Jammer dat je er niet bij kunt zijn. Tot de volgende keer!'}

— Blackout League Manager
  `.trim();

  await base44.integrations.Core.SendEmail({ to: userEmail, subject, body });
}
export function formatGameTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function calculateStandings(games, teams) {
  const standings = {};
  teams.forEach(t => {
    standings[t.id] = { team: t, gp: 0, w: 0, l: 0, t: 0, gf: 0, ga: 0, pts: 0 };
  });

  games.forEach(g => {
    if (g.status !== 'Final') return;
    
    const home = standings[g.home_team_id];
    const away = standings[g.away_team_id];
    
    if (home) {
      home.gp++;
      home.gf += g.home_score || 0;
      home.ga += g.away_score || 0;
      if (g.home_score > g.away_score) { home.w++; home.pts += 2; }
      else if (g.home_score < g.away_score) { home.l++; }
      else { home.t++; home.pts += 1; }
    }
    
    if (away) {
      away.gp++;
      away.gf += g.away_score || 0;
      away.ga += g.home_score || 0;
      if (g.away_score > g.home_score) { away.w++; away.pts += 2; }
      else if (g.away_score < g.home_score) { away.l++; }
      else { away.t++; away.pts += 1; }
    }
  });

  return Object.values(standings).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
}

export function calculatePlayerStats(events, playerId) {
  let goals = 0;
  let assists = 0;
  let pim = 0;

  events.forEach(e => {
    if (e.player_id === playerId) {
      if (e.event_type === 'Goal') goals++;
      if (e.event_type === 'Penalty') pim += e.penalty_duration || 0;
    }
    if (e.assist_1_player_id === playerId || e.assist_2_player_id === playerId) {
      assists++;
    }
  });

  return { goals, assists, points: goals + assists, pim };
}

export function determineGoalType(events, teamId, otherTeamId, period, periodTimeRemaining) {
  // Mock simple determineGoalType
  return 'EV'; // Even Strength
}
