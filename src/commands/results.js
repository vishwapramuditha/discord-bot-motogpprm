const { SlashCommandBuilder } = require("discord.js");
const { getRaceResult } = require("../services/f1Service");
const { getF3RaceResult } = require("../services/f3Service");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("results")
        .setDescription("Get race results")
        .addStringOption(option =>
            option.setName("series")
                .setDescription("Choose F1, MotoGP, or F3")
                .setRequired(true)
                .addChoices(
                    { name: "Formula 1", value: "f1" },
                    { name: "MotoGP", value: "motogp" },
                    { name: "Formula 3", value: "f3" }
                )
        )
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
        const series = interaction.options.getString("series");
        const year = interaction.options.getInteger("year");
        const round = interaction.options.getInteger("round");

        if (series === "f1") {
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
        } else if (series === "f3") {
            // F3 Manual Result Handler
            const resultData = getF3RaceResult(round);

            if (!resultData) {
                return interaction.editReply(`❌ F3 results for Round ${round} (${year}) are not not yet available.`);
            }

            const embed = createBaseEmbed("Race Results")
                .setColor("#151F45")
                .setDescription(`**${year} F3 Round ${round} — Feature Race**`);

            let resultsText = "";
            // Expecting data.results[round] to be an array of objects: { position, name, team, time, points }
            if (Array.isArray(resultData)) {
                resultData.slice(0, 20).forEach(res => {
                    const pos = res.position.toString().padEnd(2);
                    const name = res.name;
                    const timeOrStatus = res.time || "";
                    const points = res.points ? `(${res.points} pts)` : "";

                    resultsText += `**${pos}** ${name} — ${timeOrStatus} ${points}\n`;
                });
            } else {
                resultsText = "No detailed results data available.";
            }

            embed.setDescription(embed.data.description + "\n\n" + resultsText);
            return interaction.editReply({ embeds: [embed] });

        } else {
            return interaction.editReply(`❌ Results for ${series.toUpperCase()} are not yet available.`);
        }
    }
};
