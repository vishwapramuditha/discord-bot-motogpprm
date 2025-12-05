const { SlashCommandBuilder } = require("discord.js");
const { getRaceResult } = require("../services/f1Service");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("results")
        .setDescription("Get race results")
        .addIntegerOption(option =>
            option.setName("year")
                .setDescription("Year (e.g. 2024)")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("round")
                .setDescription("Round number")
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const year = interaction.options.getInteger("year");
        const round = interaction.options.getInteger("round");

        const race = await getRaceResult(year, round);

        if (!race) {
            return interaction.editReply("❌ Results not found.");
        }

        const embed = createBaseEmbed("Race Results")
            .setColor("#FF1801")
            .setDescription(`**${year} ${race.raceName} — Grand Prix**`);

        let resultsText = "";
        race.Results.slice(0, 20).forEach(res => {
            const pos = res.position.padEnd(2);
            const name = `${res.Driver.givenName} ${res.Driver.familyName}`;
            const timeOrStatus = res.Time ? res.Time.time : res.status;
            const points = res.points > 0 ? `(${res.points} pts)` : "";

            // Bold name, normal text for others
            resultsText += `**${pos}** ${name} — ${timeOrStatus} ${points}\n`;
        });

        embed.setDescription(embed.data.description + "\n\n" + resultsText);

        await interaction.editReply({ embeds: [embed] });
    }
};
