const { SlashCommandBuilder } = require("discord.js");
const { getNextRace: getNextF1 } = require("../services/f1Service");
const { getNextMotoGPRace } = require("../services/motogpService");
const { getNextF3Race } = require("../services/f3Service");
const { createBaseEmbed } = require("../utils/embedUtils");
const { getCircuitBanner } = require("../utils/bannerUtils");
const moment = require("moment-timezone");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("countdown")
        .setDescription("Get live countdown to the next race week with banner")
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

            // Get the first session time for countdown
            const firstSession = race.FirstPractice || race.Qualifying || { date: race.date, time: race.time };
            const firstSessionTime = moment(`${firstSession.date}T${firstSession.time}`);
            const raceTime = moment(`${race.date}T${race.time}`);
            const daysUntil = moment(race.date).diff(moment(), 'days');

            const embed = createBaseEmbed("🏁 Race Week Countdown")
                .setColor("#FF1801")
                .setDescription(`**${race.season} ${race.raceName}**\nRound ${race.round}\n\n**${race.Circuit.circuitName}**\n📍 ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`);

            // Add countdown to race week start (first session)
            const countdownToStart = `<t:${firstSessionTime.unix()}:R>`;
            const countdownToRace = `<t:${raceTime.unix()}:R>`;

            embed.addFields(
                {
                    name: "⏱️ Race Week Starts",
                    value: countdownToStart,
                    inline: true
                },
                {
                    name: "🏁 Grand Prix",
                    value: countdownToRace,
                    inline: true
                },
                {
                    name: "📅 First Session",
                    value: `<t:${firstSessionTime.unix()}:F>`,
                    inline: false
                },
                {
                    name: "🏆 Race Day",
                    value: `<t:${raceTime.unix()}:F>`,
                    inline: false
                }
            );

            // Add circuit banner if available
            const circuitId = race.Circuit?.circuitId;
            const banner = getCircuitBanner(circuitId);

            if (banner) {
                embed.setImage(`attachment://${banner.name}`);
                return interaction.editReply({ embeds: [embed], files: [banner] });
            }

            return interaction.editReply({ embeds: [embed] });

        } else if (series === "motogp") {
            const race = getNextMotoGPRace();
            if (!race) return interaction.editReply("🎉 No upcoming MotoGP races found.");

            const sortedSessions = Object.entries(race.sessions).sort(([, a], [, b]) => moment(a).diff(moment(b)));
            const firstSessionTime = moment(sortedSessions[0][1]);
            const lastSessionTime = moment(sortedSessions[sortedSessions.length - 1][1]);

            const embed = createBaseEmbed("🏁 Race Week Countdown")
                .setColor("#000000")
                .setDescription(`**2025 ${race.name}**\nRound ${race.round}`);

            const countdownToStart = `<t:${firstSessionTime.unix()}:R>`;
            const countdownToRace = `<t:${lastSessionTime.unix()}:R>`;

            embed.addFields(
                {
                    name: "⏱️ Race Week Starts",
                    value: countdownToStart,
                    inline: true
                },
                {
                    name: "🏁 Race Day",
                    value: countdownToRace,
                    inline: true
                },
                {
                    name: "📅 First Session",
                    value: `<t:${firstSessionTime.unix()}:F>`,
                    inline: false
                }
            );

            return interaction.editReply({ embeds: [embed] });

        } else {
            const race = getNextF3Race();
            if (!race) return interaction.editReply("🙅🏼‍♂️ No upcoming F3 races found.");

            const sortedSessions = Object.entries(race.sessions).sort(([, a], [, b]) => moment(a).diff(moment(b)));
            const firstSessionTime = moment(sortedSessions[0][1]);
            const lastSessionTime = moment(sortedSessions[sortedSessions.length - 1][1]);

            const embed = createBaseEmbed("🏁 Race Week Countdown")
                .setColor("#151F45")
                .setDescription(`**2025 ${race.name}**\nRound ${race.round}`);

            const countdownToStart = `<t:${firstSessionTime.unix()}:R>`;
            const countdownToRace = `<t:${lastSessionTime.unix()}:R>`;

            embed.addFields(
                {
                    name: "⏱️ Race Week Starts",
                    value: countdownToStart,
                    inline: true
                },
                {
                    name: "🏁 Race Day",
                    value: countdownToRace,
                    inline: true
                },
                {
                    name: "📅 First Session",
                    value: `<t:${firstSessionTime.unix()}:F>`,
                    inline: false
                }
            );

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
