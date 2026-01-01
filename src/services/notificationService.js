const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { getNextRace: getNextF1 } = require('./f1Service');
const { getNextMotoGPRace } = require('./motogpService');
const { getNextF3Race } = require('./f3Service');

const SUBSCRIBERS_FILE = path.join(__dirname, '../data/subscribers.json');

// Helper to read subscribers
function getSubscribers() {
    try {
        if (!fs.existsSync(SUBSCRIBERS_FILE)) return [];
        const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
        return JSON.parse(data).users || [];
    } catch (e) {
        console.error("Error reading subscribers:", e);
        return [];
    }
}

// Helper to write subscribers
function saveSubscribers(users) {
    try {
        fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify({ users }, null, 4));
    } catch (e) {
        console.error("Error saving subscribers:", e);
    }
}

function addSubscriber(userId) {
    const users = getSubscribers();
    if (!users.includes(userId)) {
        users.push(userId);
        saveSubscribers(users);
        return true;
    }
    return false;
}

function removeSubscriber(userId) {
    const users = getSubscribers();
    const newUsers = users.filter(id => id !== userId);
    if (newUsers.length !== users.length) {
        saveSubscribers(newUsers);
        return true;
    }
    return false;
}

// Track notified sessions to avoid spamming (simple memory cache, resets on restart)
const notifiedSessions = new Set();
// Key format: "series_round_session"

function startScheduler(client) {
    console.log("Starting Notification Scheduler...");

    // Check every minute
    setInterval(async () => {
        await checkAndNotify(client);
    }, 60 * 1000);
}

async function checkAndNotify(client) {
    // 1. Get Next Races
    const f1Next = await getNextF1();
    const motoNext = getNextMotoGPRace();
    const f3Next = getNextF3Race();

    const races = [
        { series: 'F1', data: f1Next },
        { series: 'MotoGP', data: motoNext },
        { series: 'F3', data: f3Next }
    ];

    const now = moment();

    for (const { series, data } of races) {
        if (!data) continue;

        // Determine sessions to check
        // F1: data.FirstPractice, .Qualifying, etc.
        // MotoGP: data.sessions (Race, Sprint, etc.)
        // F3: data.sessions (Feature, Sprint)

        let sessions = [];
        if (series === 'F1') {
            if (data.FirstPractice) sessions.push({ name: 'Free Practice 1', time: `${data.FirstPractice.date}T${data.FirstPractice.time}` });
            if (data.Qualifying) sessions.push({ name: 'Qualifying', time: `${data.Qualifying.date}T${data.Qualifying.time}` });
            if (data.Sprint) sessions.push({ name: 'Sprint', time: `${data.Sprint.date}T${data.Sprint.time}` });
            if (data.date && data.time) sessions.push({ name: 'Race', time: `${data.date}T${data.time}` });
        } else if (series === 'MotoGP') {
            // data.sessions is an object like { "Race": "...", "Sprint": "..." }
            if (data.sessions) {
                Object.entries(data.sessions).forEach(([name, isoDate]) => {
                    sessions.push({ name, time: isoDate });
                });
            }
        } else if (series === 'F3') {
            if (data.sessions) {
                Object.entries(data.sessions).forEach(([name, isoDate]) => {
                    sessions.push({ name, time: isoDate });
                });
            }
        }

        for (const session of sessions) {
            const time = moment(session.time); // Assumes UTC ISO or similar
            if (!time.isValid()) continue;

            const diffMinutes = time.diff(now, 'minutes');
            const roundId = data.round || data.name; // Unique ID for session
            const notificationKey = `${series}_${roundId}_${session.name}`;

            // Notify if exactly 60 minutes left (+/- 1 min buffer) or whatever logic.
            // Better: Notify if between 59 and 61 minutes left AND haven't notified yet.
            if (diffMinutes >= 59 && diffMinutes <= 61 && !notifiedSessions.has(notificationKey)) {

                // SEND NOTIFICATIONS
                const subscribers = getSubscribers();
                console.log(`Sending alerts for ${notificationKey} to ${subscribers.length} users.`);

                // Add to notified set immediately
                notifiedSessions.add(notificationKey);

                const message = `🔔 **${series} Alert!**\n**${data.name || data.raceName} - ${session.name}** starts in **1 hour**! (<t:${time.unix()}:R>)`;

                for (const userId of subscribers) {
                    try {
                        const user = await client.users.fetch(userId);
                        if (user) await user.send(message);
                    } catch (err) {
                        console.error(`Failed to DM user ${userId}:`, err.message);
                        if (err.code === 50007) { // Cannot send messages to this user
                            // Optionally remove them? No, maybe temporary.
                        }
                    }
                }
            }
        }
    }
}

module.exports = {
    addSubscriber,
    removeSubscriber,
    startScheduler
};
