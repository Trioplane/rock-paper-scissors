import config from "../config.js";

const createRoomButton = document.querySelector("#create-room")
const joinRoomInput = document.querySelector("#join-room-input")
const joinRoomButton = document.querySelector("#join-room-button")
const joinContainer = document.querySelector("#join-container")
const gameContainer = document.querySelector("#game-container")
const infoContainer = document.querySelector("#info-container")

let socket = null;
let username = sessionStorage.getItem("username");
let sessionToken = sessionStorage.getItem("sessionToken");
let game = {
    hasJoined: false,
    roomCode: ""
}

document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem("sessionToken")) {
        console.log("Client doesn't have a sessionToken, redirecting to login page.")
        window.location.href = "/login"
        return;
    }

    if (window.location.search) {
        const urlParams = new URLSearchParams(window.location.search)
        const roomCode = urlParams.get("roomCode")
    
        if (!roomCode) return;
    
        connectToRoom(roomCode)
    }
})

joinRoomButton.addEventListener('click', () => {
    if (joinRoomInput.value.length !== config.ROOM_CODE_LENGTH) return console.log("Code must be 6 characters");
    joinRoomButton.disabled = true
    connectToRoom(joinRoomInput.value)
})

createRoomButton.addEventListener('click', async () => {
    createRoomButton.disabled = true
    console.log("Trying to create a room.")
    const res = await fetch(`${config.API_URL}/create-room`)
    if (!res.ok) {
        createRoomButton.disabled = false
        throw new Error("The server couldn't make a room.")
    }

    const resJson = await res.json();
    const { roomCode } = resJson.data
    
    connectToRoom(roomCode)
})

function connectToRoom(roomCode) {
    socket = new WebSocket(`${config.WEBSOCKET_URL}?roomCode=${roomCode}`)
    socket.onopen = () => {
        console.log(`Joining room ${roomCode}`)
        game.roomCode = roomCode;
        joinContainer.classList.add("hidden")
        gameContainer.classList.remove("hidden")
        socket.send(`join ${username} ${sessionToken}`)
    }

    socket.onmessage = async event => {
        const args = event.data.split(" ")
        const command = args.shift();
        await handleMessages(command, args)
    }

    socket.onclose = event => {
        if (event.code !== "4000") {
            _ADDMESSAGE(`Did not disconnect gracefully, reason: ${event.reason}`)
            throw new Error(`Did not disconnect gracefully, reason: ${event.reason}`)
        }

        _ADDMESSAGE(`Disconnected, reason: ${event.reason}`)
    }
}

async function handleMessages(command, args) {
    switch (command) {
        case 'joined': {
            const isMe = args[0] === username
            if (!game.hasJoined) {
                _ADDMESSAGE("Successfully joined room.")
                window.history.pushState(null, "", `?roomCode=${game.roomCode}`)
                game.hasJoined = true;
            }

            _ADDMESSAGE(`Player joined: ${args[args.length - 1]}`);
            _ADDMESSAGE(`Players: ${args.join(", ")}`);
            break;
        }
        case 'start': {
            break;
        }
        case 'left': {
            _ADDMESSAGE(`Player left: ${args[0]}`)
            break;
        }
        default: {
            console.log(`Weird command sent by server: ${command}`)
            console.log(args)
            break;
        }
    }
}

function _ADDMESSAGE(message) {
    const p = document.createElement("p")
    p.textContent = message
    gameContainer.appendChild(p)
    console.log(message)
}