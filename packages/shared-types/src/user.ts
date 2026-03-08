/**
 * User domain types — maps `users` + `authenticate` tables from Quiz Online V-7.1.6
 * Auth provider: AWS Cognito (replaces Firebase Auth from original app)
 */

export type AuthProvider = 'email' | 'google' | 'facebook' | 'phone';
export type UserStatus = 'active' | 'inactive';
export type SubscriptionPlan = 'free' | 'premium';
export type AdminRole = 'admin' | 'moderator';

/** Core user profile — stored in DynamoDB `lms-users` table */
export interface User {
  id: string;                 // Cognito sub (UUID)
  cognitoId: string;          // Cognito sub (same as id, explicit)
  name: string;
  email: string;
  mobile?: string;
  authProvider: AuthProvider;
  profileImageUrl?: string;
  fcmToken?: string;          // Firebase Cloud Messaging (push notifications)
  coins: number;              // In-app currency
  referCode: string;          // User's own referral code
  friendsCode?: string;       // Code used by this user to join
  ipAddress?: string;
  status: UserStatus;
  subscription: SubscriptionPlan;
  createdAt: string;          // ISO 8601
  updatedAt: string;
}

/** Lightweight auth state (used in mobile stores) */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  subscription: SubscriptionPlan;
  profileImageUrl?: string;
  createdAt: string;
}

/** Admin panel user — maps `authenticate` table */
export interface AdminUser {
  username: string;
  role: AdminRole;
  status: 'active' | 'inactive';
  createdAt: string;
}

/** Coin transaction record — maps `tbl_tracker` table */
export interface CoinTransaction {
  id: string;
  userId: string;
  points: number;             // positive = earn, negative = spend
  type: CoinTransactionType;
  description?: string;
  createdAt: string;
}

export type CoinTransactionType =
  | 'quiz_correct'
  | 'daily_quiz'
  | 'battle_win'
  | 'contest_prize'
  | 'referral_bonus'
  | 'welcome_bonus'
  | 'category_purchase'
  | 'contest_entry'
  | 'reward';

/** Purchased premium categories — maps `user_purchased_category` table */
export interface UserPurchasedCategory {
  id: string;
  userId: string;
  categoryId: string;
  isPurchased: boolean;
  purchasedAt: string;
}
