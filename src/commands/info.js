const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");
const config = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("info")
        .setDescription("Info and statistics about the bot"),

    async execute(interaction) {
        const client = interaction.client;
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;

        const embed = createBaseEmbed("🤖 Bot Information")
            .addFields(
                { name: "Servers", value: `${client.guilds.cache.size}`, inline: true },
                { name: "Users", value: `${client.users.cache.size}`, inline: true },
                { name: "Uptime", value: `${days}d ${hours}h ${minutes}m`, inline: true },
                { name: "Library", value: "Discord.js v14", inline: true },
                { name: "Developer", value: "Vishwapramuditha", inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
