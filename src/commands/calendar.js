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
        .setDescription("View the full race calendar for the season")
        .addStringOption(option =>
            option.setName("series")
                .setDescription("Choose F1, MotoGP, or F3")
                .setRequired(true)
                .addChoices(
                    { name: "Formula 1", value: "f1" },
                    { name: "MotoGP", value: "motogp" },
                    { name: "Formula 3", value: "f3" }
                )
        )
        .addStringOption(option =>
            option.setName("year")
                .setDescription("Year (optional, default 2026)")
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const series = interaction.options.getString("series");

        // Default to local 2026 data preference
        // F1 service handles parsing 'current' or '2026', but let's be explicit
        const yearInput = interaction.options.getString("year");
        const year = yearInput || "2026";

        // Visuals
        let races = [];
        let title = "";
        let color = "";
        let thumbnail = "";

        if (series === "f1") {
            races = await getF1Calendar(year);
            title = `🏎️ Formula 1 Calendar (${year})`;
            color = "#FF1801";
            thumbnail = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/F1.svg/1200px-F1.svg.png";
        } else if (series === "motogp") {
            races = getMotoGPCalendar();
            title = `🏍️ MotoGP Calendar (${year})`;
            color = "#000000";
            thumbnail = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/MotoGP_Logo.svg/1200px-MotoGP_Logo.svg.png";
        } else {
            races = getF3Calendar();
            title = `🏎️ Formula 3 Calendar (${year})`;
            color = "#151F45";
            thumbnail = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/FIA_F3_Championship_logo.svg/1200px-FIA_F3_Championship_logo.svg.png";
        }

        if (!races || races.length === 0) {
            return interaction.editReply(`❌ Could not fetch ${series.toUpperCase()} calendar for ${year}.`);
        }

        const embed = createBaseEmbed(title)
            .setColor(color)
            .setThumbnail(thumbnail);

        // Process races
        // We want a clean list. If it exceeds 4096 chars, we might need multiple messages,
        // but 24 races usually fits if lines are short.

        let description = "";
        const now = moment();
        let nextRaceFound = false;

        races.forEach(race => {
            // Unify Data Structure
            let raceName = race.raceName || race.name;
            let round = race.round;
            let country = "";
            let timeMoment;

            if (series === "f1") {
                country = race.Circuit.Location.country;
                // race.date is YYYY-MM-DD
                // race.time is HH:mm:ssZ
                const dt = `${race.date}T${race.time || "12:00:00Z"}`;
                timeMoment = moment(dt); // UTC parsing
            } else if (series === "motogp") {
                country = race.country;
                // Prioritize 'Race' session time, else 'date'
                const t = (race.sessions && race.sessions.Race) ? race.sessions.Race : race.date;
                timeMoment = moment(t);
            } else {
                country = race.country;
                const t = (race.sessions && race.sessions.Feature) ? race.sessions.Feature : race.date;
                timeMoment = moment(t);
            }

            const flag = getFlag(country) || "🏴";
            const timestamp = timeMoment.isValid() ? `<t:${timeMoment.unix()}:d>` : "TBD"; // Use short date format

            // Check if upcoming
            const isUpcoming = timeMoment.isValid() && timeMoment.isAfter(now);
            const statusIcon = isUpcoming ? "🗓️" : "✅";

            // Mark Next Race specifically
            if (isUpcoming && !nextRaceFound) {
                description += `Next Up: **${round}. ${flag} ${raceName}** — <t:${timeMoment.unix()}:F> 🏁\n`;
                // Add a visual separator or bolding
                nextRaceFound = true;
            } else {
                // Formatting: 1 🇧🇭 Bahrain ... Dec 5
                description += `**${round}.** ${flag} \`${raceName}\` — ${timestamp}\n`;
            }
        });

        // Split if too long (Discord limit 4096)
        // With ~25 races, ~60 chars each => 1500 chars. Safe.

        embed.setDescription(`${description}\n\n*Times are shown in your local timezone.*`);

        await interaction.editReply({ embeds: [embed] });
    }
};
