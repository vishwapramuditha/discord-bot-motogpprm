const { SlashCommandBuilder } = require("discord.js");
const { getNextRace: getNextF1 } = require("../services/f1Service");
const { getNextMotoGPRace } = require("../services/motogpService");
const { getNextF3Race } = require("../services/f3Service");
const { createBaseEmbed } = require("../utils/embedUtils");
const moment = require("moment-timezone");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("next")
        .setDescription("Get when and where the next Grand Prix takes place")
        .addStringOption(option =>
            option.setName("series")
                .setDescription("Choose F1, MotoGP or F3")
                .setRequired(true)
                .addChoices(
                    { name: "Formula 1", value: "f1" },
                    { name: "MotoGP", value: "motogp" },
                    { name: "Formula 3", value: "f3" }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const series = interaction.options.getString("series");

        if (series === "f1") {
            const race = await getNextF1();
            if (!race) return interaction.editReply("❌ Could not fetch next F1 race info.");

            const embed = createBaseEmbed("Race Schedule")
                .setColor("#FF1801")
                .setDescription(`**${race.season} Season**\n\n**${race.raceName}** (in ${moment(race.date).diff(moment(), 'days')} days)\nRound ${race.round}`);

            const sessions = {
                "Free Practice 1": race.FirstPractice,
                "Free Practice 2": race.SecondPractice,
                "Free Practice 3": race.ThirdPractice,
                "Qualifying": race.Qualifying,
                "Sprint": race.Sprint,
                "Grand Prix": { date: race.date, time: race.time }
            };

            let sessionText = "";
            for (const [name, session] of Object.entries(sessions)) {
                if (session) {
                    const dateTimeStr = `${session.date}T${session.time}`;
                    const time = moment(dateTimeStr);
                    // Use Discord timestamp for automatic timezone conversion
                    const timestamp = `<t:${time.unix()}:F>`;
                    sessionText += `**${name}**: ${timestamp}\n`;
                }
            }

            embed.addFields({ name: "Sessions", value: sessionText || "No session data available" });

            return interaction.editReply({ embeds: [embed] });

        } else if (series === "motogp") {
            // MotoGP
            const race = getNextMotoGPRace();
            if (!race) return interaction.editReply("🎉 No upcoming MotoGP races found.");

            const embed = createBaseEmbed("Race Schedule")
                .setColor("#000000")
                .setDescription(`**2025 Season**\n\n**${race.name}**\nRound ${race.round}`);

            let sessionText = "";
            const sortedSessions = Object.entries(race.sessions).sort(([, a], [, b]) => moment(a).diff(moment(b)));

            for (const [name, timeStr] of sortedSessions) {
                const time = moment(timeStr);
                // Use Discord timestamp for automatic timezone conversion
                const timestamp = `<t:${time.unix()}:F>`;
                sessionText += `**${name}**: ${timestamp}\n`;
            }

            embed.addFields({ name: "Sessions", value: sessionText || "No session data available" });

            return interaction.editReply({ embeds: [embed] });
        } else {
            // F3
            const race = getNextF3Race();
            if (!race) return interaction.editReply("🎉 No upcoming F3 races found.");

            const embed = createBaseEmbed("Race Schedule")
                .setColor("#151F45") // F3 Blue-ish
                .setDescription(`**2025 Season**\n\n**${race.name}**\nRound ${race.round}`);

            let sessionText = "";
            const sortedSessions = Object.entries(race.sessions).sort(([, a], [, b]) => moment(a).diff(moment(b)));

            for (const [name, timeStr] of sortedSessions) {
                const time = moment(timeStr);
                // Use Discord timestamp for automatic timezone conversion
                // Check if time is midnight (00:00:00) - if so, use date-only format
                let timestamp;
                if (timeStr.includes("00:00:00")) {
                    timestamp = `<t:${time.unix()}:D>`; // Date only format
                } else {
                    timestamp = `<t:${time.unix()}:F>`; // Full date and time
                }
                sessionText += `**${name}**: ${timestamp}\n`;
            }

            embed.addFields({ name: "Sessions", value: sessionText || "No session data available" });

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
