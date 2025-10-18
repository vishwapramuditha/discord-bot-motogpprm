require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
} = require("discord.js");
const moment = require("moment-timezone");
const data = require("./races.json");

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

// Store active intervals to prevent memory leaks
const activeIntervals = new Map();

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
    const target = moment(time);
    const diff = target.diff(now);
    
    if (diff <= 0) return "✅ Finished";

    const duration = moment.duration(diff);
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();

    if (days > 0) {
        return `⏱ ${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `⏱ ${hours}h ${minutes}m`;
    } else {
        return `⏱ ${minutes}m`;
    }
}

function sessionEmoji(session) {
    const sessionLower = session.toLowerCase();
    
    if (sessionLower.includes("practice")) return "🟢";
    if (sessionLower.includes("qualifying")) return "🏎️";
    if (sessionLower.includes("sprint")) return "⚡";
    if (sessionLower.includes("warm up")) return "☀️";
    if (sessionLower.includes("race")) return "🏁";
    
    return "📌";
}

function getSessionStatus(sessionStart, sessionEnd) {
    const now = moment();
    
    if (now.isBefore(sessionStart)) {
        return formatCountdown(sessionStart);
    } else if (now.isBetween(sessionStart, sessionEnd)) {
        return "🟠 **LIVE NOW**";
    } else {
        return "✅ Finished";
    }
}

function createRaceEmbed(nextRace) {
    const embed = new EmbedBuilder()
        .setTitle(`🏁 ${nextRace.name} - ${nextRace.track}`)
        .setColor("#FF0000")
        .setFooter({ text: "MotoGP 2025 Schedule" })
        .setTimestamp();

    for (const [session, time] of Object.entries(nextRace.sessions)) {
        const sessionStart = moment(time);
        const sessionEnd = moment(time).add(1, "hours");
        const unixTime = Math.floor(sessionStart.valueOf() / 1000);
        const displayTime = `<t:${unixTime}:f>`;
        const emoji = sessionEmoji(session);
        const status = getSessionStatus(sessionStart, sessionEnd);

        embed.addFields({
            name: `${emoji} ${session}`,
            value: `${displayTime} | ${status}`,
            inline: false,
        });
    }

    return embed;
}

function clearMessageInterval(messageId) {
    const interval = activeIntervals.get(messageId);
    if (interval) {
        clearInterval(interval);
        activeIntervals.delete(messageId);
        console.log(`🧹 Cleared interval for message ${messageId}`);
    }
}

// ------------------- Command Handling -------------------
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // ---------- /next ----------
    if (interaction.commandName === "next") {
        const nextRace = getNextRace();
        if (!nextRace) {
            return interaction.reply("🎉 No upcoming races!");
        }

        await interaction.deferReply();
        const embed = createRaceEmbed(nextRace);
        const message = await interaction.editReply({ embeds: [embed] });

        // Clear any existing interval for this message
        clearMessageInterval(message.id);

        // Auto-update countdowns every 60 seconds
        const interval = setInterval(async () => {
            const now = moment();
            const hasFuture = Object.values(nextRace.sessions).some((t) =>
                moment(t).isAfter(now)
            );

            // Stop updating if all sessions finished
            if (!hasFuture) {
                clearMessageInterval(message.id);
                try {
                    await message.edit({ embeds: [createRaceEmbed(nextRace)] });
                } catch (err) {
                    console.error("Failed final update:", err.message);
                }
                return;
            }

            try {
                await message.edit({ embeds: [createRaceEmbed(nextRace)] });
            } catch (err) {
                clearMessageInterval(message.id);
                console.error("Stopped updating:", err.message);
            }
        }, 60000); // every minute

        activeIntervals.set(message.id, interval);
    }

    // ---------- /standings ----------
    if (interaction.commandName === "standings") {
        const type = interaction.options.getString("type");

        if (type === "riders") {
            const riders = data.riders;
            
            if (!riders || riders.length === 0) {
                return interaction.reply("❌ No rider data available.");
            }

            const embeds = [];
            const firstEmbed = new EmbedBuilder()
                .setTitle("🏆 Riders Championship Standings (1-15)")
                .setColor("#FFD700")
                .setFooter({ text: "MotoGP 2025 Championship" });

            riders.slice(0, 15).forEach((rider) => {
                firstEmbed.addFields({
                    name: `#${rider.rank} ${rider.name}`,
                    value: `Team: ${rider.team}\nPoints: ${rider.points}`,
                    inline: true,
                });
            });

            embeds.push(firstEmbed);

            if (riders.length > 15) {
                const secondEmbed = new EmbedBuilder()
                    .setTitle(`🏆 Riders Championship Standings (16-${riders.length})`)
                    .setColor("#FFD700")
                    .setFooter({ text: "MotoGP 2025 Championship" });

                riders.slice(15).forEach((rider) => {
                    secondEmbed.addFields({
                        name: `#${rider.rank} ${rider.name}`,
                        value: `Team: ${rider.team}\nPoints: ${rider.points}`,
                        inline: true,
                    });
                });

                embeds.push(secondEmbed);
            }

            return interaction.reply({ embeds });
            
        } else if (type === "constructors") {
            if (!data.constructors || data.constructors.length === 0) {
                return interaction.reply("❌ No constructor data available.");
            }

            const embed = new EmbedBuilder()
                .setTitle("🏎️ Constructors Championship Standings")
                .setColor("#FFD700")
                .setFooter({ text: "MotoGP 2025 Championship" });

            data.constructors.forEach((team, index) => {
                embed.addFields({
                    name: `#${index + 1} ${team.team}`,
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

// Clean up intervals on shutdown
process.on("SIGINT", () => {
    console.log("🛑 Shutting down gracefully...");
    activeIntervals.forEach((interval) => clearInterval(interval));
    activeIntervals.clear();
    client.destroy();
    process.exit(0);
});

client.login(process.env.TOKEN);
