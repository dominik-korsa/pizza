import {requireEnv} from "./utils";
import {Client, Intents, MessageActionRow, MessageButton} from "discord.js";
import {
    addPerson,
    AddPersonResult,
    complete,
    CompleteResultError,
    order,
    OrderResult, printByDiscordId
} from "./google-api";

export async function startDiscord() {
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

    client.on('interactionCreate', async (interaction) => {
        if (interaction.isCommand()) {
            if (interaction.commandName === 'link') {
                await interaction.deferReply({ephemeral: true});
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
                await interaction.deferReply({ephemeral: true});
                const result = await order(interaction.member.user.id, interaction.options.getString('drink') as string);
                const responses: { [K in OrderResult]: string; } = {
                    error: ':x: Wystąpił nieoczekiwany błąd',
                    "no-spreadsheet": ":x: Nie znaleziono arkusza dla dzisiejszej daty",
                    "unknown-user": ":x: Nie znaleziono osoby przypisanej do konta Discord. Użyj komendy /link aby powiązać",
                    ok: ":white_check_mark: Sukces",
                };
                await interaction.editReply({
                    content: responses[result],
                });
            } else if (interaction.commandName === 'complete') {
                await interaction.deferReply({ephemeral: true});
                const result = await complete(interaction.member.user.id, interaction.options.getInteger('pieces') as number);
                const responses: { [K in CompleteResultError["code"]]: string; } = {
                    error: ':x: Wystąpił nieoczekiwany błąd',
                    "no-spreadsheet": ":x: Nie znaleziono arkusza dla dzisiejszej daty",
                    "unknown-user": ":x: Nie znaleziono osoby przypisanej do konta Discord. Użyj komendy /link aby powiązać",
                    "no-order": ":x: Nie złożyłeś zamówienia",
                };
                if (result.code !== 'ok') {
                    await interaction.editReply({
                        content: responses[result.code],
                    });
                } else if (result.totalPrice === '') {
                    await interaction.editReply({
                        content: ':white_check_mark: Dodano liczbę kawałków\n'
                            + 'Nie można określic ceny',
                    });
                } else {
                    const row = new MessageActionRow();
                    row.addComponents(
                        new MessageButton()
                            .setCustomId('print')
                            .setLabel('Wydrukuj paragon')
                            .setStyle('PRIMARY')
                            .setEmoji('🖨️'),
                    )
                    await interaction.editReply({
                        content: ':white_check_mark: Dodano liczbę kawałków\n'
                            + `Do zapłaty: **${result.totalPrice}**`,
                        components: [row],
                    });
                }
            } else console.warn('Unknown command', interaction.commandName);
        } else if (interaction.isButton()) {
            if (interaction.customId === 'print') {
                await interaction.deferReply({
                    ephemeral: true,
                });
                if (await printByDiscordId(interaction.member.user.id)) {
                    await interaction.followUp({
                        ephemeral: true,
                        content: ':white_check_mark: Wydrukowano'
                    });
                } else {
                    await interaction.followUp({
                       ephemeral: true,
                       content: ':x: Nie można wydrukować',
                    });
                }
            } else {
                console.warn('Unknown button', interaction.customId)
            }
        }
    });

    await client.login(requireEnv('DISCORD_TOKEN'));
}
