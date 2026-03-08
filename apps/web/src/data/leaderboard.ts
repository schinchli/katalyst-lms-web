import type { LeaderboardEntry } from '@/types';

// ─── Mock leaderboard data ────────────────────────────────────────────────────
const BASE_ENTRIES: Omit<LeaderboardEntry, 'rank'>[] = [
  { userId: 'u1', name: 'Alex Chen',     avatarInitial: 'A', score: 9850, coins: 4200, streak: 28, quizzesCompleted: 11 },
  { userId: 'u2', name: 'Sarah Kim',     avatarInitial: 'S', score: 9720, coins: 3900, streak: 21, quizzesCompleted: 11 },
  { userId: 'u3', name: 'Raj Patel',     avatarInitial: 'R', score: 9630, coins: 3600, streak: 18, quizzesCompleted: 11 },
  { userId: 'u4', name: 'Emma Wilson',   avatarInitial: 'E', score: 9540, coins: 3300, streak: 15, quizzesCompleted: 10 },
  { userId: 'u5', name: 'David Park',    avatarInitial: 'D', score: 9380, coins: 3100, streak: 12, quizzesCompleted: 10 },
  { userId: 'u6', name: 'Lisa Zhang',    avatarInitial: 'L', score: 9240, coins: 2900, streak: 9,  quizzesCompleted: 9  },
  { userId: 'u7', name: 'James Oliver',  avatarInitial: 'J', score: 9100, coins: 2700, streak: 7,  quizzesCompleted: 9  },
  { userId: 'u8', name: 'Maria Santos',  avatarInitial: 'M', score: 8950, coins: 2500, streak: 5,  quizzesCompleted: 8  },
  { userId: 'u9', name: 'Tom Bradley',   avatarInitial: 'T', score: 8800, coins: 2300, streak: 4,  quizzesCompleted: 8  },
  { userId: 'u10',name: 'Yuki Tanaka',   avatarInitial: 'Y', score: 8650, coins: 2100, streak: 3,  quizzesCompleted: 7  },
];

const ALL_TIME: LeaderboardEntry[] = BASE_ENTRIES.map((e, i) => ({ ...e, rank: i + 1 }));

const MONTHLY: LeaderboardEntry[] = [
  BASE_ENTRIES[2], BASE_ENTRIES[0], BASE_ENTRIES[4],
  BASE_ENTRIES[1], BASE_ENTRIES[6], BASE_ENTRIES[3],
  BASE_ENTRIES[5], BASE_ENTRIES[9], BASE_ENTRIES[7],
  BASE_ENTRIES[8],
].map((e, i) => ({ ...e, rank: i + 1, score: Math.floor(e.score * 0.6) }));

const DAILY: LeaderboardEntry[] = [
  BASE_ENTRIES[5], BASE_ENTRIES[3], BASE_ENTRIES[8],
  BASE_ENTRIES[1], BASE_ENTRIES[7], BASE_ENTRIES[0],
  BASE_ENTRIES[9], BASE_ENTRIES[2], BASE_ENTRIES[4],
  BASE_ENTRIES[6],
].map((e, i) => ({ ...e, rank: i + 1, score: Math.floor(e.score * 0.15) }));

export function getLeaderboard(period: 'daily' | 'monthly' | 'alltime'): LeaderboardEntry[] {
  if (period === 'daily')   return DAILY;
  if (period === 'monthly') return MONTHLY;
  return ALL_TIME;
}
