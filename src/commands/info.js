const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");
const config = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("info")
        .setDescription("View bot statistics and latency"),

    async execute(interaction) {
        const client = interaction.client;
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;

        // Calculate Ping
        const sent = await interaction.deferReply({ fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);

        const embed = createBaseEmbed("🤖 System Status")
            .setColor("#00FF00")
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: "📶 Latency", value: `**Bot**: ${latency}ms\n**API**: ${apiLatency}ms`, inline: true },
                { name: "⏱️ Uptime", value: `${days}d ${hours}h ${minutes}m`, inline: true },
                { name: "📊 Usage", value: `**${client.guilds.cache.size}** Servers\n**${client.users.cache.size}** Users`, inline: true },
                { name: "📚 Library", value: "Discord.js v14", inline: true },
                { name: "💻 Environment", value: "Node.js", inline: true },
                { name: "👨‍💻 Developer", value: "[Vishwapramuditha](https://vishwapramuditha.com)", inline: true }
            );

        await interaction.editReply({ embeds: [embed] });
    }
};
