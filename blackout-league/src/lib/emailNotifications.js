export async function sendNewGameEmails(game, homeTeam, awayTeam) {
  console.log("Mock sending new game emails", {game, homeTeam, awayTeam});
  return true;
}

export async function sendRsvpEmail(player, email, game, homeTeam, awayTeam, status) {
  console.log("Mock sending RSVP email", {player, email, game, homeTeam, awayTeam, status});
  return true;
}
