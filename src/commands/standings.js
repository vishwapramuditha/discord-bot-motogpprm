const { SlashCommandBuilder } = require("discord.js");
const { getStandings: getF1Standings } = require("../services/f1Service");
const { getMotoGPStandings } = require("../services/motogpService");
const { getF3Standings } = require("../services/f3Service");
const { createBaseEmbed } = require("../utils/embedUtils");
const { getFlag } = require("../utils/nationalityUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("standings")
        .setDescription("Get the Driver/Rider or Constructor standings")
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
            option.setName("type")
                .setDescription("Driver/Rider or Constructor")
                .setRequired(true)
                .addChoices(
                    { name: "Driver/Rider", value: "driver" },
                    { name: "Constructor", value: "constructor" }
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
        const type = interaction.options.getString("type");
        const year = interaction.options.getString("year") || "current";

        if (series === "f1") {
            const data = await getF1Standings(year, type);
            if (!data) return interaction.editReply("❌ Could not fetch F1 standings.");

            const title = type === 'driver' ? 'Driver Standings' : 'Constructor Standings';
            const embed = createBaseEmbed(title)
                .setColor("#FF1801")
                .setDescription(`**${data.season} Season**\n\n`);

            const list = type === 'driver' ? data.DriverStandings : data.ConstructorStandings;
            const topList = list.slice(0, 25); // Show top 25

            let standingsText = "";
            topList.forEach(item => {
                const pos = item.position;
                const points = item.points;

                if (type === 'driver') {
                    const name = `${item.Driver.givenName} ${item.Driver.familyName}`;
                    const flag = getFlag(item.Driver.nationality);
                    // Format: 1 🇬🇧 Lando Norris — 390 pts
                    standingsText += `**${pos}** ${flag} **${name}** — ${points} pts\n`;
                } else {
                    const name = item.Constructor.name;
                    const flag = getFlag(item.Constructor.nationality);
                    // Format: 1 🇬🇧 McLaren Racing — 666 pts
                    standingsText += `**${pos}** ${flag} **${name}** — ${points} pts\n`;
                }
            });

            embed.setDescription(embed.data.description + standingsText);
            return interaction.editReply({ embeds: [embed] });

        } else if (series === "motogp") {
            // MotoGP
            const motoType = type === 'driver' ? 'riders' : 'constructors';
            const data = getMotoGPStandings(motoType);

            if (!data || data.length === 0) return interaction.editReply("❌ No MotoGP standings data available.");

            const title = motoType === 'riders' ? 'Rider Standings' : 'Constructor Standings';
            const embed = createBaseEmbed(title)
                .setColor("#000000") // MotoGP Black
                .setDescription(`**2025 Season**\n\n`);

            let standingsText = "";
            data.forEach(item => {
                const rank = item.rank;
                const points = item.points;

                if (motoType === 'riders') {
                    standingsText += `**${rank}** ${item.name} — ${points} pts\n`;
                } else {
                    const manufacturerFlags = {
                        "Ducati": "🇮🇹",
                        "KTM": "🇦🇹",
                        "Aprilia": "🇮🇹",
                        "Yamaha": "🇯🇵",
                        "Honda": "🇯🇵"
                    };
                    const flag = manufacturerFlags[item.name] || "🏳️";
                    standingsText += `**${rank}** ${flag} **${item.name}** — ${points} pts\n`;
                }
            });

            embed.setDescription(embed.data.description + standingsText);
            return interaction.editReply({ embeds: [embed] });
        } else {
            // F3
            const f3Type = type === 'driver' ? 'drivers' : 'teams'; // JSON keys: "drivers", "teams"
            const data = getF3Standings(f3Type);

            if (!data || data.length === 0) return interaction.editReply("❌ No F3 standings data available.");

            const title = type === 'driver' ? 'Driver Standings' : 'Team Standings';
            const embed = createBaseEmbed(title)
                .setColor("#151F45")
                .setDescription(`**2025 Season**\n\n`);

            let standingsText = "";
            data.forEach(item => {
                const rank = item.rank;
                const points = item.points;
                const name = item.name;

                // Assuming we don't have detailed flag/team info in simple placeholder yet
                standingsText += `**${rank}** ${name} — ${points} pts\n`;
            });

            embed.setDescription(embed.data.description + standingsText);
            return interaction.editReply({ embeds: [embed] });
        }
    }
};
