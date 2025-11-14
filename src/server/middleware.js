const express = require('express');
const cors = require('cors');
const { enableCors } = require('./config');
const { log } = require('./logger');

function applyCoreMiddleware(app) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    if (enableCors) {
        app.use(cors());
        log('debug', 'CORS enabled for development environment.');
    }
}

function createErrorHandler() {
    return function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
        const status = Number.isInteger(err.status) ? err.status : 500;
        const isServerError = status >= 500;
        const message = err.message || 'Internal server error';
        const exposeMessage = err.expose || !isServerError;

        if (isServerError) {
            log('error', `${req.method} ${req.originalUrl} - ${message}`);
            if (err.stack) {
                log('debug', err.stack);
            }
        } else {
            log('warn', `${req.method} ${req.originalUrl} - ${message}`);
        }

        res.status(status).json({
            error: exposeMessage ? message : 'Internal server error',
        });
    };
}

module.exports = {
    applyCoreMiddleware,
    createErrorHandler,
};
