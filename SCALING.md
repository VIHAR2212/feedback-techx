# Event-day runbook — 20,000 attendees on Vercel Hobby + Atlas M0

Everything below is about one number: **how many requests actually reach
MongoDB.** The free tiers are generous about traffic they never have to
think about, and unforgiving about traffic they do.

---

## 1. The problem the caching solves

The leaderboard refreshes every 5 seconds. If 10,000 phones have it open:

```
10,000 clients ÷ 5s = 2,000 requests/second
```

No schema makes an M0 cluster answer 2,000 queries per second, and Hobby
function concurrency would be saturated long before that.

`/api/leaderboard` therefore returns:

```
Cache-Control: public, max-age=0, s-maxage=5, stale-while-revalidate=30
```

Vercel's edge network serves every request that arrives inside a 5-second
window from its own copy, and forwards exactly **one** to the function.

```
2,000 req/s at the edge  →  ~0.2 req/s at MongoDB
```

That ratio holds whether 200 or 20,000 people are watching — the origin
load is a function of the *poll interval*, not the audience. `max-age=0`
keeps browsers from caching privately, so every phone still sees data that
is at most 5 seconds old. `stale-while-revalidate` means the one refresh
that does run happens in the background: nobody ever waits on a query.

Same treatment, 10s window: `/api/product-stats`, `/api/feedback/stats`.

Behind the CDN, `src/lib/cache.ts` adds a per-instance cache with
single-flight de-duplication — if several requests miss the edge at once,
they share one database query instead of starting one each.

**Do not add `no-store` to these routes.** It removes the edge cache and
sends the full poll volume to the origin.

---

## 2. Schema

Four collections. Read paths touch counters; nothing scans the ledger.

### `feedback` — the raw ledger, one row per (explorer, product)

| Field | Notes |
| :-- | :-- |
| `studentEmail` | lowercased at the API boundary |
| `studentName`, `studentDepartment` | |
| `tableId` | product id |
| `labId` | sector |
| `rating` | 1–5 |
| `comment` | capped at 400 chars — see storage note below |
| `submissionId` | client idempotency key |
| `timestamp`, `createdAt` | server-generated; client values ignored |

Indexes:

| Index | Purpose |
| :-- | :-- |
| `{studentEmail, tableId}` **unique** | one rating per person per product. This is the *only* duplicate protection — the write path inserts optimistically and reads a `11000` error as "duplicate". |
| `{submissionId}` unique sparse | retried / offline-queued submits are idempotent |
| `{timestamp: -1}` | ledger sort + keyset cursor |
| `{tableId, timestamp: -1}` | filtered ledger, filter and sort from one index |
| `{studentDepartment, timestamp: -1}` | ditto |

### `users` — one per explorer, with denormalized counters

`feedbackCount`, `ratingSum`, `completedCount`, `isCompleted`, `rankScore`.

`rankScore` packs the entire leaderboard ordering into one sortable number:

```
rankScore = (isCompleted ? 1e9 : 0) + completedCount × 1e4 + round(avgRating × 100)
```

so ranking becomes `find().sort({rankScore: -1}).limit(50)` — an index scan
of 50 documents. `updatedAt` ascending breaks ties, which stops the board
shuffling between equal scores on every poll.

Index: `{rankScore: -1, updatedAt: 1}`.

> The previous implementation `$lookup`-joined every user against the whole
> feedback collection with no limit. At 20k explorers and ~100k ratings that
> is a full cross-product scan on shared CPU — it does not get slow, it times
> out.

### `productStats` — one document per product (~26 rows)

`totalRatings`, `ratingSum`, `r1`–`r5`, `totalComments`, `lastRated`,
maintained with `$inc`. Reading it is a 26-document scan instead of a
`$group` over the entire ledger.

### `eventStats` — exactly one document (`_id: "global"`)

`totalFeedback`, `ratingSum`. The old stats query built an `$addToSet`
array of every distinct explorer email just to take its `.length`.

---

## 3. Write path

One submission costs **at most 4 round trips**, and the reads are O(1)
regardless of how much data the event has collected:

1. `insertOne` into `feedback` — optimistic, no pre-read. Concurrent submits
   from the same explorer cannot both win; the unique index decides.
2. `findOneAndUpdate` on `users` — atomic `$addToSet` + `$inc`, returns the
   updated document.
3. A follow-up `$set` **only if** derived fields (shards, unlocks,
   `rankScore`) actually changed.
4. `productStats` + `eventStats` `$inc`, issued in parallel.

`rankScore` is recomputed from values read back rather than incremented, so
a counter that ever drifts is repaired by that explorer's next submission.

