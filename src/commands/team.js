const { SlashCommandBuilder } = require("discord.js");
const { getTeamInfo } = require("../services/f1Service");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("team")
        .setDescription("Get information on the given team")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Team name or ID (e.g. 'ferrari' or 'red_bull')")
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const name = interaction.options.getString("name").toLowerCase().replace(/\s/g, "_");

        const team = await getTeamInfo(name);

        if (!team) {
            return interaction.editReply("❌ Team not found. Try using the team name (e.g. 'mclaren').");
        }

        const embed = createBaseEmbed(`🏎️ ${team.name}`)
            .addFields(
                { name: "Nationality", value: team.nationality, inline: true },
                { name: "Wiki", value: team.url, inline: false }
            );

        await interaction.editReply({ embeds: [embed] });
    }
};
