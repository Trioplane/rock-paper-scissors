import Fastify from "npm:fastify"
import FastifyWebSocket from "npm:@fastify/websocket"
import * as path from "jsr:@std/path"
import config from "../config.js";

const app = Fastify();
const supportedMimeTypes = {
    html: "text/html",
    css: "text/css",
    js: "text/javascript",
    json: "application/json",
}

app.register(FastifyWebSocket)

app.register(async function (fastify) {
    fastify.get(`/*`, async (request, reply) => {
        const filePath = path.join(config.CLIENT_DIR, request.url)

        let pathInfo;

        try {
            pathInfo = await Deno.lstat(filePath)
        } catch {
            return reply.code(404).send(new Error(`'${filePath}' not found`))
        }

        // Show the file
        if (pathInfo.isFile) {
            const fileExtension = request.url.split('.').pop()
            if (!(fileExtension in supportedMimeTypes)) return reply.code(400).send(new Error(`Unsupported file type '${fileExtension}'`))
            const file = await Deno.readFile(filePath)
            reply.header('Content-Type', supportedMimeTypes[fileExtension])
            return reply.send(file)
        }

        // See if theres an index.html inside the directory and show that.
        if (pathInfo.isDirectory) {
            let htmlPagePath = null;
            for await (const dirEntry of Deno.readDir(filePath)) {
                if (!dirEntry.isFile) continue
                if (dirEntry.name === "index.html") {
                    htmlPagePath = path.join(filePath, dirEntry.name)
                    break
                }
            }

            if (htmlPagePath === null) return reply.code(404).send(new Error(`No page found in ${filePath}`));

            const file = await Deno.readFile(htmlPagePath)
            reply.header('Content-Type', supportedMimeTypes["html"])
            return reply.send(file)
        }
    })

    fastify.get(`/${config.WEBSOCKET_PATH}`, { websocket: true }, (socket, request) => {
        socket.on("message", message => {
            console.log(message.toString())
            socket.send("server says hi")
        })
    })
    console.log(`WebSocketServer on /${config.WEBSOCKET_PATH}`)
})

await app.listen({ port: config.PORT, host: config.HOST })
console.log(`Server listening on ${config.HOST}${config.PORT}`)