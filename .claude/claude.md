Redis Caching Layer for Auth/Profile                                                                                                                                     
                                                        
 Context

 On every page load, AuthContext calls authClient.getSession() (external Neon Auth network call), then immediately fires two parallel Postgres queries (/api/profile and
 /api/plan/current). The user perceives a ~500ms delay before their data appears. Redis caching eliminates the DB round-trip on repeat visits, and a sessionStorage
 stale-while-revalidate layer on the frontend shows cached data the moment getSession() resolves.

 The redis v5 package exists in the root package.json but is unused. The server (server/) has its own package.json with no redis dependency — it needs to be installed
 there.

 ---
 Implementation Steps

 Step 1 — Install redis in the server

 cd server && npm install redis

 No root package.json changes needed.

 ---
 Step 2 — Create Redis client module

 New file: server/src/lib/redis.ts

 - Read REDIS_URL from process.env. If absent, all helpers are no-ops (graceful fallback — app works without Redis).
 - Export cacheGet(key), cacheSet(key, value, ttlSeconds), cacheDel(...keys) — each wraps Redis calls in try/catch that logs a warning and returns null/void on failure.
 - Register an error listener on the client so unhandled Redis errors don't crash the Node process.
 - Check client.isOpen before each operation (handles connect-then-disconnect scenarios).

 // server/src/lib/redis.ts
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

 Cache keys and TTLs:

 ┌──────────────┬───────────────────────┬─────────────┐
 │     Data     │          Key          │     TTL     │
 ├──────────────┼───────────────────────┼─────────────┤
 │ User profile │ profile:{userId}      │ 3600s (1hr) │
 ├──────────────┼───────────────────────┼─────────────┤
 │ Current plan │ plan:current:{userId} │ 3600s (1hr) │
 └──────────────┴───────────────────────┴─────────────┘

 Long TTL is safe because writes explicitly invalidate the key.

 ---
 Step 3 — Cache profile GET, invalidate on POST

 File: server/src/routes/profile.ts

 Add import { cacheGet, cacheSet, cacheDel } from "../lib/redis" at the top.

 GET /api/profile — cache-aside (around lines 6–27):
 const cacheKey = `profile:${userId}`;
 const cached = await cacheGet(cacheKey);
 if (cached) return res.json(JSON.parse(cached));

 const profile = await prisma.user_profiles.findUnique({ where: { user_id: userId } });
 if (!profile) return res.status(404).json({ error: "Profile not found" });

 await cacheSet(cacheKey, JSON.stringify(profile), 3600);
 res.json(profile);

 POST /api/profile — invalidate after upsert (after line 60):
 await prisma.user_profiles.upsert(...); // existing
 await cacheDel(`profile:${userId}`);    // new
 res.json({ success: true });

 ---
 Step 4 — Cache plan GET /current, invalidate on generate and update

 File: server/src/routes/plan.ts

 Add import { cacheGet, cacheSet, cacheDel } from "../lib/redis" at the top.

 GET /api/plan/current (lines 148–176) — cache the shaped response object:
 const cacheKey = `plan:current:${userId}`;
 const cached = await cacheGet(cacheKey);
 if (cached) return res.json(JSON.parse(cached));

 const plan = await prisma.model_training_plans.findFirst(...); // existing
 if (!plan) return res.status(404).json({ error: "No plan found" });

 const response = { id: plan.id, userId: plan.user_id, planJson: plan.plan_json,
                    planText: plan.plan_text, version: plan.version, createdAt: plan.createdAt };
 await cacheSet(cacheKey, JSON.stringify(response), 3600);
 res.json(response);

 Cache the shaped response object (not the raw Prisma row) so AuthContext's planData.planJson.overview etc. work correctly on cache hits.

 POST /api/plan/generate — after the plan is created and saved to DB, add:
 await cacheDel(`plan:current:${userId}`);

 PUT /api/plan/:planId — after the update, add:
 await cacheDel(`plan:current:${userId}`);

 ---
 Step 5 — Frontend sessionStorage stale-while-revalidate

 File: src/context/AuthContext.tsx

 Add two helpers above the component (with try/catch for private browsing quota errors):

 const SESSION_CACHE_KEY = "gym:cache";
 const SESSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

 function readSessionCache() {
   try {
     const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
     if (!raw) return null;
     const { profile, plan, cachedAt } = JSON.parse(raw);
     if (Date.now() - cachedAt > SESSION_CACHE_TTL_MS) return null;
     return { profile, plan };
   } catch { return null; }
 }

 function writeSessionCache(profile: any, plan: any) {
   try {
     sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ profile, plan, cachedAt: Date.now() }));
   } catch {}
 }

 In refreshData (the useCallback):

 At the very start (before the Promise.all), read and immediately apply the cache:
 const stale = readSessionCache();
 if (stale) {
   if (stale.profile) setProfile({ userId: stale.profile.user_id, ... });
   if (stale.plan) setPlan({ id: stale.plan.id, ... });
 }

 After the Promise.all resolves and state is set, write fresh data back:
 writeSessionCache(profileData, planData);

 On sign-out (if/when a logout flow is added): sessionStorage.removeItem(SESSION_CACHE_KEY).

 ---
 Step 6 — Environment variables

 server/.env (local dev):
 REDIS_URL=redis://localhost:6379

 Omitting REDIS_URL is valid — the module detects its absence and skips all caching.

 Production (Vercel + Upstash):
 - Provision Upstash Redis from Vercel Marketplace (Storage tab)
 - It injects a REDIS_URL (format rediss://...) which the standard redis npm package handles natively
 - Run vercel env add REDIS_URL if setting manually

 ---
 Critical Files

 ┌──────────────────────────────┬────────────────────────────────────────────────────────────────────────────┐
 │             File             │                                   Change                                   │
 ├──────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
 │ server/src/lib/redis.ts      │ New — Redis client + cache helpers                                         │
 ├──────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
 │ server/src/routes/profile.ts │ Cache-aside on GET, invalidate on POST                                     │
 ├──────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
 │ server/src/routes/plan.ts    │ Cache-aside on GET /current, invalidate on POST /generate and PUT /:planId │
 ├──────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
 │ src/context/AuthContext.tsx  │ sessionStorage stale-while-revalidate in refreshData                       │
 ├──────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
 │ server/.env                  │ Add REDIS_URL=redis://localhost:6379                                       │
 ├──────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
 │ server/package.json          │ Gets redis dep after npm install redis                                     │
 └──────────────────────────────┴────────────────────────────────────────────────────────────────────────────┘

 ---
 Verification

 1. Start local Redis: redis-server
 2. Add REDIS_URL=redis://localhost:6379 to server/.env
 3. Restart the server
 4. Open the app → check Network tab: first load hits DB (normal latency); second load after refresh should return profile/plan instantly (< 5ms response time from
 Redis)
 5. Use redis-cli KEYS "*" to confirm profile:{userId} and plan:current:{userId} keys are populated
 6. Update your profile → confirm redis-cli GET profile:{userId} returns null (cache evicted)
 7. Fallback test: Remove REDIS_URL from .env, restart — app should function normally with no errors

 ---
 What This Does and Doesn't Fix

 Fixes: The ~200-400ms delay from the two parallel DB queries on every page load.

 Doesn't fix: The authClient.getSession() call to Neon Auth — that's an external network call. The sessionStorage layer mitigates its impact by showing stale data
 immediately after it resolves.
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌

 Claude has written up a plan and is ready to execute. Would you like to proceed?

 ❯ 1. Yes, auto-accept edits
   2. Yes, manually approve edits
   3. Tell Claude what to change
      shift+tab to approve with this feedback

 ctrl-g to edit in Vim · ~/.claude/plans/mellow-herding-aurora.md
