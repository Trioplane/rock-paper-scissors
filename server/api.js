import * as bcrypt from "jsr:@felix/bcrypt"
import * as crypto from "node:crypto"
import { accounts, stats } from "./db.js";
import { app } from './index.js'
import { AccountLoginSchema, AccountRegisterSchema } from "./schemas.js";
import { wrap } from "./util.js";
import config from "../config.js";
import * as game from "./game.js"

/**
 * @type {Record<string,import("fastify").FastifySchema>}
 * Defining schemas for data validation
 */
const schemas = {
    register: { body: AccountRegisterSchema },
    login: { body: AccountLoginSchema }
}

export function registerAPI() {
    console.log("Registering API routes...")
    app.register(async function (fastify) {
        fastify.post('/api/register', { schema: schemas.register }, async (request, reply) => {
            const data = request.body
            // check if account already exists
            const accountExists = (await accounts.findOne({ username: data.username })) !== null;
            if (accountExists) return reply.code(409).send(new Error("Account already exists"));

            // creating account
            const hashedPassword = await bcrypt.hash(data.password)
            await accounts.insertOne({
                username: data.username,
                password: hashedPassword,
            })
            await stats.insertOne({
                username: data.username,
                stats: {
                    wins: 0,
                    losses: 0
                }
            })

            return wrap.message("Account created")
        })

        fastify.post('/api/login', { schema: schemas.login }, async (request, reply) => {
            /**
             * Expects
             * {
             *   username: string
             *   password: string
             * }
             */
            const data = request.body;

            const account = await accounts.findOne({ username: data.username });
            if (account === null) return reply.code(404).send(new Error("Account not found"));

            const isPasswordCorrect = await bcrypt.verify(data.password, account.password)
            if (!isPasswordCorrect) return reply.code(401).send(new Error("Wrong password."));

            // checks passed
            const sessionToken = crypto.randomBytes(256).toString("hex");
            const hashedSessionToken = await bcrypt.hash(sessionToken)
            await accounts.updateOne({ username: account.username }, {
                $set: {
                    session: {
                        token: hashedSessionToken,
                        expires_at: Date.now() + config.SESSION_TOKEN_EXPIRES_AT
                    }
                }
            })
                
            return wrap.messageAndData("Successfully created account", {
                username: account.username,
                sessionToken
            })
        })

        fastify.get('/api/create-room', async (request, reply) => {
            const roomCode = game.createRoom();
            return wrap.messageAndData("Created room", { roomCode })
        })
    })
    console.log("Registered API routes.")
}