import * as path from "jsr:@std/path"

export default {
    PORT: 3000,
    HOST: "localhost",
    CLIENT_DIR: path.join(import.meta.dirname, "client"),
    SERVER_DIR: path.join(import.meta.dirname, "server"),
    WEBSOCKET_PATH: "ws",
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 20,
    MIN_PASSWORD_LENGTH: 10,
    MAX_PASSWORD_LENGTH: 100,
    SESSION_TOKEN_EXPIRES_AT: 24 * 60 * 60 * 1000,
    GAME: {
        ROOM_CODE_LENGTH: 6,
        IDLE_LOBBY_DELETION_TIME: 60 * 3 * 1000,
        ROOM_CLEANUP_LOOP_DELAY: 30 * 1000,
        MAX_ROUNDS: 4
    }
}