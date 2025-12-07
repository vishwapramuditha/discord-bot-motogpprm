const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");

// Hardcoded trivia questions for now
const questions = [
    { q: "Who holds the record for the most Grand Prix wins?", a: "Lewis Hamilton", options: ["Michael Schumacher", "Lewis Hamilton", "Sebastian Vettel", "Alain Prost"] },
    { q: "Which team has won the most Constructors' Championships?", a: "Ferrari", options: ["McLaren", "Williams", "Ferrari", "Mercedes"] },
    { q: "Who was the first ever Formula 1 World Champion?", a: "Giuseppe Farina", options: ["Juan Manuel Fangio", "Alberto Ascari", "Giuseppe Farina", "Stirling Moss"] },
    { q: "Which circuit is known as 'The Temple of Speed'?", a: "Monza", options: ["Silverstone", "Spa-Francorchamps", "Monza", "Suzuka"] }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("trivia")
        .setDescription("Take on the Formula 1 Trivia"),

    async execute(interaction) {
        const question = questions[Math.floor(Math.random() * questions.length)];

        // Shuffle options
        const options = [...question.options].sort(() => Math.random() - 0.5);

        const embed = createBaseEmbed("❓ F1 Trivia")
            .setDescription(`**${question.q}**`)
            .setFooter({ text: "Click the correct answer! (You have 15 seconds)" });

        // Create buttons
        const row = new ActionRowBuilder()
            .addComponents(
                options.map((opt, i) =>
                    new ButtonBuilder()
                        .setCustomId(`trivia_${i}`)
                        .setLabel(opt)
                        .setStyle(ButtonStyle.Primary)
                )
            );

        const response = await interaction.reply({ embeds: [embed], components: [row] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15_000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'These buttons are not for you!', ephemeral: true });
            }

            const selectedIndex = parseInt(i.customId.split('_')[1]);
            const selectedAnswer = options[selectedIndex];

            // Acknowledge the answer first
            await i.update({ content: `⏳ You selected **${selectedAnswer}**... checking your answer!`, components: [], embeds: [] });

            // Wait 3 seconds before revealing the answer
            setTimeout(async () => {
                if (selectedAnswer === question.a) {
                    await interaction.editReply({ content: `✅ Correct! The answer was **${question.a}**.`, components: [], embeds: [] });
                } else {
                    await interaction.editReply({ content: `❌ Wrong! The correct answer was **${question.a}**.`, components: [], embeds: [] });
                }
            }, 3000);

            collector.stop("answered");
        });

        collector.on('end', (collected, reason) => {
            if (reason !== "answered") {
                interaction.editReply({ content: `⏰ Time's up! The correct answer was **${question.a}**.`, components: [], embeds: [] });
            }
        });
    }
};
