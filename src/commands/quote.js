const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");

const quotes = [
    // F1 Legends
    "If you no longer go for a gap that exists, you are no longer a racing driver. - Ayrton Senna",
    "I was having a shit. - Kimi Räikkönen",
    "To finish first, you must first finish. - Juan Manuel Fangio",
    "Leave me alone, I know what I'm doing. - Kimi Räikkönen",
    "Bwoah. - Kimi Räikkönen",
    "Simply lovely. - Max Verstappen",
    "Smooth operator. - Carlos Sainz",
    "It's lights out and away we go! - David Croft",
    "My tires are gone, Bono! - Lewis Hamilton",
    "GP2 Engine! GP2 Engine! - Fernando Alonso",
    "No Mikey, no no Mikey! That was so not right! - Toto Wolff",
    "First time? - James Franco (Meme, but relevant to penalties)",
    "I am stupid. I am stupid. - Charles Leclerc",
    "Always you have to leave the space! - Fernando Alonso",
    "Multi 21, Seb. Multi 21. - Mark Webber",
    "Valtteri, it's James. - James Vowles",
    "Gentlemen, a short view back to the past... - Walter Koster",
    "Cash is King. - Lewis Hamilton",
    "Not bad for a number 2 driver. - Mark Webber",
    "Keep pushing! - Various",

    // MotoGP
    "I prefer to lose a race than to finish second. - Valentino Rossi",
    "When I look at the TV, I realize that I am spoiling the races. - Casey Stoner",
    "You have to be a bastard to be a World Champion. - Barry Sheene",
    "Pushing the limit involves the risk of falling. - Marc Marquez",
    "Your ambition outweighed your talent. - Casey Stoner to Valentino Rossi"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("quote")
        .setDescription("Get a random motorsport quote from history"),

    async execute(interaction) {
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        // Split if possible
        const parts = quote.split(" - ");
        const text = parts[0];
        const author = parts.length > 1 ? parts[1] : "Unknown";

        const embed = createBaseEmbed("💬 Motorsport Quote")
            .setDescription(`*"${text}"*`)
            .setFooter({ text: `- ${author}` })
            .setColor("#FFD700");

        await interaction.reply({ embeds: [embed] });
    }
};
