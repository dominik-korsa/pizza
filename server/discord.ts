import {requireEnv} from "./utils";
import {Client, Intents} from "discord.js";
import {addPerson, AddPersonResult, order, OrderResult} from "./google-api";

export async function startDiscord() {
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;
        if (interaction.commandName === 'link') {
            await interaction.deferReply({ ephemeral: true });
            const result = await addPerson(
                interaction.options.getString('name') as string,
                interaction.member.user.id,
                interaction.options.getString('class') as string,
            );
            const responses: { [K in AddPersonResult]: string; } = {
                error: ':x: Wystąpił nieoczekiwany błąd',
                'added-discord-id': ":white_check_mark: Uzupełniono konto Discord",
                "discord-id-exists": ":x: Już się wpisałeś",
                "name-exists": ":x: To imię i nazwisko jest przypisane do innego konta Discord",
                ok: ":white_check_mark: Sukces",
            };
            await interaction.editReply({
                content: responses[result],
            });
        } else if (interaction.commandName === 'order') {
            await interaction.deferReply({ ephemeral: true });
            const result = await order(interaction.member.user.id, interaction.options.getString('drink') as string);
            const responses: { [K in OrderResult]: string; } = {
                error: ':x: Wystąpił nieoczekiwany błąd',
                "no-spreadsheet": ":x: Nie znaleziono arkusza dla dzisiejszej daty",
                "unknown-user": ":x: Nie znaleziono użytkownika. Użyj komendy /link aby go dodać",
                ok: ":white_check_mark: Sukces",
            };
            await interaction.editReply({
                content: responses[result],
            });
        }
        else console.warn('Unknown command', interaction.commandName);
    });

    await client.login(requireEnv('DISCORD_TOKEN'));
}
