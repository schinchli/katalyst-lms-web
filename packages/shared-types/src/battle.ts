/**
 * Battle / multiplayer types — maps `battle_questions`, `battle_statistics`,
 * `tbl_rooms` tables from Quiz Online V-7.1.6
 * Real-time layer: AWS API Gateway WebSocket + DynamoDB
 */

export type RoomType = 'public' | 'private';
export type BattleStatus = 'waiting' | 'in_progress' | 'completed' | 'abandoned';

/** Battle room — maps `tbl_rooms` table */
export interface BattleRoom {
  id: string;
  roomCode: string;            // Short invite code
  creatorId: string;
  roomType: RoomType;
  categoryId: string;
  questionCount: number;
  questions: BattleQuestion[];
  status: BattleStatus;
  players: BattlePlayer[];
  createdAt: string;
  expiresAt: string;           // Auto-close after 10 min of inactivity
}

export interface BattlePlayer {
  userId: string;
  userName: string;
  profileImageUrl?: string;
  score: number;
  answeredCount: number;
  isReady: boolean;
  joinedAt: string;
}

/** Serialized question for a battle — maps `battle_questions` table */
export interface BattleQuestion {
  id: string;
  text: string;
  options: Array<{ id: string; text: string }>;
  // Note: correctOptionId NOT included in real-time payload (server-side validation only)
  timeLimit: number;           // seconds per question
}

/** Battle result — maps `battle_statistics` table */
export interface BattleResult {
  id: string;
  roomId: string;
  player1Id: string;
  player2Id: string;
  winnerId?: string;           // undefined if drawn
  isDrawn: boolean;
  player1Score: number;
  player2Score: number;
  createdAt: string;
}

/** Aggregated battle stats per user */
export interface BattleStats {
  userId: string;
  wins: number;
  losses: number;
  draws: number;
  totalBattles: number;
  winRate: number;             // 0-100
}
