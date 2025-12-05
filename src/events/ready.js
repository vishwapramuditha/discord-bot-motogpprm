const { startScheduler } = require("../services/notificationService");

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        console.log(`✅ Logged in as ${client.user.tag}`);
        console.log(`🚀 Bot is ready! Serving ${client.guilds.cache.size} servers.`);

        client.user.setActivity("GridIQ | 2026");

        // Start Notification Scheduler
        startScheduler(client);
    },
};
