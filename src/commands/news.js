const { SlashCommandBuilder } = require("discord.js");
const { getLatestNews } = require("../services/newsService");
const { createBaseEmbed } = require("../utils/embedUtils");
const moment = require("moment-timezone");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("news")
        .setDescription("Get the latest motorsport news")
        .addStringOption(option =>
            option.setName("series")
                .setDescription("Choose F1 or MotoGP")
                .setRequired(true)
                .addChoices(
                    { name: "Formula 1", value: "f1" },
                    { name: "MotoGP", value: "motogp" }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const series = interaction.options.getString("series");

        const newsItems = await getLatestNews(series);

        if (!newsItems || newsItems.length === 0) {
            return interaction.editReply("❌ Could not fetch news at the moment.");
        }

        const color = series === "f1" ? "#FF1801" : "#000000";
        const title = series === "f1" ? "Formula 1 News" : "MotoGP News";
        const icon = series === "f1"
            ? "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/F1.svg/1200px-F1.svg.png"
            : "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/MotoGP_Logo.svg/1200px-MotoGP_Logo.svg.png";

        const embed = createBaseEmbed(title)
            .setColor(color)
            .setThumbnail(icon);

        let description = "";
        newsItems.forEach(item => {
            // Clean up title
            const cleanTitle = item.title.trim();
            // Format time (e.g., "2 hours ago")
            const time = item.pubDate ? moment(item.pubDate).fromNow() : "";

            description += `**[${cleanTitle}](${item.link})**\n`;
            description += `\` 📰 ${item.contentSnippet ? item.contentSnippet.substring(0, 80) + "..." : "Read more..."} \`\n`;
            description += `*${time}* • ${item.creator || "Motorsport.com"}\n\n`;
        });

        embed.setDescription(description);

        await interaction.editReply({ embeds: [embed] });
    }
};
