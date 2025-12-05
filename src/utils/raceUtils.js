const moment = require("moment-timezone");
const data = require("../data/races.json");

function getNextRace() {
    const now = moment();
    // Find the first race where at least one session is in the future
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

module.exports = {
    getNextRace,
    sessionEmoji,
    getSessionStatus
};
