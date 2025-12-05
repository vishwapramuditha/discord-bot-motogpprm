const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("notify")
        .setDescription("Manage your race notification settings"),

    async execute(interaction) {
        const embed = createBaseEmbed("🔔 Race Notifications")
            .setDescription("Never miss a race again! Subscribe to get a **Private Message** 1 hour before every Qualifying, Sprint, and Race session for both F1 and MotoGP.")
            .addFields(
                { name: "How it works", value: "Click **Join** to subscribe. Click **Leave** to unsubscribe." }
            );

        const joinButton = new ButtonBuilder()
            .setCustomId('notify_join')
            .setLabel('Join Notifications')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📩');

        const leaveButton = new ButtonBuilder()
            .setCustomId('notify_leave')
            .setLabel('Leave Notifications')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔕');

        const row = new ActionRowBuilder()
            .addComponents(joinButton, leaveButton);

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
