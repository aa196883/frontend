const express = require('express');
const multer = require('multer');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { apiBaseUrl } = require('./config');
const { log } = require('./logger');

const router = express.Router();

const storage = multer.diskStorage({
    destination: function destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function filename(req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

const vueAppPath = path.resolve(__dirname, '../../assets/vuejs');
const dataPath = path.resolve(__dirname, '../../assets/data');

router.use('/', express.static(vueAppPath));
router.use('/data', express.static(dataPath));

function buildBackendError(responseStatus, message) {
    const error = new Error(message || 'Flask returned an error');
    error.status = responseStatus;
    error.expose = responseStatus < 500;
    return error;
}

async function parseJsonResponse(response) {
    try {
        return await response.json();
    } catch (err) {
        log('warn', `Failed to parse JSON response from ${response.url}: ${err.message}`);
        return {};
    }
}

router.get('/collections-names', async (req, res, next) => {
    try {
        log('info', '/collections-names: Fetching authors from the database ...');
        const response = await fetch(`${apiBaseUrl}/collections-names`, { method: 'GET' });
        const data = await parseJsonResponse(response);

        if (!response.ok) {
            throw buildBackendError(response.status, data.error);
        }

        res.json(data);
    } catch (error) {
        next(error);
    }
});

router.get('/collection/:collection_name', async (req, res, next) => {
    const collectionName = req.params.collection_name;
    try {
        log('info', `/collection: Fetching file names for collection "${collectionName}" ...`);
        const response = await fetch(`${apiBaseUrl}/collection/${collectionName}`, { method: 'GET' });
        const data = await parseJsonResponse(response);

        if (!response.ok) {
            throw buildBackendError(response.status, data.error);
        }

        res.json(data);
    } catch (error) {
        next(error);
    }
});

const vueRoutes = ['/plus', '/references', '/collections', '/searchinterface'];
vueRoutes.forEach((url) => {
    router.get(url, (req, res, next) => {
        res.sendFile(path.join(vueAppPath, 'index.html'), (err) => {
            if (err) {
                next(err);
            }
        });
    });
});

router.post('/search-results', async (req, res, next) => {
    try {
        const response = await fetch(`${apiBaseUrl}/search-results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });

        const data = await parseJsonResponse(response);

        if (!response.ok) {
            throw buildBackendError(response.status, data.error);
        }

        const results = typeof data.results === 'string' ? JSON.parse(data.results) : data.results;
        res.json({ results });
    } catch (error) {
        next(error);
    }
});

router.post('/convert-recording', upload.single('file'), async (req, res, next) => {
    const filePath = req.file ? req.file.path : null;

    try {
        if (!req.file) {
            const error = new Error('A file must be provided for conversion.');
            error.status = 400;
            error.expose = true;
            throw error;
        }

        const formData = new FormData();
        const fileStream = fs.createReadStream(filePath);
        formData.append('file', fileStream);

        let response;
        try {
            response = await axios.post(`${apiBaseUrl}/convert-recording`, formData, {
                headers: formData.getHeaders(),
            });
        } catch (axiosError) {
            if (axiosError.response) {
                throw buildBackendError(axiosError.response.status, axiosError.response.data?.error);
            }

            throw axiosError;
        }

        const data = response.data;

        if (response.status !== 200) {
            throw buildBackendError(response.status, data?.error);
        }

        log('info', '/convert-recording: Audio converted to notes.');
        res.json(data);
    } catch (error) {
        next(error);
    } finally {
        if (filePath) {
            fsPromises.unlink(filePath).catch((unlinkError) => {
                log('warn', `Failed to remove temporary upload ${filePath}: ${unlinkError.message}`);
            });
        }
    }
});

module.exports = router;
