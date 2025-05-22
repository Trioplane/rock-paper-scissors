import * as bcrypt from "jsr:@felix/bcrypt";
import { MongoClient } from "npm:mongodb";

const MONGODB_URI = Deno.env.get("MONGODB_URI") || "";
const DB = Deno.env.get("DB") || "";

if (!MONGODB_URI || !DB) throw new Error("MongoDB URI or DB is missing.");

const client = new MongoClient(MONGODB_URI);

await client.connect();
await client.db("admin").command({ ping: 1 });
console.log("Connected to MongoDB");

const db = client.db(DB);
const accounts = db.collection("accounts");
const stats = db.collection("stats");

async function isValidSession(username, sessionToken) {
	const account = await accounts.findOne({ username });
	if (account === null) return false;

	if (!account?.session) return false;

	const referenceTime = Date.now();
	if (account.session.expires_at < referenceTime) {
		await accounts.updateOne({ username }, { $unset: { session: "" } });
		return false;
	}

	const isValidSessionToken = await bcrypt.verify(sessionToken, account.session.token);
	if (!isValidSessionToken) return false;
	return true;
}

export { db, accounts, stats, isValidSession };
