require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

const commands = [
    new SlashCommandBuilder()
        .setName("nextmotogp")
        .setDescription("Shows the next MotoGP weekend schedule with live countdowns"),

    new SlashCommandBuilder()
        .setName("nextf1")
        .setDescription("Shows the next Formula 1 race"),

    new SlashCommandBuilder()
        .setName("standingsmotogp")
        .setDescription("Shows MotoGP championship standings")
        .addStringOption((o) =>
            o.setName("type")
                .setDescription("Choose standings type")
                .setRequired(true)
                .addChoices(
                    { name: "Riders", value: "riders" },
                    { name: "Constructors", value: "constructors" }
                )
        ),

    new SlashCommandBuilder()
        .setName("standingsf1")
        .setDescription("Shows Formula 1 championship standings")
        .addStringOption((o) =>
            o.setName("type")
                .setDescription("Choose standings type")
                .setRequired(true)
                .addChoices(
                    { name: "Drivers", value: "drivers" },
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
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log("✅ Commands registered successfully!");
    } catch (error) {
        console.error(error);
    }
})();
