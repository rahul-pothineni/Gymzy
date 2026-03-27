Tracker Feature Implementation Plan

 Context

 The Gymzy app currently lets users generate AI workout plans and view them on a Profile page. There's no way to log actual workouts — users can see
 what they should do but can't record what they actually did. This feature adds a Tracker page where users select a day from their plan, log
 weight/reps/notes per set for each exercise, save the session, and review past sessions in a History tab (expandable cards).

 ---
 1. Database Schema (Prisma)

 File: server/prisma/schema.prisma

 Add two new models:

 model workout_sessions {
   id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
   user_id      String   @db.Uuid
   plan_id      String   @db.Uuid
   day_label    String   @db.VarChar(50)    // "Monday" — copied from DaySchedule.day
   focus        String   @db.VarChar(100)   // "Push" — copied from DaySchedule.focus
   completed    Boolean  @default(false)
   notes        String?  @db.Text
   session_date DateTime @db.Date
   created_at   DateTime @default(now()) @db.Timestamptz(6)

   exercises session_exercises[]

   @@index([user_id])
   @@index([user_id, session_date])
 }

 model session_exercises {
   id            String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
   session_id    String  @db.Uuid
   exercise_name String  @db.VarChar(200)
   exercise_order Int
   sets_data     Json    // Array<{ setNumber, weight, repsCompleted, notes }>
   skipped       Boolean @default(false)

   session workout_sessions @relation(fields: [session_id], references: [id], onDelete: Cascade)

   @@index([session_id])
 }

 Key decisions:
 - sets_data as JSONB array (matches existing plan_json pattern — avoids a 4th table)
 - day_label/focus denormalized from plan so sessions remain valid if the plan is regenerated
 - Cascade delete: removing a session removes its exercises

 Run migration: cd server && npx prisma migrate dev --name add_workout_tracking

 ---
 2. Backend API Routes

 New file: server/src/routes/tracker.ts
 Register in: server/src/index.ts — add app.use("/api/tracker", trackerRouter)

 ┌────────┬──────────────────────────────────────────┬───────────────────────────────────────────────────────────────┐
 │ Method │                 Endpoint                 │                            Purpose                            │
 ├────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────────────────┤
 │ POST   │ /sessions                                │ Create a session for a day (with empty set data per exercise) │
 ├────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────────────────┤
 │ GET    │ /sessions/today?userId=X&date=YYYY-MM-DD │ Get session for a specific date (resume in-progress)          │
 ├────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────────────────┤
 │ PUT    │ /sessions/:sessionId                     │ Save exercise progress / mark complete                        │
 ├────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────────────────┤
 │ GET    │ /sessions?userId=X&limit=20&offset=0     │ List previous sessions (paginated, newest first)              │
 ├────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────────────────┤
 │ DELETE │ /sessions/:sessionId                     │ Delete a session                                              │
 └────────┴──────────────────────────────────────────┴───────────────────────────────────────────────────────────────┘

 POST /sessions request body:
 {
   userId: string,
   planId: string,
   dayLabel: string,
   focus: string,
   sessionDate: string,       // "2026-03-26"
   exercises: Array<{ exerciseName: string, order: number, setsCount: number }>
 }
 - Checks for duplicate (same user + date + dayLabel) — returns existing if found
 - Creates workout_sessions + session_exercises with empty sets_data: [{ setNumber: 1, weight: null, repsCompleted: null, notes: "" }, ...]

 PUT /sessions/:sessionId request body:
 {
   userId: string,
   completed?: boolean,
   notes?: string,
   exercises: Array<{
     id: string,
     setsData: Array<{ setNumber: number, weight: number | null, repsCompleted: number | null, notes: string }>,
     skipped?: boolean
   }>
 }
 - Uses prisma.$transaction to update session + all exercises atomically

 GET /sessions returns sessions ordered by session_date desc, with include: { exercises: true }.

 ---
 3. Frontend Types

 File: src/types/index.ts — add:

 export interface SetData {
   setNumber: number
   weight: number | null
   repsCompleted: number | null
   notes: string
 }

 export interface SessionExercise {
   id: string
   sessionId: string
   exerciseName: string
   exerciseOrder: number
   setsData: SetData[]
   skipped: boolean
 }

 export interface WorkoutSession {
   id: string
   userId: string
   planId: string
   dayLabel: string
   focus: string
   completed: boolean
   notes?: string
   sessionDate: string
   createdAt: string
   exercises: SessionExercise[]
 }

 Also add matching types to server/types/index.ts.

 ---
 4. API Client Updates

 File: src/lib/api.ts

 Add put and del helpers following the existing post/get pattern, then add:

 createSession: (data) => post("/tracker/sessions", data),
 getTodaySession: (userId, date) => get(`/tracker/sessions/today?userId=${userId}&date=${date}`),
 updateSession: (sessionId, data) => put(`/tracker/sessions/${sessionId}`, data),
 getSessions: (userId, limit = 20, offset = 0) => get(`/tracker/sessions?userId=${userId}&limit=${limit}&offset=${offset}`),
 deleteSession: (sessionId) => del(`/tracker/sessions/${sessionId}`),

 ---
 5. Frontend Components

 New page: src/pages/Tracker.tsx

 Two-tab layout: "Today's Workout" | "Previous Sessions"

 State is managed locally with useState (no AuthContext changes — tracker data is page-scoped). Plan data comes from useAuth().plan.

 Tab 1 — Today's Workout flow:
 1. On mount, check if a session exists for today via api.getTodaySession()
 2. If no session: show DaySelector — grid of clickable day cards from plan.weeklySchedule
 3. User picks a day → api.createSession() → receives WorkoutSession with empty sets
 4. Show SessionForm with all exercises and per-set inputs pre-populated
 5. User fills in weight/reps/notes per set → "Save Progress" or "Complete Workout"
 6. If session exists (resume): skip straight to SessionForm with saved data

 Tab 2 — Previous Sessions:
 - Fetch paginated list via api.getSessions()
 - Show session cards (date, focus, completed badge, exercise count)
 - Expandable detail showing logged sets in a read-only table

 New components: src/components/tracker/

 a) DaySelector.tsx
 - Props: weeklySchedule: DaySchedule[], onSelect: (day: DaySchedule) => void
 - Grid of Card variant="bordered" — day name bold, focus in accent, exercise count muted
 - Reuses existing Card component

 b) ExerciseTracker.tsx
 - Props: exercise: SessionExercise, planExercise: Exercise, onChange, onSkip
 - Shows exercise name + planned sets/reps as reference
 - Renders N rows (one per set) with 3 inputs each:
   - Weight — <Input type="number" placeholder="lbs"> with inputMode="decimal" for mobile
   - Reps — <Input type="number" placeholder="reps"> with inputMode="numeric" for mobile
   - Notes — <Input type="text" placeholder="e.g. felt easy, form check"> short text per set
 - "Skip" button (ghost) to grey out the exercise

 c) SessionForm.tsx
 - Props: session: WorkoutSession, planDay: DaySchedule, onSave, isSaving
 - Summary header: day, focus, date, progress count
 - Maps over exercises → <ExerciseTracker> for each
 - Bottom: "Save Progress" (secondary) + "Complete Workout" (primary) buttons
 - Manages local state for all exercise edits

 d) SessionHistory.tsx
 - Props: sessions: WorkoutSession[], isLoading, onLoadMore, hasMore
 - Lists sessions as bordered cards
 - Each card expandable to show exercise detail table (read-only, similar to PlanDisplay)
 - "Load More" button for pagination

 ---
 6. Route & Navigation Changes

 src/App.tsx — add:
 <Route path="/tracker" element={<Tracker />} />

 src/components/layout/Navbar.tsx — add "Tracker" link between "My Plan" and UserButton:
 <Link to="/tracker">
   <Button variant="ghost" size="sm">Tracker</Button>
 </Link>

 ---
 7. Implementation Order

 ┌──────┬──────────────────────────────────────────────────────────┬───────────────────────────────────────────────────┐
 │ Step │                           What                           │                       Files                       │
 ├──────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
 │ 1    │ Add Prisma models + run migration                        │ server/prisma/schema.prisma                       │
 ├──────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
 │ 2    │ Create tracker backend routes                            │ server/src/routes/tracker.ts, server/src/index.ts │
 ├──────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
 │ 3    │ Add frontend types                                       │ src/types/index.ts, server/types/index.ts         │
 ├──────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
 │ 4    │ Add API client methods (put/del helpers + tracker calls) │ src/lib/api.ts                                    │
 ├──────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
 │ 5    │ Build DaySelector component                              │ src/components/tracker/DaySelector.tsx            │
 ├──────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
 │ 6    │ Build ExerciseTracker component                          │ src/components/tracker/ExerciseTracker.tsx        │
 ├──────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
 │ 7    │ Build SessionForm component                              │ src/components/tracker/SessionForm.tsx            │
 ├──────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
 │ 8    │ Build SessionHistory component                           │ src/components/tracker/SessionHistory.tsx         │
 ├──────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
 │ 9    │ Build Tracker page with tabs + routing                   │ src/pages/Tracker.tsx, src/App.tsx                │
 ├──────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
 │ 10   │ Add Tracker nav link                                     │ src/components/layout/Navbar.tsx                  │
 └──────┴──────────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘

 ---
 8. Verification

 1. DB: After migration, verify tables exist via npx prisma studio
 2. Backend: Test each endpoint with curl — create session, get today, update with set data, list history, delete
 3. Frontend E2E:
   - Navigate to /tracker → see day selector → pick a day → see exercise inputs
   - Fill in weight/reps/notes for each set → Save Progress → refresh page → data persists
   - Complete Workout → shows completed badge
   - Switch to History tab → see the completed session with logged data
   - Edge cases: no plan (redirect to onboarding), already have today's session (resume)

I read over the prisma sections lets change somethings: We should add  