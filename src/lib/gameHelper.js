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