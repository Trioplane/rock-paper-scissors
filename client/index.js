import config from "./config.js"

/**
 * @type {WebSocket}
 */
let socket;

const connectButton = document.querySelector("#connect");
const submitButton = document.querySelector("#submit");
const disconnectButton = document.querySelector("#disconnect");

connectButton.addEventListener('click', () => {
    socket = new WebSocket(config.WEBSOCKET_URL);
    socket.onmessage = handleOnMessage
    connectButton.disabled = true
    submitButton.disabled = false
    disconnectButton.disabled = false
})

submitButton.addEventListener('click', () => {
    socket.send("text")
    submitButton.disabled = true
})

disconnectButton.addEventListener('click', () => {
    socket.close(1000, "user closed connection")
    connectButton.disabled = false
    submitButton.disabled = true
    disconnectButton.disabled = true
})

function handleOnMessage(event) {
    console.log(event.data);
	submitButton.disabled = false;
}