const { SlashCommandBuilder } = require("discord.js");
const { getCalendar: getF1Calendar } = require("../services/f1Service");
const { getMotoGPCalendar } = require("../services/motogpService");
const { getF3Calendar } = require("../services/f3Service");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("calendar")
        .setDescription("Get the race calendar")
        .addStringOption(option =>
            option.setName("series")
                .setDescription("Choose F1 or MotoGP")
                .setRequired(true)
                .addChoices(
                    { name: "Formula 1", value: "f1" },
                    { name: "MotoGP", value: "motogp" },
                    { name: "Formula 3", value: "f3" }
                )
        )
        .addStringOption(option =>
            option.setName("year")
                .setDescription("Year (optional, default current)")
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const series = interaction.options.getString("series");
        const year = interaction.options.getString("year") || "current";

        if (series === "f1") {
            const races = await getF1Calendar(year);
            if (!races || races.length === 0) return interaction.editReply("❌ Could not fetch F1 calendar.");

            const embed = createBaseEmbed(`📅 F1 Calendar ${year}`)
                .setColor("#FF1801");

            let description = "";
            races.forEach(race => {
                // Mimic the list style: "1 🇧🇭 Bahrain Grand Prix — March 2, 2024"
                // We don't have easy flag emojis in API, but we can try to map or just use text.
                // For simplicity, we'll use the Round number.
                description += `**${race.round}** • ${race.raceName} — ${race.date}\n`;
            });

            // Discord description limit is 4096 chars, calendar fits easily.
            embed.setDescription(description);

            return interaction.editReply({ embeds: [embed] });

        } else if (series === "motogp") {
            // MotoGP
            const races = getMotoGPCalendar();
            if (!races || races.length === 0) return interaction.editReply("❌ No MotoGP calendar data available.");

            const embed = createBaseEmbed(`📅 MotoGP Calendar 2025`)
                .setColor("#000000");

            let description = "";
            races.forEach(race => {
                // Use the country flag from our data
                description += `**${race.round}** ${race.country} ${race.name} — ${race.date}\n`;
            });

            embed.setDescription(description);

            return interaction.editReply({ embeds: [embed] });
        } else {
            // F3 series
            const races = getF3Calendar();
            if (!races || races.length === 0) return interaction.editReply("❌ No F3 calendar data available.");

            const embed = createBaseEmbed(`📅 F3 Calendar 2025`)
                .setColor("#151F45");

            let description = "";
            races.forEach(race => {
                // Use the country flag from our data
                description += `**${race.round}** ${race.country} ${race.name} — ${race.date}\n`;
            });

            embed.setDescription(description);

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
