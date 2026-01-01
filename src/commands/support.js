const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("support")
        .setDescription("Support the developer"),

    async execute(interaction) {
        const embed = createBaseEmbed("☕ Support the Developer")
            .setColor("#FFD700") // Gold
            .setDescription("If you enjoy using **MotoGP-PRM**, consider supporting the development! Your support helps keep the bot running and servers paid.")
            .addFields(
                { name: "Buy Me a Coffee", value: "[buymeacoffee.com/pramu.cc](https://buymeacoffee.com/pramu.cc)", inline: true },
                { name: "Website", value: "[vishwapramuditha.com](https://vishwapramuditha.com)", inline: true }
            )
            .setImage("https://github.com/vishwapramuditha/discord-bot-motogpprm/blob/main/src/assets/banners/banner%20(1).png?raw=true");

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
