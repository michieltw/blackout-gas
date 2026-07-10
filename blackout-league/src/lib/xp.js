export const LEVEL_NAMES = {
  1: "Rookie",
  2: "Amateur",
  3: "Pro",
  4: "Veteran",
  5: "Elite",
  6: "Legend",
  7: "Hall of Famer"
};

export function getLevel(xp) {
  if (xp >= 1000) return 7;
  if (xp >= 500) return 6;
  if (xp >= 250) return 5;
  if (xp >= 100) return 4;
  if (xp >= 50) return 3;
  if (xp >= 10) return 2;
  return 1;
}

export function getXPProgress(xp) {
  const level = getLevel(xp);
  let prevThreshold = 0;
  let nextThreshold = 10;

  if (level === 2) { prevThreshold = 10; nextThreshold = 50; }
  else if (level === 3) { prevThreshold = 50; nextThreshold = 100; }
  else if (level === 4) { prevThreshold = 100; nextThreshold = 250; }
  else if (level === 5) { prevThreshold = 250; nextThreshold = 500; }
  else if (level === 6) { prevThreshold = 500; nextThreshold = 1000; }
  else if (level === 7) return 100; // maxed out

  const currentLevelXP = xp - prevThreshold;
  const requiredXP = nextThreshold - prevThreshold;
  return Math.max(0, Math.min(100, (currentLevelXP / requiredXP) * 100));
}

export function snakeDraft(players) {
  // Sort players by XP descending
  const sorted = [...players].sort((a, b) => (b.xp || 0) - (a.xp || 0));
  const teamA = [];
  const teamB = [];

  sorted.forEach((p, i) => {
    if (i % 4 === 0 || i % 4 === 3) {
      teamA.push(p);
    } else {
      teamB.push(p);
    }
  });

  return { teamA, teamB };
}
