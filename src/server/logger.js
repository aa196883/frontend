const { logLevel } = require('./config');

const levelWeights = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

const currentLevelWeight = levelWeights[logLevel] ?? levelWeights.info;

function log(level, message) {
    const normalizedLevel = levelWeights[level] !== undefined ? level : 'info';
    const shouldLog = levelWeights[normalizedLevel] <= currentLevelWeight;

    if (!shouldLog) {
        return;
    }

    const timestamp = new Date().toUTCString();
    const label = normalizedLevel.toUpperCase();
    console.log(`${timestamp} - ${label}: ${message}`);
}

module.exports = { log };
