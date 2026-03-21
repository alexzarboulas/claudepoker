import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const rawUrl = process.env.DATABASE_URL!.trim();
const neonUrl = rawUrl.split('?')[0]; // neon HTTP driver uses HTTPS; query params like sslmode cause errors
const sql = neon(neonUrl);
export const db = drizzle(sql, { schema });

import { eq } from 'drizzle-orm';
import { users } from './schema';

export async function updateLastSeen(userId: string) {
  await db.update(users).set({ lastSeen: new Date() }).where(eq(users.id, userId));
}
