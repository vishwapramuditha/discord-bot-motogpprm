const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("View all available commands and features"),

    async execute(interaction) {
        const embed = createBaseEmbed("📚 Bot Command Center")
            .setDescription("Welcome to your ultimate motorsport companion! Here's everything I can do:")
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                {
                    name: "🏁 Race Day Essentials",
                    value: [
                        "`/next` - Upcoming race sessions",
                        "`/countdown` - Live countdown to the race week",
                        "`/weather` - Track forecast for the race weekend",
                        "`/notify` - Manage DM alerts for sessions"
                    ].join("\n"),
                    inline: false
                },
                {
                    name: "🏎️ The Grid",
                    value: [
                        "`/standings` - Driver/Constructor championships",
                        "`/driver` - Profiles for F1, MotoGP, & F3",
                        "`/team` - Team details & statistics",
                        "`/compare` - Compare two drivers head-to-head"
                    ].join("\n"),
                    inline: false
                },
                {
                    name: "📅 The Season",
                    value: [
                        "`/calendar` - Full 2026 Season Schedule",
                        "`/results` - Historical race results",
                        "`/circuit` - Track naps & details"
                    ].join("\n"),
                    inline: false
                },
                {
                    name: "📰 Media & Fun",
                    value: [
                        "`/news` - Latest headlines from Motorsport.com",
                        "`/trivia` - Test your knowledge!",
                        "`/quote` - Legendary motorsport quotes"
                    ].join("\n"),
                    inline: false
                },
                {
                    name: "🛠️ Tools & Info",
                    value: [
                        "`/convert` - Timezone converter",
                        "`/info` - Bot statistics & latency",
                        "`/vote` - Support the project",
                        "`/support` - Developer links"
                    ].join("\n"),
                    inline: false
                }
            )
            .setFooter({ text: "Use /command to start • GridIQ 2026" });

        await interaction.reply({ embeds: [embed] });
    }
};
