const { addSubscriber, removeSubscriber } = require("../services/notificationService");

module.exports = {
    name: "interactionCreate",
    async execute(interaction) {
        // Handle Chat Input Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`);
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }
        // Handle Autocomplete
        else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        }
        // Handle Buttons
        else if (interaction.isButton()) {
            // Handle Notification Buttons
            if (interaction.customId === 'notify_join') {
                const added = addSubscriber(interaction.user.id);
                if (added) {
                    await interaction.reply({ content: "✅ You have subscribed to race notifications! I'll DM you 1 hour before sessions.", ephemeral: true });
                } else {
                    await interaction.reply({ content: "⚠️ You are already subscribed.", ephemeral: true });
                }
            } else if (interaction.customId === 'notify_leave') {
                const removed = removeSubscriber(interaction.user.id);
                if (removed) {
                    await interaction.reply({ content: "🔕 You have unsubscribed from notifications.", ephemeral: true });
                } else {
                    await interaction.reply({ content: "⚠️ You are not subscribed.", ephemeral: true });
                }
            }
            // Handle other buttons (standings pagination etc)
            else {
                const commandName = interaction.customId.split(":")[0];
                const command = interaction.client.commands.get(commandName);

                if (command && command.handleButton) {
                    try {
                        await command.handleButton(interaction);
                    } catch (error) {
                        console.error(`Error handling button for ${commandName}`);
                        console.error(error);
                        await interaction.reply({ content: 'There was an error processing this button!', ephemeral: true });
                    }
                }
            }
        }
    },
};
