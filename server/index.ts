import dotenv from "dotenv";
dotenv.config();

import {startApi} from "./api";
import {startDiscord} from "./discord";
import {registerDiscordCommands} from "./discordCommands";
import {initAuth} from "./google-api";

async function start() {
    await initAuth();
    console.log('Auth ready');
    await startApi();
    console.log('API started');
    await registerDiscordCommands();
    console.log('Commands registered');
    await startDiscord();
    console.log('Discord started');
}

start().catch((error) => {
    console.error(error);
    process.exit(1);
});
