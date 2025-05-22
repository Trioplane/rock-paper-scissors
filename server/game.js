import config from "../config.js";
import { app } from "./index.js";
import { isValidSession } from "./db.js"
import { randomCharacterFromString } from "./util.js";

/** @type {Map<string, Room>} */
const RoomsMap = new Map()
/** @type {Map<string, Player>} */
const PlayersMap = new Map()

function generateRoomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "";
    let attempts = 0;
	const maxAttempts = 1000;
    for (let i = 0; i < config.GAME.ROOM_CODE_LENGTH; i++) {
        if (++attempts > maxAttempts) throw new Error("Reached attempt limit on generating room code.")
        code += randomCharacterFromString(chars);
    }

    while (RoomsMap.has(code)) {
        code = "";
        for (let i = 0; i < config.GAME.ROOM_CODE_LENGTH; i++) code += randomCharacterFromString(chars);
    }

    return code
}

export function createRoom() {
    const roomCode = generateRoomCode();
    RoomsMap.set(roomCode, new Room(roomCode));
    let rooms = "";
    for (const room of RoomsMap.keys()) rooms += `${room} `
    console.log(`Created new room, Active rooms: ${rooms}`)
    return roomCode;
}

function closeRoom(roomCode) {
    const playersInRoom = RoomsMap.get(roomCode).players
    for (const player of playersInRoom.values()) {
        player.socket.close(4000, "Room Closed")
    }

    RoomsMap.delete(roomCode)
}

function cleanupRooms() {
    const referenceTime = Date.now()
    RoomsMap.forEach((room, roomCode) => {
        const roomAge = referenceTime - room.createdAt
        if (room.status === RoomStatus.WAITING && roomAge > config.GAME.IDLE_LOBBY_DELETION_TIME) closeRoom(roomCode);
    })
}

const RoomStatus = {
    WAITING: 0,
    ACTIVE: 1,
    CLOSING: 2
}

const Hands = {
    NONE: 0,
    ROCK: 1,
    PAPER: 2,
    SCISSORS: 3
}

class Room {
    constructor(roomCode) {
        /** @type {Map<string, Player>} */
        this.players = new Map();
        this.status = RoomStatus.WAITING;
        this.round = 0;
        this.createdAt = Date.now();
        this.roomCode = roomCode;
    }

    get canJoin() {
        if (this.players.size >= 2 || this.status !== RoomStatus.WAITING) return false;
        return true
    }

    sendMessage(message) {
        for (const player of this.players.values()) player.socket.send(message);
    }

    join(player) {
        if (!this.canJoin) return false;
        player.roomCode = this.roomCode;

        this.players.set(player.username, player)
        PlayersMap.set(player.username, player)

        let playerUsernames = "";
        for (const player of this.players.values()) playerUsernames += `${player.username} `
        this.sendMessage(`joined ${playerUsernames}`)

        if (this.players.size === 2) this.startGame()

        return true
    }

    leave(player, code, message) {
        this.players.delete(player.username)
        PlayersMap.delete(player.username)
        player.socket.close(code, message)

        if (this.status === RoomStatus.ACTIVE) {
            const winner = this.players.values().next().value
            this.endGame(winner, true)
        }
    }

    startGame() {
        this.sendMessage("start")
        this.status = RoomStatus.ACTIVE
    }

