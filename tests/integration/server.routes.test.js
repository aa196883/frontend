const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const multer = require('multer');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { request } = require('../helpers/supertest');

async function startServer(app) {
    return new Promise((resolve) => {
        const server = http.createServer(app);
        server.listen(0, () => resolve(server));
    });
}

describe('SKRID proxy routes', () => {
    let backendServer;
    let supertestClient;
    let tempDir;
    let lastSearchRequest;

    before(async () => {
        const backendApp = express();
        backendApp.use(express.json());
        const upload = multer();

        const collections = ['bach', 'mozart'];
        const files = ['fugue.musicxml', 'suite.musicxml'];
        backendApp.get('/collections-names', (req, res) => {
            res.json({ collections });
        });

        backendApp.get('/collection/:name', (req, res) => {
            if (req.params.name === 'unknown') {
                res.status(404).json({ error: 'Collection not found' });
                return;
            }

            res.json({ files });
        });

        backendApp.post('/search-results', (req, res) => {
            lastSearchRequest = req.body;

            if (!req.body || (typeof req.body.query !== 'string' && !req.body.notes)) {
                res.status(422).json({ error: 'Query or notes are required' });
                return;
            }

            res.json({ results: JSON.stringify([{ id: 1, title: 'Invention' }]) });
        });

        backendApp.post('/convert-recording', upload.single('file'), (req, res) => {
            if (!req.file) {
                res.status(400).json({ error: 'File is required' });
                return;
            }

            if (req.file.originalname === 'bad-input.wav') {
                res.status(502).json({ error: 'Conversion failed' });
                return;
            }

            res.json({ notes: ['C4', 'E4', 'G4'] });
        });

        backendServer = await startServer(backendApp);
        const port = backendServer.address().port;
        process.env.API_BASE_URL = `http://127.0.0.1:${port}`;

        // Reset cached modules that depend on configuration
        Object.keys(require.cache)
            .filter((key) => key.includes(`${path.sep}src${path.sep}server`))
            .forEach((key) => delete require.cache[key]);

        const { createApp } = require('../../src/server');
        const app = createApp();
        supertestClient = request(app);
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skrid-tests-'));
        fs.mkdirSync('uploads', { recursive: true });
    });

    after(async () => {
        if (backendServer) {
            await new Promise((resolve) => backendServer.close(resolve));
        }
        if (tempDir) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        delete process.env.API_BASE_URL;
    });

    it('returns collection names from the backend', async () => {
        const response = await supertestClient.get('/collections-names').expectStatus(200);
        assert.deepEqual(response.body, { collections: ['bach', 'mozart'] });
    });

    it('returns file names for a collection', async () => {
        const response = await supertestClient.get('/collection/bach').expectStatus(200);
        assert.deepEqual(response.body, { files: ['fugue.musicxml', 'suite.musicxml'] });
    });

    it('propagates backend errors for missing collections', async () => {
        const error = await supertestClient.get('/collection/unknown').expectStatus(404);
        assert.equal(error.body.error, 'Collection not found');
    });

    it('parses stringified search results', async () => {
        const response = await supertestClient
            .post('/search-results')
            .send({ query: 'fugue' })
            .expectStatus(200);
        assert.deepEqual(response.body, { results: [{ id: 1, title: 'Invention' }] });
    });

    it('propagates backend search validation errors', async () => {
        const response = await supertestClient.post('/search-results').send({}).expectStatus(422);
        assert.equal(response.body.error, 'Query or notes are required');
    });

    it('normalises polyphonic voice payloads before proxying to the backend', async () => {
        const polyphonicRequest = {
            voices: [
                {
                    notes: "[(['c/4'], 4, 0)]",
                    pitch_distance: '0.5',
                    duration_factor: '1.25',
                    duration_gap: 0,
                    allow_transposition: 'true',
                    allow_homothety: false,
                    mode: 'ionian',
                },
                {
                    notes: [['d/4'], 8, 0],
                    allow_transposition: 0,
                    allow_homothety: 1,
                },
            ],
            shared: {
                alpha: '0.35',
                incipit_only: 'false',
                collection: 'bach',
            },
        };

        await supertestClient.post('/search-results').send(polyphonicRequest).expectStatus(200);

        assert.deepEqual(lastSearchRequest, {
            notes: ["[(['c/4'], 4, 0)]", '[["d/4"],8,0]'],
            pitch_distance: [0.5, 0],
            duration_factor: [1.25, 1],
            duration_gap: [0, 0],
            allow_transposition: [true, false],
            allow_homothety: [false, true],
            mode: ['ionian', ''],
            alpha: 0.35,
            incipit_only: false,
            collection: 'bach',
        });
    });

    it('rejects polyphonic payloads with more than four voices', async () => {
        const response = await supertestClient
            .post('/search-results')
            .send({
                voices: [
                    { notes: 'voice-1' },
                    { notes: 'voice-2' },
                    { notes: 'voice-3' },
                    { notes: 'voice-4' },
                    { notes: 'voice-5' },
                ],
            })
            .expectStatus(422);

        assert.equal(response.body.error, 'A maximum of 4 voices is supported.');
    });

    it('converts uploaded recordings via the backend', async () => {
        const tempFile = path.join(tempDir, 'input.wav');
        fs.writeFileSync(tempFile, 'fake wav data');
        const response = await supertestClient
            .post('/convert-recording')
            .attach('file', tempFile)
            .expectStatus(200);
        assert.deepEqual(response.body, { notes: ['C4', 'E4', 'G4'] });
    });

    it('rejects conversion when no file is provided', async () => {
        const response = await supertestClient.post('/convert-recording').expectStatus(400);
        assert.equal(response.body.error, 'A file must be provided for conversion.');
    });

    it('propagates backend conversion failures', async () => {
        const badFile = path.join(tempDir, 'bad-input.wav');
        fs.writeFileSync(badFile, 'fake wav data');
        const response = await supertestClient
            .post('/convert-recording')
            .attach('file', badFile)
            .expectStatus(502);
        assert.equal(response.body.error, 'Internal server error');
    });
});
