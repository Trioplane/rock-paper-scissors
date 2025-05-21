export const wrap = {
    message: (message) => ({ message }),
    messageAndData: (message, data) => ({ message, data })
}

export const randomCharacterFromString = (str) => str.charAt(Math.floor(Math.random() * str.length))