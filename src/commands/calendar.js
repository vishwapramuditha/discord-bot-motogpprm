const { SlashCommandBuilder } = require("discord.js");
const { getCalendar: getF1Calendar } = require("../services/f1Service");
const { getMotoGPCalendar } = require("../services/motogpService");
const { getF3Calendar } = require("../services/f3Service");
const { createBaseEmbed } = require("../utils/embedUtils");
const { getFlag } = require("../utils/countryFlags");
const moment = require("moment-timezone");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("calendar")
        .setDescription("Get the race calendar")
        .addStringOption(option =>
            option.setName("series")
                .setDescription("Choose F1 or MotoGP")
                .setRequired(true)
                .addChoices(
                    { name: "Formula 1", value: "f1" },
                    { name: "MotoGP", value: "motogp" },
                    { name: "Formula 3", value: "f3" }
                )
        )
        .addStringOption(option =>
            option.setName("year")
                .setDescription("Year (optional, default current)")
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const series = interaction.options.getString("series");
        const year = interaction.options.getString("year") || "current";
        const displayYear = year === "current" ? new Date().getFullYear() : year;

        let races = [];
        let calendarTitle = "";
        let color = "";

        if (series === "f1") {
            races = await getF1Calendar(year);
            calendarTitle = `Race Calendar\n\n${displayYear} Season`;
            color = "#FF1801";
        } else if (series === "motogp") {
            races = getMotoGPCalendar();
            calendarTitle = `Race Calendar\n\n${displayYear} Season`;
            color = "#000000";
        } else {
            // F3
            races = getF3Calendar();
            calendarTitle = `F3 Calendar\n\n${displayYear} Season`;
            color = "#151F45";
        }

        if (!races || races.length === 0) {
            return interaction.editReply(`❌ Could not fetch ${series.toUpperCase()} calendar.`);
        }

        const embed = createBaseEmbed(calendarTitle)
            .setColor(color);

        // Find next race to show details for
        const now = moment();
        let nextRace = null;
        let description = "";

        races.forEach(race => {
            // Determine date and time
            // F1: race.date (YYYY-MM-DD), race.time (HH:mm:ssZ)
            // MotoGP: race.date could be string or object? motogp-data.json usually has full ISO strings in sessions.Race or similar.
            // Let's normalize.

            let raceTimeMoment;
            let raceName = race.raceName || race.name;
            let countryName = "";
            let round = race.round;

            if (series === "f1") {
                // F1 structure
                const dateTimeStr = `${race.date}T${race.time || "00:00:00Z"}`;
                raceTimeMoment = moment(dateTimeStr);
                countryName = race.Circuit.Location.Country;
            } else if (series === "motogp") {
                // MotoGP structure from service seems to have 'date' as display string or we look at sessions
                // The service getMotoGPCalendar returns data.races
                // Look at motogpService.js snippet: "race.sessions.Race"
                if (race.sessions && race.sessions.Race) {
                    raceTimeMoment = moment(race.sessions.Race);
                } else {
                    raceTimeMoment = moment(race.date); // Fallback
                }
                countryName = race.country; // Assuming 'country' property exists based on previous reading
            } else {
                // F3
                // Assuming similar to F1 or simple structure
                const dateTimeStr = `${race.date}T${race.time || "00:00:00Z"}`;
                raceTimeMoment = moment(dateTimeStr); // Simplified
                countryName = race.country;
            }

            const flag = getFlag(countryName);
            // Format: 1 🇧🇭 **Bahrain Grand Prix** — <t:X:f>
            // Note: screenshot uses "March 16, 2025 9:30 AM" style text. 
            // The prompt asks for "this style", but usually Discord bots use timestamps.
            // The User Plan said: "I will use Discord timestamps <t:unix:f> ... as that guarantees 'shown in your local timezone' is true"
            // So we stick to <t:X:f>.

            const timestamp = `<t:${raceTimeMoment.unix()}:f>`;
            description += `**${round}** ${flag} **${raceName}** — ${timestamp}\n`;

            // Check if this is the next race
            if (!nextRace && raceTimeMoment.isAfter(now)) {
                nextRace = race;
            }
        });

        // Add sessions for the next upcoming race
        if (nextRace) {
            let sessionText = "";

            // Helper to add session line
            const addSession = (name, timeMoment) => {
                if (timeMoment && timeMoment.isValid()) {
                    sessionText += `${name}: <t:${timeMoment.unix()}:f>\n`;
                }
            };

            if (series === "f1") {
                // F1 Sessions (FirstPractice, SecondPractice, ThirdPractice, Qualifying, Sprint)
                // They are properties of nextRace
                if (nextRace.FirstPractice) addSession("Free Practice 1", moment(`${nextRace.FirstPractice.date}T${nextRace.FirstPractice.time}`));
                if (nextRace.SecondPractice) addSession("Free Practice 2", moment(`${nextRace.SecondPractice.date}T${nextRace.SecondPractice.time}`));
                if (nextRace.ThirdPractice) addSession("Free Practice 3", moment(`${nextRace.ThirdPractice.date}T${nextRace.ThirdPractice.time}`));
                if (nextRace.Sprint) addSession("Sprint", moment(`${nextRace.Sprint.date}T${nextRace.Sprint.time}`));
                if (nextRace.Qualifying) addSession("Qualifying", moment(`${nextRace.Qualifying.date}T${nextRace.Qualifying.time}`));

            } else if (series === "motogp") {
                // MotoGP Sessions from sessions object
                // keys might be "FP1", "FP2", "PR", "Q1", "Q2", "Sprint", "Race"
                const s = nextRace.sessions;
                if (s) {
                    // Map common keys to display names
                    if (s.FP1) addSession("Free Practice 1", moment(s.FP1));
                    if (s.FP2) addSession("Free Practice 2", moment(s.FP2));
                    if (s.PR) addSession("Practice", moment(s.PR));
                    if (s.P1) addSession("Practice 1", moment(s.P1)); // older format?
                    if (s.P2) addSession("Practice 2", moment(s.P2));
                    if (s.Q1) addSession("Qualifying 1", moment(s.Q1));
                    if (s.Q2) addSession("Qualifying 2", moment(s.Q2));
                    if (s.SPR) addSession("Sprint", moment(s.SPR));
                }
            }

            if (sessionText) {
                description += `\n>>> ${sessionText}`;
            }
        }

        description += "\n⏰ **All dates above are shown in your local timezone**";

        embed.setDescription(description);

        return interaction.editReply({ embeds: [embed] });
    }
};
