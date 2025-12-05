const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Get help and information about the commands"),

    async execute(interaction) {
        const embed = createBaseEmbed("📚 Bot Commands")
            .addFields(
                { name: "🏎️ Information", value: "`/standings` - Driver/Constructor standings\n`/driver` - Driver info\n`/team` - Team info" },
                { name: "📅 Schedule", value: "`/next` - Next race info\n`/calendar` - Season calendar" },
                { name: "🎲 Fun", value: "`/trivia` - Test your F1 knowledge\n`/quote` - Random F1 quote" },
                { name: "ℹ️ Other", value: "`/support` - Support the developer\n`/help` - Show this message" }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
