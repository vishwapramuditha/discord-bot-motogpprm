const { SlashCommandBuilder } = require("discord.js");
const { getDriverInfo, getDriverList, getLastRacesResults, getDriverImage } = require("../services/f1Service");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("driver")
        .setDescription("Get information on the given driver")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Search for a driver")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const drivers = await getDriverList(); // Cached or fetched

        // Filter drivers
        const filtered = drivers.filter(driver =>
            driver.givenName.toLowerCase().includes(focusedValue) ||
            driver.familyName.toLowerCase().includes(focusedValue)
        );

        // Map to choices (max 25)
        await interaction.respond(
            filtered.slice(0, 25).map(driver => ({
                name: `${driver.givenName} ${driver.familyName}`,
                value: driver.driverId
            }))
        );
    },

    async execute(interaction) {
        await interaction.deferReply();
        const driverId = interaction.options.getString("name");

        const driver = await getDriverInfo(driverId);
        if (!driver) {
            return interaction.editReply("❌ Driver not found.");
        }

        // Fetch extra stats (simulated or fetched)
        const lastRaces = await getLastRacesResults(driverId);
        const imageUrl = getDriverImage(driverId);

        const embed = createBaseEmbed(`${driver.givenName} ${driver.familyName} [${driver.permanentNumber || "??"}]`)
            .setColor("#00FFFF") // Cyan like the image
            .setThumbnail(imageUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/F1.svg/1200px-F1.svg.png")
            .addFields(
                { name: "Nationality", value: `${driver.nationality}`, inline: true },
                { name: "Date of Birth", value: `${driver.dateOfBirth}`, inline: true },
                { name: "Wiki", value: `[Link](${driver.url})`, inline: true }
            );

        // Last Races Section
        if (lastRaces.length > 0) {
            let raceText = "";
            lastRaces.forEach(race => {
                const result = race.Results[0];
                const statusEmoji = result.position === "1" ? "🥇" : result.position === "2" ? "🥈" : result.position === "3" ? "🥉" : "🏁";
                raceText += `**${race.raceName}** ${race.date}\n`;
                raceText += `\` ${statusEmoji} Finished ${result.positionText} \`\n\n`;
            });
            embed.addFields({ name: "Last Races", value: raceText });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
