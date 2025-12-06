const { SlashCommandBuilder } = require("discord.js");
const { getCircuit, getCircuitList } = require("../services/f1Service");
const { getMotoGPCalendar } = require("../services/motogpService");
const { getF3Calendar } = require("../services/f3Service");
const { createBaseEmbed } = require("../utils/embedUtils");
const tracksData = require("../data/tracks.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("circuit")
        .setDescription("Get detailed information on a specific circuit")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Search for a circuit")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();

        // 1. Fetch F1 circuits (API)
        let f1Circuits = await getCircuitList();

        // 2. Fetch MotoGP circuits (Local)
        const motoRaces = getMotoGPCalendar();
        const motoCircuits = motoRaces.map(r => ({
            id: `motogp_${r.circuit.replace(/\s+/g, '_').toLowerCase()}`,
            name: `${r.circuit}`,
            series: 'MotoGP',
            country: r.country
        }));

        // 3. Fetch F3 circuits (Local)
        const f3Races = getF3Calendar();
        const f3Circuits = f3Races.map(r => ({
            id: `f3_${r.circuit.replace(/\s+/g, '_').toLowerCase()}`,
            name: `${r.circuit}`,
            series: 'F3',
            country: r.country
        }));

        // Filter and Format
        // F1
        const filteredF1 = f1Circuits.filter(c =>
            c.circuitName.toLowerCase().includes(focusedValue) ||
            c.Location.country.toLowerCase().includes(focusedValue)
        ).map(c => ({
            name: `🏁 ${c.circuitName} (${c.Location.country})`,
            value: c.circuitId // Ergast ID
        }));

        // Moto/F3
        const filterLocal = (list, emoji) => list.filter(c =>
            c.name.toLowerCase().includes(focusedValue)
        ).map(c => ({
            name: `${emoji} ${c.name} ${c.country}`,
            value: c.id
        }));

        const filteredMoto = filterLocal(motoCircuits, '🏍️');
        const filteredF3 = filterLocal(f3Circuits, '🏎️');

        const all = [...filteredF1, ...filteredMoto, ...filteredF3];

        // Deduplicate
        const unique = [];
        const seen = new Set();
        for (const item of all) {
            if (!seen.has(item.value)) {
                unique.push(item);
                seen.add(item.value);
            }
        }

        await interaction.respond(unique.slice(0, 25));
    },

    async execute(interaction) {
        await interaction.deferReply();
        const circuitId = interaction.options.getString("name");

        // Check for Moto/F3 prefix
        if (circuitId.startsWith("motogp_") || circuitId.startsWith("f3_")) {
            return this.handleLocalSeries(interaction, circuitId);
        }

        // F1 Handler
        // Try to find in Premium Local Data first (tracks.json)
        const premiumTrack = tracksData.find(t => t.id === circuitId);

        if (premiumTrack) {
            // Premium Embed
            const embed = createBaseEmbed(`Circuit information for ${premiumTrack.location.split(', ').pop()}:`)
                .setColor("#FF1801")
                .setTitle(`${premiumTrack.countryCode} Circuit information for ${premiumTrack.location.split(', ').pop()}:`)
                .setThumbnail(premiumTrack.image) // Small image top right? Or use as image? Thumbnail is top right.
                // User screenshot has image in top right? Or as main image?
                // Often track map is better as Image (big).
                .setImage(premiumTrack.image)     // Let's use Image for big map
                .addFields(
                    { name: "📛 Name", value: premiumTrack.name, inline: false },
                    { name: "📍 Location", value: premiumTrack.location, inline: false },
                    { name: "📅 First GP", value: `${premiumTrack.firstGP}`, inline: true },
                    { name: "⏱️ Lap Record", value: `${premiumTrack.lapRecord.time} (${premiumTrack.lapRecord.year})`, inline: true },
                    { name: "📏 Length", value: premiumTrack.length, inline: false },
                    { name: "📐 Turns", value: `${premiumTrack.turns}`, inline: true },
                    { name: "🔄 Laps", value: `${premiumTrack.laps}`, inline: true }
                );

            // Previous Podiums (2024)
            if (premiumTrack.podium2024) {
                let podiumText = "";
                premiumTrack.podium2024.forEach(p => {
                    const medal = p.position === 1 ? "🥇" : p.position === 2 ? "🥈" : "🥉";
                    podiumText += `${medal} ${p.driver}\n`;
                });
                embed.addFields({ name: "🏁 2024 Podium", value: podiumText, inline: false });
            }

            return interaction.editReply({ embeds: [embed] });
        }

        // Fallback to API if not in simplified tracks.json
        const circuit = await getCircuit(circuitId);
        if (!circuit) {
            return interaction.editReply("❌ Circuit not found.");
        }

        const embed = createBaseEmbed(`${circuit.circuitName}`)
            .setColor("#FF1801")
            .setDescription(`**Location:** ${circuit.Location.locality}, ${circuit.Location.country}`)
            .addFields(
                { name: "Coordinates", value: `${circuit.Location.lat}, ${circuit.Location.long}`, inline: true },
                { name: "More Info", value: `[Wikipedia](${circuit.url})`, inline: true }
            );

        // Try generic image map
        const mapImages = {
            "monza": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Monza_track_map.svg/1200px-Monza_track_map.svg.png",
            // ... (Keep existing fallbacks just in case)
        };
        if (mapImages[circuitId]) embed.setImage(mapImages[circuitId]);

        await interaction.editReply({ embeds: [embed] });
    },

    async handleLocalSeries(interaction, circuitId) {
        const isMoto = circuitId.startsWith("motogp_");
        const list = isMoto ? getMotoGPCalendar() : getF3Calendar();

        const race = list.find(r => {
            const generatedId = `${isMoto ? 'motogp' : 'f3'}_${r.circuit.replace(/\s+/g, '_').toLowerCase()}`;
            return generatedId === circuitId;
        });

        if (!race) {
            return interaction.editReply("❌ Circuit details not found in local database.");
        }

        const embed = createBaseEmbed(`${race.circuit}`)
            .setColor(isMoto ? "#000000" : "#151F45")
            .setDescription(`**Location:** ${race.country}`)
            .addFields(
                { name: "Series", value: isMoto ? "MotoGP" : "Formula 3", inline: true },
                { name: "Upcoming Round", value: `Round ${race.round} — ${race.name}`, inline: true },
                { name: "Date", value: race.date, inline: true }
            );

        // Simple images for simplified local tracks
        // We can add a few known ones
        const images = {
            "motogp_chang_international_circuit": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Buriram_International_Circuit.svg/1200px-Buriram_International_Circuit.svg.png"
        };

        if (images[circuitId]) embed.setImage(images[circuitId]);

        return interaction.editReply({ embeds: [embed] });
    }
};
