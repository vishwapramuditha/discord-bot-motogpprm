const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");

const quotes = [
    "If you no longer go for a gap that exists, you are no longer a racing driver. - Ayrton Senna",
    "I was having a shit. - Kimi Räikkönen",
    "To finish first, you must first finish. - Juan Manuel Fangio",
    "Leave me alone, I know what I'm doing. - Kimi Räikkönen",
    "Bwoah. - Kimi Räikkönen",
    "Simply lovely. - Max Verstappen",
    "Smooth operator. - Carlos Sainz"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("quote")
        .setDescription("Get a random Formula 1 quote"),

    async execute(interaction) {
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        const embed = createBaseEmbed("💬 F1 Quote")
            .setDescription(`*"${quote}"*`);

        await interaction.reply({ embeds: [embed] });
    }
};
