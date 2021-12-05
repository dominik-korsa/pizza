import {google} from "googleapis";
import * as fs from "fs";
import {requireEnv} from "./utils";

const scope = [
    'https://www.googleapis.com/auth/script.external_request',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.scripts'
];

const client = new google.auth.OAuth2({
    clientId: requireEnv('GOOGLE_CLIENT_ID'),
    clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
    redirectUri: requireEnv('GOOGLE_REDIRECT_URI'),
});

function authenticate(refreshToken: string) {
    client.setCredentials({
        refresh_token: refreshToken,
    });
}

export async function initAuth() {
    try {
        authenticate(await fs.promises.readFile('./google-refresh-token.txt', {
            encoding: 'utf-8',
        }));
    } catch (error) {
        console.warn("Refresh token not found");
    }
}

export function generateAuthUrl(): string {
    return client.generateAuthUrl({
        prompt: 'consent',
        access_type: 'offline',
        scope,
    });
}

export async function handleGoogleCallback(code: string) {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    if (!tokens.refresh_token) throw new Error('Missing refresh token');
    await fs.promises.writeFile('./google-refresh-token.txt',  tokens.refresh_token, {
        encoding: 'utf-8',
    });
}

export type AddPersonResult = 'error' | 'name-exists' | 'discord-id-exists' | 'added-discord-id' | 'ok';
export async function addPerson(name: string, discordId: string, className: string): Promise<AddPersonResult> {
    try {
        const script = google.script('v1');
        const response = await script.scripts.run({
            auth: client,
            scriptId: requireEnv('GOOGLE_SCRIPT_ID'),
            requestBody: {
                // devMode: true,
                function: 'addPerson',
                parameters: [name, discordId, className],
            },
        });
        if (response.data.error) return 'error';
        return response.data.response?.result as 'name-exists' | 'discord-id-exists' | 'added-discord-id' | 'ok';
    } catch (error) {
        console.error(error);
        return 'error';
    }
}

export type OrderResult = 'error' | 'no-spreadsheet' | 'unknown-user' | 'ok';
export async function order(discordId: string, drink: string): Promise<OrderResult> {
    try {
        const script = google.script('v1');
        const response = await script.scripts.run({
            auth: client,
            scriptId: requireEnv('GOOGLE_SCRIPT_ID'),
            requestBody: {
                // devMode: true,
                function: 'order',
                parameters: [discordId, drink],
            },
        });
        if (response.data.error) return 'error';
        return response.data.response?.result as 'no-spreadsheet' | 'unknown-user' | 'ok';
    } catch (error) {
        console.error(error);
        return 'error';
    }
}

export type CompleteResultError = {code: 'error' | 'no-spreadsheet' | 'unknown-user' | 'no-order'};
export type CompleteResultOk = {code: 'ok', totalPrice: string};
export async function complete(discordId: string, pieces: number): Promise<CompleteResultError | CompleteResultOk> {
    try {
        const script = google.script('v1');
        const response = await script.scripts.run({
            auth: client,
            scriptId: requireEnv('GOOGLE_SCRIPT_ID'),
            requestBody: {
                // devMode: true,
                function: 'complete',
                parameters: [discordId, pieces],
            },
        });
        if (response.data.error) return {code: 'error'};
        return response.data.response?.result as {code: 'no-spreadsheet' | 'unknown-user' | 'no-order'} | {code: 'ok', totalPrice: string};
    } catch (error) {
        console.error(error);
        return {code: 'error'};
    }
}

export async function printByDiscordId(discordId: string): Promise<boolean> {
    try {
        const script = google.script('v1');
        const response = await script.scripts.run({
            auth: client,
            scriptId: requireEnv('GOOGLE_SCRIPT_ID'),
            requestBody: {
                // devMode: true,
                function: 'printByDiscordId',
                parameters: [discordId],
            },
        });
        if (response.data.error) return false;
    } catch (error) {
        console.error(error);
        return false;
    }
    return true;
}
