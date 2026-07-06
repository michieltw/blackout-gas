// XP Calculations
const XP_TABLE = {
  game_played: 10,
  goal: 25,
  assist: 15,
  penalty_minute: -2,
  win: 10,
  shutout: 50,
};

export function calculateXP(stats) {
  let xp = 0;
  xp += (stats.games_played || 0) * XP_TABLE.game_played;
  xp += (stats.goals || 0) * XP_TABLE.goal;
  xp += (stats.assists || 0) * XP_TABLE.assist;
  xp += (stats.pim || 0) * XP_TABLE.penalty_minute;
  xp += (stats.wins || 0) * XP_TABLE.win;
  return Math.max(0, xp);
}

export function getLevel(xp) {
  if (xp < 50) return 1;
  if (xp < 150) return 2;
  if (xp < 300) return 3;
  if (xp < 500) return 4;
  if (xp < 800) return 5;
  if (xp < 1200) return 6;
  if (xp < 1800) return 7;
  if (xp < 2500) return 8;
  if (xp < 3500) return 9;
  return 10;
}

export function getXPForLevel(level) {
  const thresholds = [0, 0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500];
  return thresholds[level] || 0;
}

export function getXPProgress(xp) {
  const level = getLevel(xp);
  const currentThreshold = getXPForLevel(level);
  const nextThreshold = getXPForLevel(level + 1);
  if (level >= 10) return 100;
  return ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
}

export function snakeDraft(players) {
  const sorted = [...players].sort((a, b) => (b.xp || 0) - (a.xp || 0));
  const teamA = [];
  const teamB = [];
  sorted.forEach((player, i) => {
    const round = Math.floor(i / 2);
    const isEvenRound = round % 2 === 0;
    if (i % 2 === 0) {
      (isEvenRound ? teamA : teamB).push(player);
    } else {
      (isEvenRound ? teamB : teamA).push(player);
    }
  });
  return { teamA, teamB };
}

export const LEVEL_NAMES = {
  1: 'Rookie',
  2: 'Beginner',
  3: 'Regular',
  4: 'Veteran',
  5: 'Expert',
  6: 'Star',
  7: 'All-Star',
  8: 'Elite',
  9: 'Legend',
  10: 'GOAT',
};