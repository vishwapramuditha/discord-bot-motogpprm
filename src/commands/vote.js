const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("vote")
        .setDescription("Show some love and vote for me or leave a review"),

    async execute(interaction) {
        const embed = createBaseEmbed("🗳️ Vote for Bot")
            .setDescription("If you enjoy using this bot, please consider voting for it!")
            .addFields(
                { name: "Top.gg", value: "[Vote Here](https://top.gg/)", inline: true }, // Placeholder link
                { name: "Discord Bot List", value: "[Vote Here](https://discordbotlist.com/)", inline: true } // Placeholder link
            );

        await interaction.reply({ embeds: [embed] });
    }
};
