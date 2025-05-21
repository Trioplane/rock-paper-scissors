import config from "../config.js";

export const AccountRegisterSchema = {
	type: "object",
	required: ["username", "password"],
	properties: {
		username: {
			type: "string",
			pattern: "^[a-zA-Z0-9]+$",
			minLength: config.MIN_USERNAME_LENGTH,
			maxLength: config.MAX_USERNAME_LENGTH,
		},
		password: {
			type: "string",
			minLength: config.MIN_PASSWORD_LENGTH,
			maxLength: config.MAX_PASSWORD_LENGTH,
		},
	},
};

export const AccountLoginSchema = {
	type: "object",
	required: ["username", "password"],
	properties: {
		username: {
			type: "string",
			pattern: "^[a-zA-Z0-9]+$",
			maxLength: config.MAX_USERNAME_LENGTH,
		},
		password: {
			type: "string",
			maxLength: config.MAX_PASSWORD_LENGTH,
		},
	},
};