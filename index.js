const { createApp } = require('./src/server');
const { port } = require('./src/server/config');
const { log } = require('./src/server/logger');

const app = createApp();

app.listen(port, () => {
    log('info', `Server listening on port ${port}`);
});
