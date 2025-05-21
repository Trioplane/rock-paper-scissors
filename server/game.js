import config from "../config.js";
import { app } from "./index.js";
import { randomCharacterFromString } from "./util.js";

const rooms = new Map()

function generateRoomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "";
    let attempts = 0;
	const maxAttempts = 1000;
    for (let i = 0; i < config.GAME.ROOM_CODE_LENGTH; i++) {
        if (++attempts > maxAttempts) throw new Error("Reached attempt limit on generating room code.")
        code += randomCharacterFromString(chars);
    }

    while (rooms.has(code)) {
        code = "";
        for (let i = 0; i < config.GAME.ROOM_CODE_LENGTH; i++) code += randomCharacterFromString(chars);
    }

    return code
}

function createRoom() {
    const roomCode = generateRoomCode();
    rooms.set(roomCode, new Room());
    return roomCode;
}

function closeRoom(roomCode) {
    const socketsInRoom = rooms.get(roomCode).sockets
    for (const socket of socketsInRoom) {
        socket.close(4000, "Room Closed")
    }

    rooms.delete(roomCode)
}

function cleanupRooms() {
    // todo
}

const RoomStatus = {
    WAITING: 0,
    ACTIVE: 1
}

class Room {
    constructor() {
        this.sockets = new Set();
        this.status = RoomStatus.WAITING;
        this.round = 0;
    }

    get canJoin() {
        if (this.sockets.size >= 2) return false;
        return true
    }

    sendMessage(message) {
        for (const socket of this.sockets) socket.send(message);
    }

    join(socket) {
        if (!this.canJoin) return;
        this.sockets.add(socket)
    }

    leave(socket) {
        this.sockets.delete(socket);
    }
}

export function registerWebSocketServer() {
    app.register(async function (fastify) {
        fastify.get(`/${config.WEBSOCKET_PATH}`, { websocket: true }, (socket, request) => {
            socket.on("message", message => {
                console.log(message.toString())
                socket.send("server says hi")
            })

            socket.on('')
        })
        console.log(`WebSocketServer on /${config.WEBSOCKET_PATH}`)
    })
}