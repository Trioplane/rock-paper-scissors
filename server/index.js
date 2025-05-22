import Fastify from "npm:fastify"
import FastifyWebSocket from "npm:@fastify/websocket"
import FastifyStatic from "npm:@fastify/static"
import config from "../config.js";
import { registerAPI } from "./api.js";
import { registerWebSocketServer } from "./game.js";

const envToLogger = {
	development: {
		transport: {
			target: "pino-pretty",
			options: {
				translateTime: "HH:MM:ss Z",
				ignore: "pid,hostname",
			},
		},
	},
	production: true,
	test: false,
};

export const app = Fastify({
    logger: envToLogger[Deno.env.get("ENVIRONMENT")] ?? true
});

app.register(FastifyWebSocket)
app.register(FastifyStatic, {
    root: config.CLIENT_DIR,
    prefix: "/",
    index: "index.html",
    redirect: true
})

registerAPI()
registerWebSocketServer()

await app.listen({ port: config.PORT, host: config.HOST })
console.log(`Server listening on ${config.HOST}${config.PORT}`)