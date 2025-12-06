const data = require("../data/f3-data.json");
const moment = require("moment-timezone");

function getNextF3Race() {
    const now = moment();
    // Find first race where Feature race is after now
    return data.races.find(race => moment(race.sessions.Feature).isAfter(now)) || null;
}

function getF3Calendar() {
    return data.races;
}

function getF3Standings(type = 'drivers') {
    if (type === 'drivers') return data.drivers;
    if (type === 'teams') return data.teams;
    return [];
}

function getF3RaceResult(round) {
    // If results key exists and matches the round
    if (data.results && data.results[round]) {
        return data.results[round];
    }
    return null;
}

module.exports = {
    getNextF3Race,
    getF3Calendar,
    getF3Standings,
    getF3RaceResult
};
