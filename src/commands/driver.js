const { SlashCommandBuilder } = require("discord.js");
const { getDriverInfo, getDriverList, getLastRacesResults, getDriverImage } = require("../services/f1Service");
const { getMotoGPStandings } = require("../services/motogpService");
const { getF3Standings } = require("../services/f3Service");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("driver")
        .setDescription("Get information on a driver or rider")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Search for a driver/rider (F1, MotoGP, F3)")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();

        // 1. F1 Drivers
        const f1Drivers = await getDriverList();
        const f1Mapped = f1Drivers.map(d => ({
            name: `🏁 F1: ${d.givenName} ${d.familyName}`,
            value: d.driverId
        }));

        // 2. MotoGP Riders
        const motoRiders = getMotoGPStandings('riders') || [];
        const motoMapped = motoRiders.map(r => ({
            name: `🏍️ MotoGP: ${r.name}`,
            value: `motogp_${r.name}`
        }));

        // 3. F3 Drivers
        const f3Drivers = getF3Standings('drivers') || [];
        const f3Mapped = f3Drivers.map(d => ({
            name: `🏎️ F3: ${d.name}`,
            value: `f3_${d.name}`
        }));

        const all = [...f1Mapped, ...motoMapped, ...f3Mapped];
        const filtered = all.filter(choice => choice.name.toLowerCase().includes(focusedValue));

        await interaction.respond(filtered.slice(0, 25));
    },

    async execute(interaction) {
        await interaction.deferReply();
        const driverId = interaction.options.getString("name");

        // MotoGP Handler
        if (driverId.startsWith("motogp_")) {
            const name = driverId.replace("motogp_", "");
            const rider = getMotoGPStandings('riders').find(r => r.name === name);

            if (!rider) return interaction.editReply("❌ Rider not found.");

            const embed = createBaseEmbed(`${rider.name}`)
                .setColor("#000000") // MotoGP Black
                .addFields(
                    { name: "Team", value: rider.team || "Unknown", inline: true },
                    { name: "Current Points", value: `${rider.points}`, inline: true },
                    { name: "Rank", value: `${rider.rank}`, inline: true },
                    { name: "Series", value: "MotoGP", inline: true }
                );

            // Add image if known (manual list or generic)
            // For now generic
            embed.setThumbnail("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/MotoGP_Logo.svg/1200px-MotoGP_Logo.svg.png");

            return interaction.editReply({ embeds: [embed] });

            // F3 Handler
        } else if (driverId.startsWith("f3_")) {
            const name = driverId.replace("f3_", "");
            const driver = getF3Standings('drivers').find(d => d.name === name);

            if (!driver) return interaction.editReply("❌ Driver not found.");

            const embed = createBaseEmbed(`${driver.name}`)
                .setColor("#151F45") // F3 Navy
                .addFields(
                    { name: "Team", value: driver.team || "Unknown", inline: true },
                    { name: "Current Points", value: `${driver.points}`, inline: true },
                    { name: "Rank", value: `${driver.rank}`, inline: true },
                    { name: "Series", value: "Formula 3", inline: true }
                );

            embed.setThumbnail("https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/FIA_F3_Championship_logo.svg/1200px-FIA_F3_Championship_logo.svg.png");

            return interaction.editReply({ embeds: [embed] });

            // F1 Handler
        } else {
            const driver = await getDriverInfo(driverId);
            if (!driver) {
                return interaction.editReply("❌ Driver not found.");
            }

            const lastRaces = await getLastRacesResults(driverId);
            const imageUrl = getDriverImage(driverId);

            const embed = createBaseEmbed(`${driver.givenName} ${driver.familyName} [${driver.permanentNumber || "??"}]`)
                .setColor("#FF1801") // F1 Red
                .setThumbnail(imageUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/F1.svg/1200px-F1.svg.png")
                .addFields(
                    { name: "Nationality", value: `${driver.nationality}`, inline: true },
                    { name: "Date of Birth", value: `${driver.dateOfBirth}`, inline: true },
                    { name: "Wiki", value: `[Link](${driver.url})`, inline: true }
                );

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
    }
};
