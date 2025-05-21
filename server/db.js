import { MongoClient } from "npm:mongodb"

const MONGODB_URI = Deno.env.get("MONGODB_URI") || "";
const DB = Deno.env.get("DB") || "";

if (!MONGODB_URI || !DB) throw new Error("MongoDB URI or DB is missing.");

const client = new MongoClient(MONGODB_URI);

await client.connect();
await client.db("admin").command({ ping: 1 });
console.log("Connected to MongoDB");

const db = client.db(DB_NAME);
const accounts = db.collection("accounts");

export { db, accounts }