const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");

// Expanded Questions Bank (F1, MotoGP, F3)
const questions = [
    // F1
    { q: "Who holds the record for the most Grand Prix wins?", a: "Lewis Hamilton", options: ["Michael Schumacher", "Lewis Hamilton", "Sebastian Vettel", "Alain Prost"] },
    { q: "Which team has won the most Constructors' Championships?", a: "Ferrari", options: ["McLaren", "Williams", "Ferrari", "Mercedes"] },
    { q: "Who was the first ever Formula 1 World Champion?", a: "Giuseppe Farina", options: ["Juan Manuel Fangio", "Alberto Ascari", "Giuseppe Farina", "Stirling Moss"] },
    { q: "Which circuit is known as 'The Temple of Speed'?", a: "Monza", options: ["Silverstone", "Spa-Francorchamps", "Monza", "Suzuka"] },
    { q: "Who is the youngest F1 World Champion?", a: "Sebastian Vettel", options: ["Max Verstappen", "Sebastian Vettel", "Lewis Hamilton", "Fernando Alonso"] },
    { q: "Which driver has the most career pole positions?", a: "Lewis Hamilton", options: ["Ayrton Senna", "Michael Schumacher", "Lewis Hamilton", "Jim Clark"] },
    { q: "What year did the F1 hybrid era begin?", a: "2014", options: ["2012", "2013", "2014", "2015"] },
    { q: "Which race is often called the 'Jewel in the Crown' of F1?", a: "Monaco Grand Prix", options: ["British Grand Prix", "Italian Grand Prix", "Monaco Grand Prix", "Singapore Grand Prix"] },
    { q: "Which driver famously drove for Ferrari, McLaren, Renault, and Alpine?", a: "Fernando Alonso", options: ["Kimi Raikkonen", "Fernando Alonso", "Sebastian Vettel", "Daniel Ricciardo"] },
    { q: "Who won the 2009 F1 Championship with Brawn GP?", a: "Jenson Button", options: ["Rubens Barrichello", "Jenson Button", "Lewis Hamilton", "Sebastian Vettel"] },

    // MotoGP
    { q: "Who has the most MotoGP Premier Class championships?", a: "Giacomo Agostini", options: ["Valentino Rossi", "Marc Marquez", "Giacomo Agostini", "Mick Doohan"] },
    { q: "What number did Valentino Rossi famously race with?", a: "46", options: ["93", "46", "27", "99"] },
    { q: "Which manufacturer does Marc Marquez race for in 2025?", a: "Ducati", options: ["Honda", "KTM", "Ducati", "Aprilia"] },
    { q: "What is the name of the Ducati MotoGP team?", a: "Ducati Lenovo Team", options: ["Pramac Racing", "Ducati Lenovo Team", "Gresini Racing", "VR46 Racing Team"] },
    { q: "Which Spanish circuit hosts the MotoGP season finale?", a: "Valencia", options: ["Jerez", "Catalunya", "Valencia", "Aragon"] },
    { q: "Who is nicknamed 'Pecco'?", a: "Francesco Bagnaia", options: ["Jorge Martin", "Enea Bastianini", "Francesco Bagnaia", "Marco Bezzecchi"] },
    { q: "What country is the manufacturer KTM from?", a: "Austria", options: ["Germany", "Italy", "Austria", "Japan"] },

    // F3 / Junior Categories
    { q: "Which F1 driver won the F3 championship in his rookie year?", a: "Oscar Piastri", options: ["Lando Norris", "George Russell", "Oscar Piastri", "Charles Leclerc"] },
    { q: "Does Formula 3 use DRS?", a: "Yes", options: ["Yes", "No", "Only in Feature Race", "Only in Practice"] },
    { q: "How many races are typically in an F3 weekend?", a: "2", options: ["1", "2", "3", "4"] },
    { q: "Which famous F1 driver's son raced in F3 recently?", a: "Mick Schumacher", options: ["Mick Schumacher", "Max Verstappen", "Nico Rosberg", "Damon Hill"] }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("trivia")
        .setDescription("Take on the Ultimate Motorsport Trivia (F1, MotoGP, F3)"),

    async execute(interaction) {
        // Pick random question
        const question = questions[Math.floor(Math.random() * questions.length)];

        // Shuffle options
        const options = [...question.options].sort(() => Math.random() - 0.5);

        const embed = createBaseEmbed("❓ Motorsport Trivia")
            .setDescription(`**${question.q}**`)
            .setFooter({ text: "Click the correct answer! (You have 15 seconds)" })
            .setColor("#FFD700"); // Gold

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

            // Acknowledge
            await i.deferUpdate();

            const resultEmbed = createBaseEmbed("❓ Motorsport Trivia")
                .setDescription(`**${question.q}**\n\nYou answered: **${selectedAnswer}**`)
                .setFooter({ text: "Thanks for playing!" });

            if (selectedAnswer === question.a) {
                resultEmbed.setColor("#00FF00")
                    .addFields({ name: "Result", value: "✅ Correct!" });
            } else {
                resultEmbed.setColor("#FF0000")
                    .addFields({ name: "Result", value: `❌ Wrong! The correct answer was **${question.a}**.` });
            }

            await interaction.editReply({ embeds: [resultEmbed], components: [] });
            collector.stop("answered");
        });

        collector.on('end', (collected, reason) => {
            if (reason !== "answered") {
                const timeoutEmbed = createBaseEmbed("❓ Motorsport Trivia")
                    .setDescription(`**${question.q}**`)
                    .setColor("#FFA500")
                    .addFields({ name: "Result", value: `⏰ Time's up! The correct answer was **${question.a}**.` });

                interaction.editReply({ embeds: [timeoutEmbed], components: [] });
            }
        });
    }
};
