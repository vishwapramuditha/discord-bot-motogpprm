const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");
const { addSubscriber, removeSubscriber } = require("../services/notificationService");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("notify")
        .setDescription("Manage your race notification settings"),

    async execute(interaction) {
        const embed = createBaseEmbed("🔔 Race Notifications")
            .setDescription("Never miss a race again! Subscribe to get a **Private Message** 1 hour before every Qualifying, Sprint, and Race session for both F1, F3 and MotoGP.")
            .addFields(
                { name: "How it works", value: "Click **Join** to subscribe to DM alerts.\nClick **Leave** to stop receiving alerts." }
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
    },

    // Handle Button Interactions
    async handleButton(interaction) {
        const action = interaction.customId;
        const userId = interaction.user.id;

        if (action === 'notify_join') {
            const added = addSubscriber(userId);
            if (added) {
                await interaction.reply({ content: "✅ You have subscribed to race notifications! Make sure your DMs are open.", ephemeral: true });
            } else {
                await interaction.reply({ content: "ℹ️ You are already subscribed.", ephemeral: true });
            }
        } else if (action === 'notify_leave') {
            const removed = removeSubscriber(userId);
            if (removed) {
                await interaction.reply({ content: "🔕 You have unsubscribed from race notifications.", ephemeral: true });
            } else {
                await interaction.reply({ content: "ℹ️ You were not subscribed.", ephemeral: true });
            }
        }
    }
};
