const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const moment = require('moment-timezone');
const { getNextRace: getNextF1 } = require('./f1Service');
const { getNextMotoGPRace } = require('./motogpService');
const { createBaseEmbed } = require('../utils/embedUtils');

const SUBSCRIBERS_FILE = path.join(__dirname, '../data/subscribers.json');

// --- Data Management ---
function loadSubscribers() {
    try {
        if (!fs.existsSync(SUBSCRIBERS_FILE)) return [];
        const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading subscribers:", error);
        return [];
    }
}

function saveSubscribers(subscribers) {
    try {
        fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
    } catch (error) {
        console.error("Error saving subscribers:", error);
    }
}

function addSubscriber(userId) {
    const subs = loadSubscribers();
    if (!subs.includes(userId)) {
        subs.push(userId);
        saveSubscribers(subs);
        return true;
    }
    return false;
}

function removeSubscriber(userId) {
    const subs = loadSubscribers();
    const newSubs = subs.filter(id => id !== userId);
    if (newSubs.length !== subs.length) {
        saveSubscribers(newSubs);
        return true;
    }
    return false;
}

// --- Notification Logic ---
// We need to track sent notifications to avoid duplicates
const sentNotifications = new Set();

async function checkAndSendNotifications(client) {
    const now = moment();
    const subscribers = loadSubscribers();
    if (subscribers.length === 0) return;

    // 1. Check F1
    const f1Race = await getNextF1();
    if (f1Race) {
        await checkRaceSessions(client, subscribers, f1Race, 'F1');
    }

    // 2. Check MotoGP
    const motoRace = getNextMotoGPRace();
    if (motoRace) {
        // Normalize MotoGP object to match F1 structure slightly for the helper
        // MotoGP sessions are just key-value pairs in our JSON
        const sessions = [];
        for (const [name, timeStr] of Object.entries(motoRace.sessions)) {
            sessions.push({ name: name, time: moment(timeStr) });
        }

        for (const session of sessions) {
            await processSession(client, subscribers, session.name, session.time, motoRace.name, 'MotoGP');
        }
    }
}

async function checkRaceSessions(client, subscribers, race, series) {
    const sessions = [
        { name: "Qualifying", time: race.Qualifying ? moment(`${race.Qualifying.date}T${race.Qualifying.time}`) : null },
        { name: "Sprint", time: race.Sprint ? moment(`${race.Sprint.date}T${race.Sprint.time}`) : null },
        { name: "Race", time: moment(`${race.date}T${race.time}`) }
    ];

    for (const session of sessions) {
        if (session.time) {
            await processSession(client, subscribers, session.name, session.time, race.raceName, series);
        }
    }
}

async function processSession(client, subscribers, sessionName, sessionTime, raceName, series) {
    const now = moment();
    const diffMinutes = sessionTime.diff(now, 'minutes');
    const notificationId = `${series}-${raceName}-${sessionName}`;

    // Notify if 60 minutes away (window of 55-65 mins) and not sent yet
    if (diffMinutes >= 55 && diffMinutes <= 65 && !sentNotifications.has(notificationId)) {
        console.log(`Sending notification for ${notificationId}`);
        sentNotifications.add(notificationId);

        // Clear old IDs from set to prevent memory leak (simple logic: clear if > 100 items)
        if (sentNotifications.size > 100) sentNotifications.clear();

        const embed = createBaseEmbed(`⏰ Upcoming ${series} Session`)
            .setColor(series === 'F1' ? '#FF1801' : '#000000')
            .setDescription(`**${raceName} - ${sessionName}** starts in **1 hour**!`)
            .addFields({ name: "Start Time", value: `<t:${sessionTime.unix()}:F> (<t:${sessionTime.unix()}:R>)` });

        for (const userId of subscribers) {
            try {
                const user = await client.users.fetch(userId);
                if (user) {
                    await user.send({ embeds: [embed] });
                }
            } catch (error) {
                console.error(`Failed to send DM to ${userId}:`, error.message);
            }
        }
    }
}

function startScheduler(client) {
    // Run every 5 minutes
    schedule.scheduleJob('*/5 * * * *', () => {
        checkAndSendNotifications(client);
    });
    console.log("📅 Notification scheduler started.");
}

module.exports = {
    addSubscriber,
    removeSubscriber,
    startScheduler
};
