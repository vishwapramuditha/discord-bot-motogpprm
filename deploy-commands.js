require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

const commands = [
    new SlashCommandBuilder()
        .setName("next")
        .setDescription("Shows the full schedule of the next MotoGP weekend in your local time (auto-updating countdown)"),
    new SlashCommandBuilder()
        .setName("standings")
        .setDescription("Shows the current championship standings")
        .addStringOption((option) =>
            option
                .setName("type")
                .setDescription("Choose riders or constructors")
                .setRequired(true)
                .addChoices(
                    { name: "Riders", value: "riders" },
                    { name: "Constructors", value: "constructors" }
                )
        ),
    new SlashCommandBuilder()
        .setName("support")
        .setDescription("Support the developer"),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("🚀 Registering commands...");
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
            body: commands,
        });
        console.log("✅ Commands registered!");
    } catch (error) {
        console.error(error);
    }
})();
