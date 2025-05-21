import Fastify from "npm:fastify"
import FastifyWebSocket from "npm:@fastify/websocket"
import FastifyStatic from "npm:@fastify/static"
import config from "../config.js";
import { registerAPI } from "./api.js";
import { registerWebSocketServer } from "./game.js";

export const app = Fastify();

app.register(FastifyWebSocket)
app.register(FastifyStatic, {
    root: config.CLIENT_DIR
})

registerAPI()
registerWebSocketServer()

await app.listen({ port: config.PORT, host: config.HOST })
console.log(`Server listening on ${config.HOST}${config.PORT}`)