const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");

// A small collection of F1 GIFs since we don't have a GIPHY API key set up
const f1Gifs = [
    "https://media.giphy.com/media/5nvGD8qzBOESH6OioE/giphy.gif", // Fernando Alonso wink/wave
    "https://media.giphy.com/media/ehTz6odmTnLhSifWml/giphy.gif", // Charles Leclerc angry/fuming 
    "https://media.giphy.com/media/UpExHeypPdNXcNwCSD/giphy.gif", // Max Verstappen celebrating a win
    "https://media.giphy.com/media/RhEgeElqJM0W2GJTid/giphy.gif", // Max and Charles "Inchident" 
    "https://media.giphy.com/media/9Rvy1KBQTdOntdm5W7/giphy.gif", // Carlos Sainz smooth operator "Yes"
    "https://media.giphy.com/media/XBFjTfvDpBn78EEgGM/giphy.gif"  // Charles Leclerc looking lovingly
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gif")
        .setDescription("Get a random Formula 1 GIF"),

    async execute(interaction) {
        const gif = f1Gifs[Math.floor(Math.random() * f1Gifs.length)];
        await interaction.reply(gif);
    }
};
