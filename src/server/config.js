const dotenv = require('dotenv');

dotenv.config();

const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'development';
const isProduction = env === 'production';
const port = Number.parseInt(process.env.PORT, 10) || 3000;
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5000';

const corsEnv = process.env.ENABLE_CORS;
const enableCors = typeof corsEnv === 'string'
    ? corsEnv.toLowerCase() === 'true'
    : !isProduction;

const validLogLevels = ['error', 'warn', 'info', 'debug'];
const defaultLogLevel = isProduction ? 'warn' : 'info';
const envLogLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toLowerCase() : defaultLogLevel;
const logLevel = validLogLevels.includes(envLogLevel) ? envLogLevel : defaultLogLevel;

module.exports = {
    env,
    isProduction,
    port,
    apiBaseUrl,
    enableCors,
    logLevel,
};
