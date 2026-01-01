const { SlashCommandBuilder } = require("discord.js");
const { getDriverInfo, getDriverList } = require("../services/f1Service");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("compare")
        .setDescription("Compare two F1 drivers head-to-head")
        .addStringOption(option =>
            option.setName("driver1")
                .setDescription("First driver")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName("driver2")
                .setDescription("Second driver")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const drivers = await getDriverList();

        const filtered = drivers.filter(driver =>
            driver.givenName.toLowerCase().includes(focusedValue) ||
            driver.familyName.toLowerCase().includes(focusedValue)
        );

        await interaction.respond(
            filtered.slice(0, 25).map(driver => ({
                name: `${driver.givenName} ${driver.familyName}`,
                value: driver.driverId
            }))
        );
    },

    async execute(interaction) {
        await interaction.deferReply();
        const id1 = interaction.options.getString("driver1");
        const id2 = interaction.options.getString("driver2");

        const [d1, d2] = await Promise.all([
            getDriverInfo(id1),
            getDriverInfo(id2)
        ]);

        if (!d1 || !d2) {
            return interaction.editReply("❌ One or both drivers could not be found.");
        }

        const embed = createBaseEmbed("🏎️ Driver Comparison")
            .setColor("#FFD700")
            .setDescription(`**${d1.givenName} ${d1.familyName}** vs **${d2.givenName} ${d2.familyName}**`);

        // We assume getDriverInfo provides basic bio.
        // For real stats (wins, poles), we ideally need a 'getDriverStats' function in service.
        // Since we don't have that easily without creating it, we'll compare static info + simulate/placeholder for now
        // or fetch from Wikipedia URL if we were scraping, but we are not.
        // Let's just show Bio info.

        const formatField = (label, val1, val2) => {
            return `**${label}**\n${val1} \`vs\` ${val2}\n`;
        }

        embed.addFields(
            { name: "Nationality", value: `${d1.nationality} vs ${d2.nationality}`, inline: true },
            { name: "Number", value: `${d1.permanentNumber} vs ${d2.permanentNumber}`, inline: true },
            { name: "Date of Birth", value: `${d1.dateOfBirth} vs ${d2.dateOfBirth}`, inline: true },
            { name: "Information", value: `[Wiki 1](${d1.url}) vs [Wiki 2](${d2.url})`, inline: false }
        );

        await interaction.editReply({ embeds: [embed] });
    }
};
