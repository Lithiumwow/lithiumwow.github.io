export type LanderLeaderboardEntry = {
  name: string;
  score: number;
  at: number;
};

const STORAGE_KEY = 'tranceradio-lander-leaderboard-v1';
const TOP_N = 3;

function sortEntries(entries: LanderLeaderboardEntry[]): LanderLeaderboardEntry[] {
  return [...entries].sort((a, b) => b.score - a.score || b.at - a.at);
}

export function loadLanderLeaderboard(): LanderLeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is LanderLeaderboardEntry =>
          typeof e === 'object' &&
          e !== null &&
          typeof (e as LanderLeaderboardEntry).name === 'string' &&
          typeof (e as LanderLeaderboardEntry).score === 'number' &&
          typeof (e as LanderLeaderboardEntry).at === 'number',
      )
      .slice(0, TOP_N);
  } catch {
    return [];
  }
}

export function saveLanderLeaderboard(entries: LanderLeaderboardEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortEntries(entries).slice(0, TOP_N)));
  } catch {
    /* ignore quota / private mode */
  }
}

/** True if this score would place in the top 3 (including ties with 3rd). */
export function qualifiesForTopThree(
  score: number,
  current: LanderLeaderboardEntry[],
): boolean {
  if (score <= 0) return false;
  const top = sortEntries(current).slice(0, TOP_N);
  if (top.length < TOP_N) return true;
  return score >= top[TOP_N - 1].score;
}

export function addLanderScore(
  name: string,
  score: number,
  current: LanderLeaderboardEntry[],
): LanderLeaderboardEntry[] {
  const trimmed = name.trim().slice(0, 24) || 'Pilot';
  const next: LanderLeaderboardEntry = {
    name: trimmed,
    score,
    at: Date.now(),
  };
  const merged = sortEntries([...current, next]).slice(0, TOP_N);
  saveLanderLeaderboard(merged);
  return merged;
}
