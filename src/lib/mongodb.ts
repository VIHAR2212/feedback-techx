import { MongoClient, Db, MongoClientOptions } from 'mongodb';

// Serverless + MongoDB Atlas M0 (free tier) connection strategy.
//
// M0 allows a hard maximum of 500 concurrent connections across the whole
// cluster. Every warm Vercel lambda instance holds its own pool, and the
// driver default is maxPoolSize: 100 — so just 5 concurrent instances would
// exhaust the cluster and every further request would fail with
// "connection pool cleared". We therefore run a deliberately tiny pool per
// instance and let idle sockets die quickly, which keeps a few hundred
// concurrent lambdas comfortably inside the cap.
const OPTIONS: MongoClientOptions = {
  // ~5 sockets per lambda -> ~100 concurrent instances before we approach
  // M0's 500-connection ceiling. Raise only if you move to M10+.
  maxPoolSize: 5,
  minPoolSize: 0,
  // Vercel freezes idle lambdas; released sockets stop counting against the
  // cluster cap while an instance is parked between requests.
  maxIdleTimeMS: 15_000,
  waitQueueTimeoutMS: 5_000,
  // Fail fast instead of holding a lambda open for the platform timeout.
  serverSelectionTimeoutMS: 8_000,
  connectTimeoutMS: 10_000,
  socketTimeoutMS: 20_000,
  retryWrites: true,
  retryReads: true,
  // w:1 rather than majority — one less inter-node round trip per insert on
  // a shared-CPU M0. Event feedback can tolerate the (very unlikely) loss of
  // an in-flight write during a failover; throughput matters more here.
  w: 1,
  appName: 'techx-expedition',
};

// Cache the client promise on globalThis in every environment so hot
// reloads and warm serverless invocations reuse one connection pool instead
// of opening a new MongoClient each time.
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

function getClientPromise(): Promise<MongoClient> {
  // Resolve the URI lazily so importing this module never throws at build
  // time (next build evaluates route modules to collect page data even when
  // they are dynamically rendered). Requests fail fast at runtime instead.
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to .env.local (e.g. mongodb://localhost:27017/feedback-portal) or configure it in your hosting provider.'
    );
  }

  if (!globalWithMongo._mongoClientPromise) {
    // Drop the cached promise if the initial connect fails, otherwise every
    // later request in this instance replays the same rejection forever.
    globalWithMongo._mongoClientPromise = new MongoClient(uri, OPTIONS)
      .connect()
      .catch((err) => {
        globalWithMongo._mongoClientPromise = undefined;
        throw err;
      });
  }

  return globalWithMongo._mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.DB_NAME || 'feedback-portal');
}
