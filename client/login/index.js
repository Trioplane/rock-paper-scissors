import config from "../config.js";

const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const loginButton = document.querySelector("#login");

async function login() {
    if (usernameInput.value.length === 0) {
        console.log("empty username")
        return
    }

    if (passwordInput.value.length === 0) {
        console.log("empty password")
        return
    }

    const payload = {
        username: usernameInput.value,
        password: passwordInput.value
    }

    const res = await fetch(`${config.API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })

    const resJson = await res.json()

    if (!res.ok) {
        switch (res.status) {
            case 404:
                console.log("account not found")
                break
            case 401:
                console.log("wrong password")
                break
            case 400:
                console.log("invalid data, report to administrators")
                break
            default:
                console.log("weird error, report to administrators or try again")
                break;
        }
    }

    const { data } = resJson;
    
    // store sessionToken and username to client so we can authorize ourselves
    sessionStorage.setItem("username", data.username);
	sessionStorage.setItem("sessionToken", data.sessionToken);
}

loginButton.addEventListener('click', login)