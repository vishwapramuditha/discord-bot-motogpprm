require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
} = require("discord.js");
const moment = require("moment-timezone");
const data = require("./races.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ------------------- Bot Ready -------------------
client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// ------------------- Helper Functions -------------------
function getNextRace() {
    const now = moment();
    return (
        data.races.find((race) =>
            Object.values(race.sessions).some((t) => moment(t).isAfter(now))
        ) || null
    );
}

function formatCountdown(time) {
    const now = moment();
    const diff = moment(time).diff(now);
    if (diff <= 0) return "✅";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return `${days}d ${hours}h ${minutes}m`;
}

function sessionEmoji(session) {
    switch (session.toLowerCase()) {
        case "free practice 1":
        case "free practice 2":
        case "practice":
            return "🟢";
        case "qualifying 1":
        case "qualifying 2":
        case "qualifying":
            return "🏎️";
        case "sprint":
            return "⚡";
        case "warm up":
            return "☀️";
        case "race":
            return "🏁";
        default:
            return "📌";
    }
}

// ------------------- Command Handling -------------------
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // ---------- /next ----------
    if (interaction.commandName === "next") {
        const nextRace = getNextRace();
        if (!nextRace) return interaction.reply("🎉 No upcoming races!");

        const embed = new EmbedBuilder()
            .setTitle(`🏁 ${nextRace.name} - ${nextRace.track}`)
            .setColor("#FF0000")
            .setFooter({ text: "MotoGP 2025 Schedule" });

        for (const [session, time] of Object.entries(nextRace.sessions)) {
            const sessionTime = moment(time).tz(moment.tz.guess());
            const unixTime = Math.floor(sessionTime.valueOf() / 1000);
            const displayTime = `<t:${unixTime}:f>`;
            const countdown = formatCountdown(sessionTime);
            const emoji = sessionEmoji(session);

            embed.addFields({
                name: `${emoji} ${session}`,
                value: `${displayTime} | ⏱ ${countdown}`,
                inline: false,
            });
        }

        return interaction.reply({ embeds: [embed] });
    }

    // ---------- /standings ----------
    if (interaction.commandName === "standings") {
        const type = interaction.options.getString("type");

        if (type === "riders") {
            const riders = data.riders;
            const embeds = [];

            // Split into two embeds if more than 15 riders
            const firstEmbed = new EmbedBuilder()
                .setTitle("🏆 Riders Championship Standings (1-15)")
                .setColor("#FFD700")
                .setFooter({ text: "MotoGP 2025 Championship" });

            riders.slice(0, 15).forEach((driver) => {
                firstEmbed.addFields({
                    name: `#${driver.rank} ${driver.name} (${driver.team})`,
                    value: `Points: ${driver.points}`,
                    inline: true,
                });
            });

            embeds.push(firstEmbed);

            if (riders.length > 15) {
                const secondEmbed = new EmbedBuilder()
                    .setTitle(`🏆 Riders Championship Standings (${16}-${riders.length})`)
                    .setColor("#FFD700")
                    .setFooter({ text: "MotoGP 2025 Championship" });

                riders.slice(15).forEach((driver) => {
                    secondEmbed.addFields({
                        name: `#${driver.rank} ${driver.name} (${driver.team})`,
                        value: `Points: ${driver.points}`,
                        inline: true,
                    });
                });

                embeds.push(secondEmbed);
            }

            return interaction.reply({ embeds: embeds });
        } else if (type === "constructors") {
            const embed = new EmbedBuilder()
                .setTitle("🏎️ Constructors Championship Standings")
                .setColor("#FFD700")
                .setFooter({ text: "MotoGP 2025 Championship" });

            data.constructors.forEach((team) => {
                embed.addFields({
                    name: `${team.team}`,
                    value: `Points: ${team.points}`,
                    inline: true,
                });
            });

            return interaction.reply({ embeds: [embed] });
        }
    }

    // ---------- /support ----------
    if (interaction.commandName === "support") {
        return interaction.reply({
            content:
                "☕ Support the developer:\n[Buy me a coffee](https://buymeacoffee.com/pramu.cc)\n🌐 Website: [vishwapramuditha.com](https://vishwapramuditha.com)",
            ephemeral: true,
        });
    }
});

client.login(process.env.TOKEN);
