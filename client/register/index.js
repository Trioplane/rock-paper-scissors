import config from "../config.js";

const usernameInput = document.querySelector("#username")
const passwordInput = document.querySelector("#password")
const confirmPasswordInput = document.querySelector("#confirm-password")
const registerButton = document.querySelector("#register")

async function register() {
    if (confirmPasswordInput.value !== passwordInput.value) {
        console.log("confirm password does not match")
        return
    }

    const payload = {
        username: usernameInput.value,
        password: passwordInput.value
    }

    const res = await fetch(`${config.API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })

    const json = await res.json()

    console.log(`did i register? ${res.ok}, ${json.message}`)
}

registerButton.addEventListener('click', register)