A replayed `submissionId` still confirms the product but increments nothing
— otherwise a flaky network would inflate someone's average.

---

## 4. Connection pooling (the M0 trap)

M0 allows **500 concurrent connections cluster-wide**. The driver's default
`maxPoolSize` is 100 and every warm lambda holds its own pool — so five
concurrent instances exhaust the cluster and everything after that fails
with "connection pool cleared".

`src/lib/mongodb.ts` sets `maxPoolSize: 5`, `minPoolSize: 0`,
`maxIdleTimeMS: 15000`. That is roughly 100 concurrent lambdas before the
ceiling is a concern, and idle sockets are released while an instance is
frozen between requests.

**Do not append `maxPoolSize` to `MONGODB_URI`** — the URI overrides the
client options.

---

## 5. Before the event

```bash
npm run db:setup
```

Run this **once** against the production cluster. It creates every index
and backfills the counters. Building indexes on a live, already-populated
collection stalls writes — you do not want that at 10:00 on event day. It
is idempotent, and re-running it repairs counters if they ever drift.

Then set in Vercel → Settings → Environment Variables (Production):

| Variable | Value | Why |
| :-- | :-- | :-- |
| `MONGODB_URI` | Atlas SRV string | |
| `DB_NAME` | `uncharted-expedition` | |
| `AUTO_DB_SETUP` | `false` | otherwise every cold start re-issues index creation |
| `SEED_DEMO_DATA` | `false` | **critical** — `true` puts Nathan Drake on the live leaderboard |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` | your own values | |

In **Atlas → Network Access, allow `0.0.0.0/0`.** Vercel functions have no
stable outbound IPs; an address allowlist will lock the app out mid-event.

To clear the demo explorers from a database that already has them:

```bash
npm run db:reset-demo
```

---

## 6. Storage budget (M0 = 512 MB)

Comments are the only unbounded field, capped at 400 characters.

```
100,000 ratings × ~500 B  ≈  50 MB documents
                          +  ~25 MB indexes
                          ≈  75 MB
```

Comfortable. If you raise the comment cap, recheck this — at 1,000
characters and full participation you would approach the limit.

---

## 7. Rate limiting

Deliberately keyed by **email, not IP**. Thousands of phones at a campus
event share a handful of NAT addresses; an IP limiter would lock out entire
lecture halls. Genuine duplicates are already impossible thanks to the
unique index, so the limiter only blunts a runaway client retry loop.

It is per-lambda-instance and therefore best-effort. That is the right
trade here — a stricter shared limiter would need Redis, which is not on
the free tier, and the unique index is the real protection.

---

## 8. Admin ledger and CSV export

The ledger is keyset-paginated (50 rows per request, `cursor` = timestamp of
the last row). `skip` was removed: it makes Mongo walk and discard every
document before the requested page.

`/api/admin/export` streams the full filtered ledger as CSV straight off a
MongoDB cursor. Nothing is buffered, so it works at 100k+ rows where
building the CSV in the browser — the old behaviour — would not. The Export
CSV button always exports the **complete** filtered set, not just the rows
currently on screen.

---

## 9. What to watch during the event

| Where | Signal | Meaning |
| :-- | :-- | :-- |
| Atlas → Metrics → Connections | approaching 500 | too many warm lambdas; lower `maxPoolSize` |
| Atlas → Metrics → Opcounters | query rate climbing with attendance | the edge cache is being bypassed — check the `Cache-Control` headers survived |
| Vercel → Logs | `[store] Falling back to memory store` | MongoDB is unreachable. **The site keeps serving but data is no longer persisted.** Investigate immediately. |
| Response header | `x-vercel-cache: HIT` on `/api/leaderboard` | caching is working. `MISS` on every request means it is not. |

Quick check once deployed:

```bash
curl -sI https://<your-app>.vercel.app/api/leaderboard | grep -i 'cache'
# expect: cache-control: public, max-age=0, s-maxage=5, ...
# and on a second call within 5s: x-vercel-cache: HIT
```

---

## 10. Known limits

- **Vercel Hobby has no SLA and is not licensed for commercial use.** For a
  departmental event this is fine; be aware it exists.
- Leaderboard data is up to 5 seconds stale by design. That is the trade
  that makes 5-second refresh affordable at all.
- The in-process cache is per-instance, so two lambdas can briefly disagree
  by a few seconds. Invisible at a 5-second refresh.
- `estimatedDocumentCount` (explorer total on the admin dashboard) reads
  collection metadata and can lag by a few seconds after a burst.
