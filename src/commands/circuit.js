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
                .setThumbnail(premiumTrack.image)
                .setImage(premiumTrack.image)
                .addFields(
                    { name: "📛 Name", value: premiumTrack.name, inline: false },
                    { name: "📍 Location", value: premiumTrack.location, inline: false },
                    { name: "📅 First GP", value: `${premiumTrack.firstGP}`, inline: true },
                    { name: "⏱️ Lap Record", value: `${premiumTrack.lapRecord.time} (${premiumTrack.lapRecord.year})`, inline: true },
                    { name: "📏 Length", value: premiumTrack.length, inline: false },
                    { name: "📐 Turns", value: `${premiumTrack.turns}`, inline: true },
                    { name: "🔄 Laps", value: `${premiumTrack.laps}`, inline: true }
                );

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

        // Fallback to API
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

        const mapImages = {
            "monza": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Monza_track_map.svg/1200px-Monza_track_map.svg.png",
            "silverstone": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Silverstone_Circuit_2011.png/1200px-Silverstone_Circuit_2011.png",
            "spa": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Spa-Francorchamps_of_Belgium.svg/1200px-Spa-Francorchamps_of_Belgium.svg.png"
        };
        if (mapImages[circuitId]) embed.setImage(mapImages[circuitId]);

        await interaction.editReply({ embeds: [embed] });
    },

    async handleLocalSeries(interaction, circuitId) {
        const isMoto = circuitId.startsWith("motogp_");
        const list = isMoto ? getMotoGPCalendar() : getF3Calendar();

        const race = list.find(r => {
            const generatedId = `${isMoto ? 'motogp' : 'f3'}_${r.circuit.replace(/\s+/g, '_').toLowerCase()}`;
            // Simple fuzzy check if generated doesn't match exactly often
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
                { name: "Date", value: race.date || "TBD", inline: true }
            );

        // Expanded Image Map
        const images = {
            "motogp_chang_international_circuit": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Buriram_International_Circuit.svg/1200px-Buriram_International_Circuit.svg.png",
            "motogp_autódromo_internacional_ayrton_senna": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Goiania.svg/1200px-Goiania.svg.png",
            "motogp_circuit_of_the_americas": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Austin_circuit.svg/1200px-Austin_circuit.svg.png",
            "motogp_lusail_international_circuit": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Circuit_Losail.svg/1200px-Circuit_Losail.svg.png",
            "motogp_jerez-ángel_nieto": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Circuito_de_Jerez.svg/1200px-Circuito_de_Jerez.svg.png",
            "motogp_le_mans_bugatti": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Circuit_Bugatti_Le_Mans.svg/1200px-Circuit_Bugatti_Le_Mans.svg.png",
            "motogp_barcelona-catalunya": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Catalunya.svg/1200px-Catalunya.svg.png",
            "motogp_mugello": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Mugello_Racing_Circuit_track_map.svg/1200px-Mugello_Racing_Circuit_track_map.svg.png",
            "motogp_balaton_park_circuit": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Balaton_Park_Circuit_Layout.png/800px-Balaton_Park_Circuit_Layout.png",
            "motogp_automotodrom_brno": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Masaryk_Circuit_layout_1987.svg/1200px-Masaryk_Circuit_layout_1987.svg.png",
            "motogp_tt_circuit_assen": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Circuit_Assen.svg/1200px-Circuit_Assen.svg.png",
            "motogp_sachsenring": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Sachsenring.svg/1200px-Sachsenring.svg.png",
            "motogp_silverstone": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Silverstone_Circuit_2020.svg/1200px-Silverstone_Circuit_2020.svg.png",
            "motogp_motorland_aragón": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Motorland_Aragon.svg/1200px-Motorland_Aragon.svg.png",
            "motogp_misano_world_circuit_marco_simoncelli": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Misano_World_Circuit_Marco_Simoncelli.svg/1200px-Misano_World_Circuit_Marco_Simoncelli.svg.png",
            "motogp_red_bull_ring": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Red_Bull_Ring.svg/1200px-Red_Bull_Ring.svg.png",
            "motogp_mobility_resort_motegi": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Twin_Ring_Motegi.svg/1200px-Twin_Ring_Motegi.svg.png",
            "motogp_mandalika_international_street_circuit": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Mandalika_International_Street_Circuit.svg/1200px-Mandalika_International_Street_Circuit.svg.png",
            "motogp_phillip_island": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Phillip_Island_Circuit.svg/1200px-Phillip_Island_Circuit.svg.png",
            "motogp_sepang": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Sepang.svg/1200px-Sepang.svg.png",
            "motogp_portimão": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Autodromo_Internacional_do_Algarve.svg/1200px-Autodromo_Internacional_do_Algarve.svg.png",
            "motogp_ricardo_tormo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Circuit_Valencia_street_circuit_2008.png/250px-Circuit_Valencia_street_circuit_2008.png"
        };

        if (images[circuitId]) embed.setImage(images[circuitId]);

        return interaction.editReply({ embeds: [embed] });
    }
};
