const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");

// A small collection of F1 GIFs since we don't have a GIPHY API key set up
const f1Gifs = [
    "https://media.giphy.com/media/3o7qDLkrKr034Z3hQI/giphy.gif", // Ricciardo shoey
    "https://media.giphy.com/media/duzpaTbCUy9Vu/giphy.gif", // Kimi steering wheel
    "https://media.giphy.com/media/fxO8q5g7Md0w5W0Q5Z/giphy.gif", // Toto Wolff smashing headphones
    "https://media.giphy.com/media/J1G7rIvoyzTcNpXphr/giphy.gif", // Lando Norris laughing
    "https://media.giphy.com/media/Up1g60KxK8weS6d492/giphy.gif", // Vettel finger
    "https://media.giphy.com/media/hT4z5t8rUXrsg9o8eH/giphy.gif" // Hamilton crowd surf
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
