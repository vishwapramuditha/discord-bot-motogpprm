const { EmbedBuilder } = require("discord.js");
const config = require("../config");

function createBaseEmbed(title) {
    return new EmbedBuilder()
        .setTitle(title)
        .setColor(config.colors.primary)
        .setFooter({ text: config.footer.text })
        .setTimestamp();
}

module.exports = {
    createBaseEmbed
};
