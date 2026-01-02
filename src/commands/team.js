const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } = require("discord.js");
const { getTeamInfo, getTeamDrivers, getTeamRecentResults, getStandings, getDriverInfo, getLastRacesResults, getDriverImage } = require("../services/f1Service");
const { getMotoGPStandings } = require("../services/motogpService");
const { getF3Standings } = require("../services/f3Service");
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
        .setDescription("Get detailed information on an F1, MotoGP, or F3 team")
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

        // 3. F3 Teams (From Teams Standings)
        const f3Teams = getF3Standings('teams') || [];
        const f3Mapped = f3Teams.map(t => ({
            name: `🏎️ F3: ${t.name}`,
            value: `f3_${t.name}`
        }));

        const all = [...f1Teams, ...motoMapped, ...f3Mapped];
        const filtered = all.filter(choice => choice.name.toLowerCase().includes(focusedValue));

        // Deduplicate values just in case
        const unique = [];
        const seen = new Set();
        for (const item of filtered) {
            if (!seen.has(item.value)) {
                unique.push(item);
                seen.add(item.value);
            }
        }

        await interaction.respond(unique.slice(0, 25));
    },

    async execute(interaction) {
        await interaction.deferReply();
        const teamId = interaction.options.getString("name");

        let teamData = null;
        let drivers = [];
        let series = "";
        let color = "#FFFFFF";

        // --- FETCH DATA ---
        if (teamId.startsWith("motogp_")) {
            series = "MotoGP";
            color = "#000000";
            const name = teamId.replace("motogp_", "");
            const teams = getMotoGPStandings('constructors');
            const team = teams.find(t => t.name === name);
            if (team) {
                teamData = { name: team.name, rank: team.rank, points: team.points };
                const allRiders = getMotoGPStandings('riders');
                drivers = allRiders.filter(r => r.team === team.name).map(r => ({
                    id: `motogp_${r.name}`,
                    name: r.name,
                    label: r.name,
                    nationality: "Unknown" // Not in simple stats
                }));
            }
        } else if (teamId.startsWith("f3_")) {
            series = "F3";
            color = "#151F45";
            const name = teamId.replace("f3_", "");
            const teams = getF3Standings('teams');
            const team = teams.find(t => t.name === name);
            if (team) {
                teamData = { name: team.name, rank: team.rank, points: team.points };
                const allDrivers = getF3Standings('drivers');
                drivers = allDrivers.filter(r => r.team === team.name).map(r => ({
                    id: `f3_${r.name}`,
                    name: r.name,
                    label: r.name,
                    nationality: "Unknown"
                }));
            }
        } else {
            series = "F1";
            // F1 Handler
            let teamInfo = await getTeamInfo(teamId);
            // Fallback
            if (!teamInfo && teamConstants[teamId]) {
                teamInfo = { constructorId: teamId, name: teamConstants[teamId].fullName, nationality: "Unknown", url: "" };
            }

            if (teamInfo) {
                const constantData = teamConstants[teamId] || { fullName: teamInfo.name, color: "#FF1801", engine: "Unknown", chassis: "Unknown" };
                color = constantData.color;

                const [teamDrivers, recentResults, standings] = await Promise.all([
                    getTeamDrivers(teamId),
                    getTeamRecentResults(teamId, 3),
                    getStandings('current', 'constructor')
                ]);

                const currentStanding = standings?.ConstructorStandings?.find(s => s.Constructor.constructorId === teamId);

                teamData = {
                    name: constantData.fullName,
                    nationality: teamInfo.nationality,
                    engine: constantData.engine,
                    chassis: constantData.chassis,
                    rank: currentStanding ? currentStanding.position : "?",
                    points: currentStanding ? currentStanding.points : "?",
                    wins: constantData.wins || "?",
                    championships: constantData.championships || "?",
                    recentResults: recentResults,
                    logo: constantData.logo
                };

                drivers = teamDrivers.map(d => ({
                    id: d.driverId,
                    name: `${d.givenName} ${d.familyName}`,
                    label: `${d.givenName} ${d.familyName}`,
                    nationality: d.nationality,
                    permanentNumber: d.permanentNumber
                }));
            }
        }

        if (!teamData) return interaction.editReply("❌ Team not found.");

        // --- BUILD EMBED ---
        const embed = createBaseEmbed(teamData.name).setColor(color);
        if (teamData.logo) embed.setThumbnail(teamData.logo);

        let fields = [];
        if (series === "F1") {
            fields.push(
                { name: "Nationality", value: `${getFlag(teamData.nationality)} ${teamData.nationality}`, inline: true },
                { name: "Engine", value: teamData.engine, inline: true },
                { name: "Chassis", value: teamData.chassis, inline: true },
                { name: "Stats", value: `🏆 Titles: ${teamData.championships}\n🥇 Wins: ${teamData.wins}\n📊 Rank: P${teamData.rank} (${teamData.points} pts)`, inline: false }
            );

            if (teamData.recentResults?.length) {
                let resultsText = "";
                teamData.recentResults.forEach(race => {
                    const teamRes = race.Results.filter(r => r.Constructor.constructorId === teamId);
                    if (teamRes.length) {
                        resultsText += `**${race.raceName}**: ${teamRes.map(r => `${r.Driver.code || r.Driver.familyName} (P${r.position})`).join(", ")}\n`;
                    }
                });
                embed.addFields({ name: "Recent Results", value: resultsText, inline: false });
            }

        } else {
            // Moto/F3
            fields.push(
                { name: "Series", value: series, inline: true },
                { name: "Rank", value: `P${teamData.rank}`, inline: true },
                { name: "Points", value: `${teamData.points}`, inline: true }
            );
        }

        // Add Driver List to Field
        if (drivers.length > 0) {
            const dList = drivers.map(d => `${d.nationality ? getFlag(d.nationality) : "👤"} **${d.name}** ${(d.permanentNumber ? `#${d.permanentNumber}` : "")}`).join("\n");
            embed.addFields({ name: "Current Drivers", value: dList });
        } else {
            embed.addFields({ name: "Drivers", value: "No driver data available." });
        }

        embed.addFields(...fields);

        // --- BUILD DROPDOWN ---
        const components = [];
        if (drivers.length > 0) {
            const select = new StringSelectMenuBuilder()
                .setCustomId('team_driver_select')
                .setPlaceholder('Select a driver to view profile...')
                .addOptions(
                    drivers.slice(0, 25).map(d =>
                        new StringSelectMenuOptionBuilder()
                            .setLabel(d.label)
                            .setValue(d.id)
                            .setDescription(`View details for ${d.name}`)
                            .setEmoji('👤')
                    )
                );

            const row = new ActionRowBuilder().addComponents(select);
            components.push(row);
        }

        const response = await interaction.editReply({ embeds: [embed], components: components });

        // --- COLLECTOR ---
        if (drivers.length > 0) {
            const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: "These options are for the user who ran the command.", ephemeral: true });
                }

                await i.deferReply({ ephemeral: true });
                const selectedId = i.values[0];

                // Determine logic based on ID prefix
                if (selectedId.startsWith("motogp_") || selectedId.startsWith("f3_")) {
                    // Simple local embed
                    const isMoto = selectedId.startsWith("motogp_");
                    const name = selectedId.replace(isMoto ? "motogp_" : "f3_", "");
                    const list = isMoto ? getMotoGPStandings('riders') : getF3Standings('drivers');
                    const rider = list.find(r => r.name === name);

                    if (rider) {
                        const dEmbed = createBaseEmbed(rider.name)
                            .setColor(isMoto ? "#000000" : "#151F45")
                            .addFields(
                                { name: "Team", value: rider.team || "Unknown", inline: true },
                                { name: "Points", value: `${rider.points}`, inline: true },
                                { name: "Rank", value: `${rider.rank}`, inline: true }
                            );
                        await i.editReply({ embeds: [dEmbed] });
                    } else {
                        await i.editReply("❌ Driver details not found.");
                    }

                } else {
                    // F1 Driver (API)
                    const driver = await getDriverInfo(selectedId);
                    if (driver) {
                        const lastRaces = await getLastRacesResults(selectedId);
                        const img = getDriverImage(selectedId);

                        const dEmbed = createBaseEmbed(`${driver.givenName} ${driver.familyName}`)
                            .setColor("#FF1801")
                            .setThumbnail(img || "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/F1.svg/1200px-F1.svg.png")
                            .addFields(
                                { name: "Nationality", value: `${driver.nationality}`, inline: true },
                                { name: "Number", value: `${driver.permanentNumber}`, inline: true }
                            );

                        if (lastRaces.length) {
                            const res = lastRaces.map(r => `**${r.raceName}**: P${r.Results[0].position}`).join("\n");
                            dEmbed.addFields({ name: "Recent Results", value: res });
                        }
                        await i.editReply({ embeds: [dEmbed] });
                    } else {
                        await i.editReply("❌ Failed to fetch F1 driver data.");
                    }
                }
            });
        }
    }
};
