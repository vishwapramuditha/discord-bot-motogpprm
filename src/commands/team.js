const { SlashCommandBuilder } = require("discord.js");
const { getTeamInfo, getTeamDrivers, getTeamRecentResults, getStandings, getDriverInfo } = require("../services/f1Service");
const { createBaseEmbed } = require("../utils/embedUtils");
const teamConstants = require("../data/teamConstants");

const FLAG_MAP = {
    "Italian": "🇮🇹", "Austrian": "🇦🇹", "German": "🇩🇪", "British": "🇬🇧",
    "French": "🇫🇷", "Swiss": "🇨🇭", "American": "🇺🇸", "Dutch": "🇳🇱",
    "Mexican": "🇲🇽", "Monegasque": "🇲🇨", "Spanish": "🇪🇸", "Australian": "🇦🇺",
    "Canadian": "🇨🇦", "Japanese": "🇯🇵", "Chinese": "🇨🇳", "Thai": "🇹🇭",
    "Finnish": "🇫🇮", "Danish": "🇩🇰", "Argentine": "🇦🇷", "New Zealander": "🇳🇿",
    "Brazilian": "🇧🇷"
};

function getFlag(nationality) {
    return FLAG_MAP[nationality] || "🏳️";
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName("team")
        .setDescription("Get detailed information on an F1 team")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Team name (e.g. 'ferrari', 'red bull')")
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();
        let nameInput = interaction.options.getString("name").toLowerCase().trim().replace(/\s+/g, "_");

        // Manual mapping for common aliases to ensure we hit our constants keys
        const aliasMap = {
            "rbr": "red_bull", "redbull": "red_bull",
            "merc": "mercedes",
            "aston": "aston_martin", "amr": "aston_martin",
            "visa": "rb", "alpha_tauri": "rb", "alphatauri": "rb", "toro_rosso": "rb",
            "stake": "sauber", "alfa": "sauber", "alfa_romeo": "sauber",
            "alpine_f1": "alpine"
        };

        if (aliasMap[nameInput]) nameInput = aliasMap[nameInput];

        // 1. Fetch Basic API Info first to validate existence/get ID
        let teamInfo = await getTeamInfo(nameInput);

        // If API fails matching "red_bull" exactly, try to find it in our constants keys to use that ID
        if (!teamInfo && teamConstants[nameInput]) {
            // If input matches our key, assume that's the ID we want to try for API
            teamInfo = await getTeamInfo(nameInput);
        }

        if (!teamInfo) {
            // Try searching drivers list or vague match? No, just fail for now.
            // One last try: if key exists in constants, use it even if API failed (maybe API down?)
            // But we need API for recent results.
            if (teamConstants[nameInput]) {
                teamInfo = { constructorId: nameInput, name: teamConstants[nameInput].fullName, nationality: "Unknown", url: "" };
            } else {
                return interaction.editReply(`❌ Team '${nameInput}' not found. Please try full names like 'Ferrari' or 'McLaren'.`);
            }
        }

        const teamId = teamInfo.constructorId;
        const constantData = teamConstants[teamId] || {
            fullName: teamInfo.name,
            color: "#ffffff",
            engine: "Unknown",
            chassis: "Unknown",
            championships: "?",
            wins: "?",
            logo: null
        };

        // 2. Parallel Fetch Dynamic Data
        const [drivers, recentResults, standings] = await Promise.all([
            getTeamDrivers(teamId),
            getTeamRecentResults(teamId, 3),
            getStandings('current', 'constructor')
        ]);

        // Find this team's standing
        const currentStanding = standings?.ConstructorStandings?.find(s => s.Constructor.constructorId === teamId);

        // 3. Build Embed
        const embed = createBaseEmbed(`${constantData.fullName}`)
            .setColor(constantData.color)
            .setThumbnail(constantData.logo)
            .addFields(
                {
                    name: `**Name**: ${constantData.fullName}`,
                    value: `**Nationality**: ${getFlag(teamInfo.nationality)} ${teamInfo.nationality}`,
                    inline: false
                },
                {
                    name: "Engine",
                    value: constantData.engine,
                    inline: true
                },
                {
                    name: "Chassis",
                    value: constantData.chassis,
                    inline: true
                }
            );

        // Current Drivers Field
        if (drivers && drivers.length > 0) {
            const driverList = drivers.map(d => {
                const flag = getFlag(d.nationality);
                return `${flag} [${d.givenName} ${d.familyName}](${d.url}) #${d.permanentNumber}`;
            }).join("\n");
            embed.addFields({ name: "Current Drivers", value: driverList, inline: false });
        }

        // Statistics Field (Mix of Static and Dynamic)
        const stats = [
            `**World Championships**: ${constantData.championships}`,
            `**Total Race Wins**: ${constantData.wins}`,
            currentStanding ? `**Current Position**: P${currentStanding.position}` : null,
            currentStanding ? `**Current Points**: ${currentStanding.points}` : null
            // We could add "Recent Wins" etc if we parsed history
        ].filter(Boolean).join("\n");

        embed.addFields({ name: "Statistics", value: stats, inline: false });

        // Recent Results Field (Code Block style for neatness like image)
        if (recentResults && recentResults.length > 0) {
            let resultsText = "";
            recentResults.forEach(race => {
                resultsText += `${race.raceName}   ${race.date}\n`;
                // Find results for this team's drivers
                const teamResults = race.Results.filter(r => r.Constructor.constructorId === teamId);
                if (teamResults.length > 0) {
                    teamResults.forEach(tr => {
                        const status = tr.status === "Finished" || tr.status.includes("+") ? `Finished ${tr.position}` : tr.status;
                        // const icon = status.includes("Finished") ? "🏁" : "❌";
                        // Trying to match the image style roughly
                        resultsText += `   🏎️ ${tr.Driver.familyName}: ${status}\n`;
                    });
                } else {
                    resultsText += `   No entries\n`;
                }
                resultsText += "\n";
            });

            // Discord code blocks for monospaced alignment
            // Use 'yaml' or 'prolog' for coloring if desired, but 'text' is safest.
            // The user image has colored text "Las Vegas Grand Prix" (Blue) and dates.
            // We can try `ansi` or just `yaml`.
            if (resultsText.length > 1000) resultsText = resultsText.substring(0, 1000) + "...";

            // To get colors like the image in Discord is hard without complex ANSI, 
            // but we can use code blocks.
            // The user image uses a dark background standard embed.
            // We will use standard fields but maybe wrapping in code block for the "list" look.

            embed.addFields({ name: "Recent Results", value: `\`\`\`yaml\n${resultsText}\`\`\``, inline: false });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
