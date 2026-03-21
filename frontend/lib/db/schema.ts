import { pgTable, text, integer, jsonb, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  bio: text('bio'),
  nickname: text('nickname'),
  avatarUrl: text('avatar_url'),
  lastSeen: timestamp('last_seen'),
});

export const gameRooms = pgTable('game_rooms', {
  id: text('id').primaryKey(),
  roomCode: text('room_code').notNull().unique(),
  player1Id: text('player1_id').references(() => users.id),
  player2Id: text('player2_id').references(() => users.id),
  status: text('status').notNull().default('waiting'), // waiting | active | complete
  gameState: jsonb('game_state'),
  handNumber: integer('hand_number').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const handHistory = pgTable('hand_history', {
  id: text('id').primaryKey(),
  roomId: text('room_id').references(() => gameRooms.id),
  handNumber: integer('hand_number').notNull(),
  winnerId: text('winner_id').references(() => users.id),
  pot: integer('pot').notNull(),
  board: jsonb('board'),
  player1Cards: jsonb('player1_cards'),
  player2Cards: jsonb('player2_cards'),
  playedAt: timestamp('played_at').defaultNow().notNull(),
});

export const playerStats = pgTable('player_stats', {
  userId: text('user_id').primaryKey().references(() => users.id),
  handsPlayed: integer('hands_played').notNull().default(0),
  vpipCount: integer('vpip_count').notNull().default(0),
  vpipOpp: integer('vpip_opp').notNull().default(0),
  pfrCount: integer('pfr_count').notNull().default(0),
  pfrOpp: integer('pfr_opp').notNull().default(0),
  totalRaises: integer('total_raises').notNull().default(0),
  totalBets: integer('total_bets').notNull().default(0),
  totalCalls: integer('total_calls').notNull().default(0),
  sessionPnl: integer('session_pnl').notNull().default(0),
});

export const friendships = pgTable('friendships', {
  id: text('id').primaryKey(),
  requesterId: text('requester_id').notNull().references(() => users.id),
  addresseeId: text('addressee_id').notNull().references(() => users.id),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'declined'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const directMessages = pgTable('direct_messages', {
  id: text('id').primaryKey(),
  senderId: text('sender_id').notNull().references(() => users.id),
  receiverId: text('receiver_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  readAt: timestamp('read_at'),
});

export const tableMessages = pgTable('table_messages', {
  id: text('id').primaryKey(),
  roomId: text('room_id').notNull().references(() => gameRooms.id),
  userId: text('user_id').notNull().references(() => users.id),
  username: text('username').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
