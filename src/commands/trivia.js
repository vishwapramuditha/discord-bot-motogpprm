const { SlashCommandBuilder } = require("discord.js");
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
            .setDescription(`**${question.q}**\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join("\n")}`)
            .setFooter({ text: "Reply with the correct answer! (You have 15 seconds)" });

        await interaction.reply({ embeds: [embed] });

        const filter = response => {
            return response.author.id === interaction.user.id;
        };

        try {
            const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] });
            const answer = collected.first().content;

            if (answer.toLowerCase().includes(question.a.toLowerCase())) {
                await interaction.followUp(`✅ Correct! The answer was **${question.a}**.`);
            } else {
                await interaction.followUp(`❌ Wrong! The correct answer was **${question.a}**.`);
            }
        } catch (e) {
            await interaction.followUp(`⏰ Time's up! The correct answer was **${question.a}**.`);
        }
    }
};
