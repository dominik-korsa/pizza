import {Client as InteractionsClient} from "discord-slash-commands-client";
import {requireEnv} from "./utils";

export async function registerDiscordCommands() {
    const slashCommandClient = new InteractionsClient(requireEnv('DISCORD_TOKEN'), requireEnv('DISCORD_CLIENT_ID'));
    const guildId = requireEnv('DISCORD_GUILD_ID');

    await slashCommandClient.createCommand({
        name: 'link',
        description: 'Powiąż swoje konto na Discordzie z imieniem i nazwiskiem',
        options: [
            {
                name: 'name',
                description: 'Imię i nazwisko',
                type: 3,
                required: true,
            },
            {
                name: 'class',
                description: 'Klasa',
                type: 3,
                required: true,
            },
        ]
    }, guildId);

    await slashCommandClient.createCommand({
        name: 'order',
        description: 'Dodaj swoje imię i nazwisko do listy zamówień',
        options: [
            {
                name: 'drink',
                description: 'Czy chcesz zamówić napój?',
                choices: [
                    {
                        name: 'Własny kubek',
                        value: 'Własny kubek',
                    },
                    {
                        name: 'Jednorazowy kubek',
                        value: 'Jednorazowy kubek',
                    },
                    {
                        name: 'Bez napoju',
                        value: 'Bez napoju',
                    }
                ],
                type: 3,
                required: true,
            },
        ]
    }, guildId);

    await slashCommandClient.createCommand({
        name: 'complete',
        description: 'Zakończ zamówienie przez dodanie liczby zjedzonych kawałków',
        options: [
            {
                name: 'pieces',
                description: 'Liczba kawałków',
                type: 4,
                // @ts-ignore
                min_value: 0, // see https://github.com/MatteZ02/discord-interactions/issues/23
                required: true,
            },
        ]
    }, guildId);
}
