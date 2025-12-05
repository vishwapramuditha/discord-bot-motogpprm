const { SlashCommandBuilder } = require("discord.js");
const { getCircuit, getCircuitList } = require("../services/f1Service");
const { createBaseEmbed } = require("../utils/embedUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("circuit")
        .setDescription("Get information on a specific circuit")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Search for a circuit")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const circuits = await getCircuitList();

        const filtered = circuits.filter(c =>
            c.circuitName.toLowerCase().includes(focusedValue) ||
            c.Location.locality.toLowerCase().includes(focusedValue) ||
            c.Location.country.toLowerCase().includes(focusedValue)
        );

        await interaction.respond(
            filtered.slice(0, 25).map(c => ({
                name: `${c.circuitName} (${c.Location.country})`,
                value: c.circuitId
            }))
        );
    },

    async execute(interaction) {
        await interaction.deferReply();
        const circuitId = interaction.options.getString("name");

        const circuit = await getCircuit(circuitId);

        if (!circuit) {
            return interaction.editReply("❌ Circuit not found.");
        }

        const embed = createBaseEmbed(`${circuit.circuitName}`)
            .setColor("#FFFFFF") // White/Neutral for tracks
            .setDescription(`**Location:** ${circuit.Location.locality}, ${circuit.Location.country}`)
            .addFields(
                { name: "Coordinates", value: `${circuit.Location.lat}, ${circuit.Location.long}`, inline: true },
                { name: "Wiki", value: `[Read More](${circuit.url})`, inline: true }
            );

        // Try to add a map image if we can guess it (simple mapping for popular ones)
        // This is a "Masterpiece" touch - mapping IDs to known Wikimedia images
        const mapImages = {
            "monza": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Monza_track_map.svg/1200px-Monza_track_map.svg.png",
            "spa": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Spa-Francorchamps_of_Belgium.svg/1200px-Spa-Francorchamps_of_Belgium.svg.png",
            "silverstone": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Silverstone_Circuit_2020.svg/1200px-Silverstone_Circuit_2020.svg.png",
            "monaco": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Monte_Carlo_Formula_1_track_map.svg/1200px-Monte_Carlo_Formula_1_track_map.svg.png",
            "suzuka": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Suzuka_circuit_map_2005.svg/1200px-Suzuka_circuit_map_2005.svg.png",
            "red_bull_ring": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Red_Bull_Ring_2022.svg/1200px-Red_Bull_Ring_2022.svg.png",
            "bahrain": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Bahrain_International_Circuit--Grand_Prix_Layout.svg/1200px-Bahrain_International_Circuit--Grand_Prix_Layout.svg.png",
            "catalunya": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Catalunya_2021.svg/1200px-Catalunya_2021.svg.png",
            "hungaroring": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Hungaroring.svg/1200px-Hungaroring.svg.png",
            "zandvoort": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Circuit_Zandvoort_2020.svg/1200px-Circuit_Zandvoort_2020.svg.png"
        };

        if (mapImages[circuitId]) {
            embed.setImage(mapImages[circuitId]);
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
