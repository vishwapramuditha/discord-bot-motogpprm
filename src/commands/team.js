const { SlashCommandBuilder } = require("discord.js");
const { getTeamInfo, getTeamDrivers, getTeamRecentResults, getStandings } = require("../services/f1Service");
const { getMotoGPStandings } = require("../services/motogpService");
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
        .setDescription("Get detailed information on an F1 or MotoGP team")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Team name")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();

        // 1. F1 Teams (Static list mostly)
        const f1Teams = Object.entries(teamConstants).map(([key, data]) => ({
            name: `🏁 F1: ${data.fullName}`,
            value: key
        }));

        // 2. MotoGP Teams (From Constructors Standings)
        const motoTeams = getMotoGPStandings('constructors') || [];
        const motoMapped = motoTeams.map(t => ({
            name: `🏍️ MotoGP: ${t.name}`,
            value: `motogp_${t.name}`
        }));

        const all = [...f1Teams, ...motoMapped];
        const filtered = all.filter(choice => choice.name.toLowerCase().includes(focusedValue));

        await interaction.respond(filtered.slice(0, 25));
    },

    async execute(interaction) {
        await interaction.deferReply();
        const teamId = interaction.options.getString("name");

        if (teamId.startsWith("motogp_")) {
            // MotoGP Handler
            const name = teamId.replace("motogp_", "");
            const motoTeams = getMotoGPStandings('constructors');
            const team = motoTeams.find(t => t.name === name);

            if (!team) return interaction.editReply("❌ MotoGP Team not found.");

            const embed = createBaseEmbed(team.name)
                .setColor("#000000")
                .addFields(
                    { name: "Series", value: "MotoGP", inline: true },
                    { name: "Current Points", value: `${team.points}`, inline: true },
                    { name: "Rank", value: `#${team.rank}`, inline: true }
                );

            const manufacturerFlags = {
                "Ducati": "🇮🇹", "KTM": "🇦🇹", "Aprilia": "🇮🇹",
                "Yamaha": "🇯🇵", "Honda": "🇯🇵"
            };
            const flag = manufacturerFlags[team.name] || "";
            if (flag) embed.setTitle(`${flag} ${team.name}`);

            // Generic Logo
            embed.setThumbnail("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/MotoGP_Logo.svg/1200px-MotoGP_Logo.svg.png");

            return interaction.editReply({ embeds: [embed] });

        } else {
            // F1 Handler
            let teamInfo = await getTeamInfo(teamId);

            if (!teamInfo && teamConstants[teamId]) {
                // Fallback if API fails but we have data
                teamInfo = { constructorId: teamId, name: teamConstants[teamId].fullName, nationality: "Unknown", url: "" };
            }

            if (!teamInfo) {
                return interaction.editReply(`❌ Team information for '${teamId}' could not be retrieved.`);
            }

            const constantData = teamConstants[teamId] || {
                fullName: teamInfo.name,
                color: "#ffffff",
                engine: "Unknown",
                chassis: "Unknown",
                championships: "?",
                wins: "?",
                logo: null
            };

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

            // Statistics Field
            const stats = [
                `**World Championships**: ${constantData.championships}`,
                `**Total Race Wins**: ${constantData.wins}`,
                currentStanding ? `**Current Position**: P${currentStanding.position}` : null,
                currentStanding ? `**Current Points**: ${currentStanding.points}` : null
            ].filter(Boolean).join("\n");

            embed.addFields({ name: "Statistics", value: stats, inline: false });

            // Recent Results Field
            if (recentResults && recentResults.length > 0) {
                let resultsText = "";
                recentResults.forEach(race => {
                    resultsText += `${race.raceName}   ${race.date}\n`;
                    const teamResults = race.Results.filter(r => r.Constructor.constructorId === teamId);
                    if (teamResults.length > 0) {
                        teamResults.forEach(tr => {
                            const status = tr.status === "Finished" || tr.status.includes("+") ? `Finished ${tr.position}` : tr.status;
                            resultsText += `   🏎️ ${tr.Driver.familyName}: ${status}\n`;
                        });
                    } else {
                        resultsText += `   No entries\n`;
                    }
                    resultsText += "\n";
                });

                if (resultsText.length > 1000) resultsText = resultsText.substring(0, 1000) + "...";

                embed.addFields({ name: "Recent Results", value: `\`\`\`yaml\n${resultsText}\`\`\``, inline: false });
            }

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
