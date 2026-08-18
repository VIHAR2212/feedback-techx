# Uncharted Expedition — Feedback Portal (Skeleton)

Adapted from the original Minecraft "TechX Feedback" project. The Minecraft
theme has been replaced with an Uncharted expedition flow, but the underlying
Next.js App Router architecture, contexts, and API signatures are preserved
so the visual layer can be redesigned later without re-plumbing.

## Flow

```
landing (name + email + department)
  └─> /expedition                    (3 checkpoints A/B/C; B locked until A cleared, C locked until B cleared)
        └─> /expedition/[labId]      (product grid for that checkpoint)
              └─> /discover/[productId]    (gemstone rating + expedition notes)
                    ├─ submit
                    │   ├─ POST /api/feedback       (mock store)
                    │   ├─ POST /api/expedition/clue (50% reveal a clue, 50% empty)
                    │   ├─ FeedbackResultCard toast (with "Try treasure hunt" button)
                    │   ├─ recalc progress + shard award if lab cleared
                    │   └─ redirect back to lab page (or /finish if last shard)
                    │
                    └─ /certificate/[labId]  (per-checkpoint certificate shard)
                                              (after the lab is cleared)

/finish                                 (final certificate when 3 shards collected)
/leaderboard                            (Explorers + Discoveries views)
/admin/login                            (vcet-nsdc / AIDS@2025)
/admin/dashboard
/admin/leaderboard
/admin/feedback                         (with CSV export)
```

## Gemstone tiers (replace 5-heart rating)

| Tier | Gemstone    |
|------|-------------|
| 1    | Rough Stone |
| 2    | Emerald     |
| 3    | Ruby        |
| 4    | Sapphire    |
| 5    | Diamond     |

## Key design decisions

- **Linear lab progression**: B unlocks only when A is cleared (all 7 products
  submitted). C unlocks only when B is cleared (all 9 products). The mock
  service `updateUserProgress()` enforces this server-side; the client
  mirrors it via `recalculateProgress()` in `expedition-storage.ts`.

- **Clues and treasure hunt are optional and never block**: a clue has a 50%
  chance to appear in the FeedbackResultCard toast; the "Try treasure hunt"
  button lives inside the same toast and opens a separate modal that always
  returns a treasure (one of which is an "Empty Cache" dud). Neither affects
  lab completion.

- **Certificate shards**: one per cleared lab (3 total). Collecting all 3
  triggers the final certificate at `/finish` and auto-redirects from the
  final discovery submit.

- **Mock data + backend-ready**: `src/lib/services.ts` is an in-memory mock
  store. Every function mirrors the signature of the original MongoDB-backed
  `services.ts` (preserved verbatim in `src/lib/services.mongodb.ts`). To
  swap to a real DB, replace the body of each function in `services.ts`
  with a Prisma/Mongo call — pages, components, and API routes need no
  changes. The Prisma schema in `prisma/schema.prisma` is already shaped
  to match.

## File map

```
src/
├── app/
│   ├── page.tsx                          # Landing (name + email + department)
│   ├── expedition/page.tsx              # Expedition map (3 checkpoints)
│   ├── expedition/[labId]/page.tsx      # Lab product map
│   ├── discover/[productId]/page.tsx    # Product discovery + feedback
│   ├── certificate/[labId]/page.tsx     # Per-lab certificate shard
│   ├── finish/page.tsx                  # Final certificate
│   ├── leaderboard/page.tsx            # Public rankings
│   ├── admin/...                         # Admin pages (unchanged behaviour)
│   └── api/
│       ├── feedback/route.ts            # POST feedback (mock store)
│       ├── feedback/stats/route.ts
│       ├── admin/feedback/route.ts
│       ├── admin/leaderboard/route.ts
│       ├── admin/product-stats/route.ts
│       ├── expedition/clue/route.ts     # NEW — roll for clue
│       ├── expedition/treasure/route.ts # NEW — roll for treasure
│       └── init/route.ts                # No-op in mock; real DB would seed here
├── components/
│   └── uncharted/
│       ├── GemstoneRating.tsx           # 5 gemstones (Rough Stone..Diamond)
│       ├── ProductCard.tsx              # Replaces MinecraftCard
│       ├── CheckpointCard.tsx           # Lab card with lock/unlock + shard
│       ├── ExpeditionManager.tsx        # FeedbackResultCard toast + TreasureHunt
│       ├── TreasureHunt.tsx             # Optional treasure hunt modal
│       ├── CertificateShardView.tsx    # Single-shard display
│       ├── FinalCertificateView.tsx    # Final certificate
│       ├── ExpeditionProgress.tsx      # Replaces XpBar (shards bar at bottom)
│       ├── CompletionChecker.tsx       # Redirect to /finish on final submit
│       └── AdminRouteGuard.tsx         # Identical to original
├── context/
│   ├── UserContext.tsx                  # Identical shape to original
│   ├── CompletionContext.tsx            # Per-lab + final expedition
│   ├── ExpeditionContext.tsx            # Replaces AchievementContext
│   └── AdminContext.tsx                 # Identical to original
└── lib/
    ├── models.ts                        # TS interfaces for all entities
    ├── mock-data.ts                     # Labs, products, clue pool, treasure pool
    ├── mock-store.ts                    # In-memory store (singleton via globalThis)
    ├── services.ts                      # Mock service layer (swap target for seniors)
    ├── services.mongodb.ts              # REFERENCE ONLY — original Mongo code preserved
    └── expedition-storage.ts            # localStorage persistence helpers
```

## Local development

The workspace's `bun run dev` starts the dev server on port 3000.
Use the Preview Panel or the sandbox URL — `localhost:3000` is internal.

## Swapping the mock store for a real DB

1. `bun add mongodb` (or use Prisma — schema is already defined).
2. Restore `src/lib/mongodb.ts` from the original project (or create a
   Prisma client in `src/lib/db.ts`).
3. For each function in `src/lib/services.ts`, replace the body with the
   matching function from `src/lib/services.mongodb.ts`. Signatures
   already match — no caller-side changes required.
4. Add `MONGODB_URI` and `DB_NAME` to `.env.local`.
5. Hit `POST /api/init` once to seed the labs collection.

## What's deliberately NOT here yet

Per the brief: no cinematic jungle art, no realistic map, no fancy gemstone
artwork, no chests, particles, clouds, fire, or elaborate animations. The
UI is a Tailwind + shadcn skeleton with placeholder text and emojis only.
Visual redesign is a separate pass on top of this skeleton.
