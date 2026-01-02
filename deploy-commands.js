require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const commands = [];
const commandsPath = path.join(__dirname, "src/commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
    }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

        let route;
        if (process.env.GUILD_ID) {
            console.log("Using Guild Registration (Instant update for this server)");
            route = Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID);
        } else {
            console.log("Using Global Registration (May take up to 1 hour to appear)");
            route = Routes.applicationCommands(process.env.CLIENT_ID);
        }

        const data = await rest.put(
            route,
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