    checkRoundWinner() {
        if (this.players.size !== 2) {
            console.warn(`Room '${this.roomCode}' checkRoundWinner method was called while there ${this.players.size === 1 ? `was ${this.players.size} player` : `were ${this.players.size} players`}!`)
            return
        }
        const playersIterator = this.players.values()
        const p1 = playersIterator.next().value
        const p2 = playersIterator.next().value

        // one hasnt picked a hand yet
        if (p1.hand === Hands.NONE || p2.hand === Hands.NONE) return;

        // tie
        if (p1.hand === p2.hand) {
            this.sendMessage("point")
            return;
        }

        const winningLookup = [
        //     R       P      S
            [ null,  true, false], // R
            [false,  null,  true], // P
            [ true, false,  null], // S
        ]

        // does p1 win
        if (winningLookup[p1.hand][p2.hand]) {
            p1.points++
            this.sendMessage(`point ${p1.username} ${p1.points}`)
        } else {
            // p1 loses so p2 wins
            p2.points++
            this.sendMessage(`point ${p2.username} ${p2.points}`)
        }

        this.round++

        // Check who wins
        if (this.round === config.GAME.MAX_ROUNDS) {
            const p1Wins = p1.points > p2.points;
            if (p1Wins) this.endGame(p1)
            else this.endGame(p2)
        }
    }

    /**
     * @param {Player} winner 
     */
    endGame(winner, opponent_left = false) {
        this.status = RoomStatus.CLOSING

        if (opponent_left) {
            this.sendMessage(`win ${winner.username} true`)
        } else {
            this.sendMessage(`win ${winner.username}`)
        }

        for (const player of this.players.values()) {
            this.players.delete(player.username)
            PlayersMap.delete(player.username)
            player.socket.close(4000, "Game ended.")
        }
    }
}

class Player {
    constructor(username, socket) {
        this.username = username || "Unknown Player";
        this.points = 0;
        this.hand = Hands.NONE;
        this.roomCode = "";
        this.socket = socket || null;
    }

    rock() { this.hand = Hands.ROCK }
    paper() { this.hand = Hands.PAPER; }
    scissors() { this.hand = Hands.SCISSORS; }
    clearHand() { this.hand = Hands.NONE; }

    kick(code, message) {
        this.socket.close(code, message)
    }
}

export function registerWebSocketServer() {
    app.register(async function (fastify) {
        fastify.get(`/${config.WEBSOCKET_PATH}`, { websocket: true }, (socket, request) => {
            socket.on("message", async message => {
                const raw = message.toString();
                const args = raw.split(" ");
                const command = args.shift();

                await runCommands(command, args, request.query.roomCode, socket)
            })

            socket.on('close', () => {
                const room = RoomsMap.get(socket.rps.player.roomCode)
                PlayersMap.delete(socket.rps.player.username)
                if (!room) return
                room.players.delete(socket.rps.player.username)
                room.sendMessage(`left ${socket.rps.player.username}`)
                
                if (room.players.size === 0) {
                    closeRoom(room.roomCode)
                }
                // on close
                // check if room has 0 players, if yes, remove room
            })
        })
        console.log(`WebSocketServer on /${config.WEBSOCKET_PATH}`)
    })
}

async function runCommands(command, args, roomCode, socket) {
    // TODO
    switch (command) {
        case 'join': {
            if (!roomCode) return socket.close(1002, "Expected room code.")
            if (args.length !== 2) return socket.close(1002, "Expected 2 arguments.")

            const username = args[0]
            const sessionToken = args[1]

            const room = RoomsMap.get(roomCode);
            
            if (!room) return socket.close(4001, "Room not found.")
            console.log(room)
            console.log(room.players)
            console.log("what???????")
            if (!room.canJoin) return socket.close(4001, "Room is full.")
            console.log("what2???????")

            if (PlayersMap.get(username)) return socket.close(4001, "Player is already in a room.")

            if (!await isValidSession(username, sessionToken)) return socket.close(4001, "Invalid session.");
            
            const player = new Player(username, socket)
            socket.rps = { player }
            const joined = room.join(player);

            if (!joined) return socket.close(4001, "Room is full.")

            break;
        }      
        case 'play': {
            console.log(`someone played ${args[0]}`)
            break;
        }
        case 'ping': {
            console.log(`pinged`)
            socket.send('pong')
            break;
        }
        default: {
            // weird command, closing socket to prevent malicious clients
            socket.close()
            break;
        }
    }
}

setInterval(cleanupRooms, config.GAME.ROOM_CLEANUP_LOOP_DELAY)