const { SlashCommandBuilder } = require("discord.js");
const { getNextRace: getNextF1 } = require("../services/f1Service");
const { getNextMotoGPRace } = require("../services/motogpService");
const { createBaseEmbed } = require("../utils/embedUtils");
const moment = require("moment-timezone");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("next")
        .setDescription("Get when and where the next Grand Prix takes place")
        .addStringOption(option =>
            option.setName("series")
                .setDescription("Choose F1 or MotoGP")
                .setRequired(true)
                .addChoices(
                    { name: "Formula 1", value: "f1" },
                    { name: "MotoGP", value: "motogp" }
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

            let sessionText = "```text\n";
            for (const [name, session] of Object.entries(sessions)) {
                if (session) {
                    const dateTimeStr = `${session.date}T${session.time}`;
                    const time = moment(dateTimeStr);
                    // Format: "Free Practice 1: December 5, 2025 3:00 PM"
                    // We use padding to align
                    const timeStr = time.format("MMMM D, YYYY h:mm A");
                    sessionText += `${name.padEnd(16)}: ${timeStr}\n`;
                }
            }
            sessionText += "```";

            embed.addFields({ name: "Sessions", value: sessionText });

            return interaction.editReply({ embeds: [embed] });

        } else {
            // MotoGP
            const race = getNextMotoGPRace();
            if (!race) return interaction.editReply("🎉 No upcoming MotoGP races found.");

            const embed = createBaseEmbed("Race Schedule")
                .setColor("#000000")
                .setDescription(`**2025 Season**\n\n**${race.name}**\nRound ${race.round}`);

            let sessionText = "```text\n";
            const sortedSessions = Object.entries(race.sessions).sort(([, a], [, b]) => moment(a).diff(moment(b)));

            for (const [name, timeStr] of sortedSessions) {
                const time = moment(timeStr);
                const formatted = time.format("MMMM D, YYYY h:mm A");
                sessionText += `${name.padEnd(16)}: ${formatted}\n`;
            }
            sessionText += "```";

            embed.addFields({ name: "Sessions", value: sessionText });

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
