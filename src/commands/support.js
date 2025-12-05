const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("support")
        .setDescription("Support the developer"),

    async execute(interaction) {
        const embed = createBaseEmbed("☕ Support the Developer")
            .setColor("#FFD700") // Gold
            .setDescription("If you enjoy using **GridScout**, consider supporting the development! Your support helps keep the bot running and servers paid.")
            .addFields(
                { name: "Buy Me a Coffee", value: "[buymeacoffee.com/pramu.cc](https://buymeacoffee.com/pramu.cc)", inline: true },
                { name: "Website", value: "[vishwapramuditha.com](https://vishwapramuditha.com)", inline: true }
            )
            .setImage("https://media.giphy.com/media/3oKIPa2TdahY8LAAgw/giphy.gif"); // Fun money gif or similar

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
