import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL;
let client: ReturnType<typeof createClient> | null = null;

if (REDIS_URL) {
  client = createClient({ url: REDIS_URL });
  client.on("error", (err) => console.warn("[redis] error:", err.message));
  client.connect().catch((err) => console.warn("[redis] connect failed:", err.message));
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!client?.isOpen) return null;
  try { return await client.get(key); }
  catch (e) { console.warn("[redis] GET failed:", e); return null; }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (!client?.isOpen) return;
  try { await client.set(key, value, { EX: ttlSeconds }); }
  catch (e) { console.warn("[redis] SET failed:", e); }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (!client?.isOpen) return;
  try { await client.del(keys); }
  catch (e) { console.warn("[redis] DEL failed:", e); }
}
