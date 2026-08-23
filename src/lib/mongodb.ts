import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    'MONGODB_URI is not set. Add it to .env.local (e.g. mongodb://localhost:27017/feedback-portal).'
  );
}

const options = {};

// Cache the client promise on globalThis in every environment so hot
// reloads and serverless cold starts reuse one connection pool instead of
// opening a new MongoClient each time.
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise: Promise<MongoClient> = (() => {
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  return globalWithMongo._mongoClientPromise;
})();

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.DB_NAME || 'feedback-portal');
}
