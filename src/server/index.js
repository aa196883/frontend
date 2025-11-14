const express = require('express');
const router = require('./router');
const { applyCoreMiddleware, createErrorHandler } = require('./middleware');

function createApp() {
    const app = express();
    applyCoreMiddleware(app);
    app.use(router);
    app.use(createErrorHandler());
    return app;
}

module.exports = { createApp };
