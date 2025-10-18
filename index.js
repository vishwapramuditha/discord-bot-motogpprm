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
        return "⏳ Upcoming";
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

// ------------------- Command Handling -------------------
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // ---------- /next ----------
    if (interaction.commandName === "next") {
        const nextRace = getNextRace();
        if (!nextRace) {
            return interaction.reply("🎉 No upcoming races!");
        }

        const embed = createRaceEmbed(nextRace);
        return interaction.reply({ embeds: [embed] });
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

client.login(process.env.TOKEN);
