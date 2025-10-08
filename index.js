/**
 * @file Main file. Creates the express app.
 * @module index.js
 */

//============================= Init =============================//
const express = require('express');
const bodyParser = require('body-parser');

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const cors = require('cors'); // Import cors for development of vuejs frontend

const app = express();
const port = 3000;

require('dotenv').config()
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Configuration de Multer pour stocker temporairement les fichiers audio dans le dossier 'uploads'
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // Dossier de destination pour les fichiers uploadés
    },
    filename: function (req, file, cb) {
        // extension .wav, 
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(cors()); // Use CORS for development of vuejs frontend

//============================= Public folders =============================//
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', express.static(path.join(__dirname, 'assets', 'vuejs')));
app.use('/data', express.static(path.join(__dirname, 'assets', 'data')));


//============================= Functions =============================//
/**
 * Print the date and time, `level`, and `msg`.
 *
 * @param {string} level - the level of the log ('error', 'warn', 'info', ...) ;
 * @param {string} msg - the message to log.
 */
function log(level, msg) {
    console.log(`${(new Date().toUTCString())} - ${level}: ${msg}`);
}


//============================= Endpoints (get) =============================//
/**
 * This endpoint will return the list of collections from the database.
 *
 * GET
 *
 * @constant /collections-names
 */
app.get('/collections-names', async function (req, res) {
    log('info', `/collections-names: Fetching authors from the database ...`);

    fetch(`${API_BASE_URL}/collections-names`, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            if (data.error)
                return res.json({ error: data.error });

            return res.json(data);
        })
        .catch(error => {
            log('error', `/collections-names: ${error.message}`);
            return res.json({ error: error.message });
        });
});

/**
 * This endpoint returns the sources (MEI file names) of the scores contained in the given collection.
 *
 * URL data:
 *  - collection_name: the name of the collection.
 *
 * GET
 *
 * @constant /collection
 */
app.get('/collection/:collection_name', async function (req, res) {
    let collection_name = req.params.collection_name;

    log('info', `/collection: Fetching file names for collection "${collection_name}" ...`);

    fetch(`${API_BASE_URL}/collection/${collection_name}`, { method: 'GET' })
        .then(response => {
            if (!response.ok) {
                return res.status(response.status).json({ error: data.error || 'Flask returned an error' });
            }

            return response.json();
        })
        .then(data => {
            if (data.error)
                return res.json({ error: data.error });

            return res.json(data);
        })
        .catch(error => {
            log('error', `/collection: ${error.message}`);
            return res.json({ error: error.message });
        });
});


//============================= Pages (get) =============================//
// For any URL (apart the above ones), redirect to the vuejs application.
// This is needed because the vuejs app is _single page_, but it changes the
// URL (e.g adding /searchinterface) when the tab changes.

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'assets', 'vuejs', 'index.html'));
// });

// This is to only redirect for the right URLs.
const urls = ['/plus', '/references', '/collections', '/searchinterface'];
urls.forEach( (url) => {
    app.get(url, (req, res) => {
        res.sendFile(path.join(__dirname, 'assets', 'vuejs', 'index.html'));
    });
});


//============================= Endpoints (post) =============================//
/**
 * This endpoint receives the melody and search parameters and returns the associated (processed) results.
 *
 * It transmits the call to `/search-results` on the backend.
 *
 * Data to post :
 *     ```
 *     {
 *         'notes': str,
 *         'pitch_distance': float,
 *         'duration_factor': float,
 *         'duration_gap': float,
 *         'alpha': float,
 *         'allow_transposition': bool,
 *         'contour_match': bool,
 *         'collection': str
 *     }
 *     ```
 *
 *     Format of `notes`:
 *         - For a normal search: in the shape of ` "[([note1, ...], duration, dots), ...]"`, e.g `[(["c#/5", "d/5"], 4, 0), (["c/5"], 16, 0)]`.
 *         - For a contour search: TODO
 *
 *     If some parameters (apart `notes`) are not specified, they will take their default values.
 *
 * Returns:
 *     The results, in the following format: `{ 'results': r }`, where `r` has the following shape:
 *     ```
 *     [
 *         {
 *             'source': str,
 *             'number_of_occurrences': int,
 *             'max_match_degree': int,       (opt)
 *             'matches': [                   (opt)
 *                 {
 *                     'overall_degree': int,
 *                     'notes': [
 *                         {
 *                             'note_deg': int,
 *                             'pitch_deg': int,
 *                             'duration_deg': int,
 *                             'sequencing_deg': int,
 *                             'id': str
 *                         },
 *                         ...
 *                     ]
 *                 },
 *                 ...
 *             ]
 *         },
 *         ...
 *     ]
 *     ```
 *
 * POST
 *
 * @constant /search-results
 */
app.post('/search-results', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/search-results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();  // Receive { results: ... } or { error: ... }

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error || 'Flask returned an error' });
        }

        return res.json({results: JSON.parse(data.results)});  // Forward response to browser

    } catch (error) {
        console.error('/search-results failed:', error);
        return res.status(500).json({ error: 'Internal server error connecting to Flask API' });
    }
});

/**
 * This endpoint connects to the backend /convert-recording to convert the recording to notes.
 *
 * Data to post : the audio file.
 *
 * Returns the notes, in the following form: `{'notes': string}`
 *
 * POST
 *
 * @constant /convert-recording
 */
app.post('/convert-recording', upload.single('file'), async (req, res) => {
    try {
        console.log(req.file)

        const filePath = req.file.path;
        const formData = new FormData();
        const fileStream = fs.createReadStream(filePath);
        formData.append('file', fileStream);

        const response = await axios.post(`${API_BASE_URL}/convert-recording`, formData, {
            headers: formData.getHeaders()
        });

        const data = await response.data;  // Receive { notes: ... } or { error: ... }
        console.log(data)

        // Delete the local file
        fs.unlinkSync(filePath);

        if (response.status != 200) {
            return res.status(response.status).json({ error: data.error || 'Flask returned an error' });
        }
        log('info', '/convert-recording: Audio converted to notes.');
        return res.json(data);  // Forward response to browser

    } catch (error) {
        console.error('/convert-recording failed:', error);
        return res.status(500).json({ error: 'Internal server error connecting to Flask API' });
    }
});


//============================= Launch the server on the given port =============================//
app.listen(port, () => {
    log('info', `Server listening on port ${port}`)
})
