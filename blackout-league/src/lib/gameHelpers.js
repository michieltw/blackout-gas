export function formatGameTime(seconds) {
  if (seconds === undefined || seconds === null) return "20:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function determineGoalType(events, teamId, otherTeamId, period, timeRemaining) {
  // Simple mock implementation
  return "EV";
}

export function calculateStandings(games, teams) {
  const standings = teams.map(team => ({
    team,
    gp: 0, w: 0, l: 0, otl: 0, gf: 0, ga: 0, pts: 0
  }));

  games.forEach(game => {
    if (game.status !== 'Final') return;

    const homeTeamIdx = standings.findIndex(s => s.team.id === game.home_team_id);
    const awayTeamIdx = standings.findIndex(s => s.team.id === game.away_team_id);

    if (homeTeamIdx > -1) {
      standings[homeTeamIdx].gp++;
      standings[homeTeamIdx].gf += (game.home_score || 0);
      standings[homeTeamIdx].ga += (game.away_score || 0);
      if ((game.home_score || 0) > (game.away_score || 0)) {
        standings[homeTeamIdx].w++;
        standings[homeTeamIdx].pts += 2;
      } else {
        standings[homeTeamIdx].l++;
      }
    }

    if (awayTeamIdx > -1) {
      standings[awayTeamIdx].gp++;
      standings[awayTeamIdx].gf += (game.away_score || 0);
      standings[awayTeamIdx].ga += (game.home_score || 0);
      if ((game.away_score || 0) > (game.home_score || 0)) {
        standings[awayTeamIdx].w++;
        standings[awayTeamIdx].pts += 2;
      } else {
        standings[awayTeamIdx].l++;
      }
    }
  });

  return standings;
}

export function calculatePlayerStats(events, playerId) {
  let goals = 0;
  let assists = 0;
  let pim = 0;

  events.forEach(evt => {
    if (evt.event_type === 'Goal') {
      if (evt.player_id === playerId) goals++;
      if (evt.assist1_player_id === playerId || evt.assist2_player_id === playerId) assists++;
    } else if (evt.event_type === 'Penalty' && evt.player_id === playerId) {
      pim += (evt.penalty_minutes || 0);
    }
  });

  return { goals, assists, points: goals + assists, pim };
}
