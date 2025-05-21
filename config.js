import * as path from "jsr:@std/path"

export default {
    PORT: 3000,
    HOST: "localhost",
    CLIENT_DIR: path.join(import.meta.dirname, "client"),
    SERVER_DIR: path.join(import.meta.dirname, "server"),
    WEBSOCKET_PATH: "ws"
}