import { MongoClient, Db } from 'mongodb';

// Cache the client promise on globalThis in every environment so hot
// reloads and serverless cold starts reuse one connection pool instead of
// opening a new MongoClient each time.
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

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
    globalWithMongo._mongoClientPromise = new MongoClient(uri).connect();
  }

  return globalWithMongo._mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.DB_NAME || 'feedback-portal');
}
