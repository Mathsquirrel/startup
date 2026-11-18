import { MongoClient } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(directory, 'dbConfig.json');
const dbConfig = process.env.DB_CONFIG
  ? JSON.parse(process.env.DB_CONFIG)
  : JSON.parse(fs.readFileSync(configPath, 'utf8'));

const databaseName = dbConfig.databaseName || 'pdf_decks';
const connectionUrl = process.env.MONGODB_URI
  || `mongodb+srv://${encodeURIComponent(dbConfig.userName)}:${encodeURIComponent(dbConfig.password)}@${dbConfig.hostname}/${databaseName}`;

const client = new MongoClient(connectionUrl);

let connection;

export async function getDatabase() {
  if (!connection) {
    connection = client.connect().then(() => client.db(databaseName));
  }
  return connection;
}

export async function getCollection(name) {
  const database = await getDatabase();
  return database.collection(name);
}

export async function closeDatabase() {
  if (connection) {
    await client.close();
    connection = undefined;
  }
}
