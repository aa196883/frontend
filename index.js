/**
 * @file Main file. Creates the express app.
 * @module index.js
 */

//============================= Init =============================//
const express = require('express');
const bodyParser = require('body-parser');

const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const cors = require('cors'); // Import cors for development of vuejs frontend

const app = express();
const port = 3000;

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const BASE_PATH = process.env.BASE_PATH || '';

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

//setting view engine to ejs
app.set("view engine", "ejs");

app.use(cors()); // Use CORS for development of vuejs frontend

//============================= Public folders =============================//
app.use(express.static(path.join(__dirname, 'assets')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/data', express.static(path.join(__dirname, 'data')));

app.use(express.static(path.join(__dirname, 'assets/public/'))); // Everything in this folder will be available through the web
// Rendre le préfixe disponible dans tous les templates EJS
app.use((req, res, next) => {
    res.locals.BASE_PATH = BASE_PATH;
    next();
});


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

/**
 * Check if the query contain some keywords that modify the database.
 *
 * @param {string} query - the cypher query
 * @returns {boolean} true if query would modify the database, false otherwise.
 */
function queryEditsDB(query) {
    let keywords = ['create', 'delete', 'set', 'remove', 'detach', 'load'];
    let queryLower = query.toLowerCase();

    for (let k = 0; k < keywords.length; ++k) {
        if (queryLower.includes(keywords[k])) {
            log('info', `query contains "${keywords[k].toUpperCase()}" keyword. Aborting it.`);
            return true;
        }
    }

    return false;
}

/**
 * Logs the error and return a string corresponding to the problem (string that will be shown to the client).
 *
 * @param {string} caller - the caller name (e.g '/search-results'). Used for logs ;
 * @param {*} data - the error data.
 */
function handlePythonStdErr(caller, data) {
    let errorString = data.toString();

    if (!(errorString.includes('site-packages/pydub/utils.py:') && errorString.includes(' SyntaxWarning: invalid escape sequence'))) {
        log('error', `${caller}: received data on stderr from python script: "${data}"`);

        // Database not turned on
        if (errorString.includes('neo4j.exceptions.ServiceUnavailable: Unable to retrieve routing information'))
            return 'Not connected to the database !\nPlease contact the administrator.';

        if (errorString.includes('neo4j.exceptions.AuthError') && errorString.includes('Neo.ClientError.Security.Unauthorized'))
            return 'Wrong database password !\nPlease contact the administrator.';

        return errorString;
    }
}

async function queryDB(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/execute-crisp-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data.results;
    } catch (err) {
        console.error('[queryDB] Error:', err.message);
        throw err;
    }
}

//============================= Images =============================//
app.use(express.static('assets/public/')); // Everything in this folder will be available through the web

//============================= Pages (get) =============================//

app.get('/scripts/config.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    res.send(`
        const BASE_PATH = '${BASE_PATH}';
        const API_BASE_URL = '${API_BASE_URL}';
    `);
});

app.get("/", function (req, res) {
    res.render("home");
});

/**
 * Route for the plus page.
 *
 * GET
 *
 * @constant /plus
 */
app.get("/plus", function (req, res) {
    res.render("plus");
});

/**
 * Route for the references page.
 *
 * GET
 *
 * @constant /references
 */
app.get("/references", function (req, res) {
    res.render("references");
});


/**
 * Route for the research page with the piano interface.
 *
 * GET
 *
 * @constant /searchInterface
 */
app.get('/searchInterface', async function (req, res) {
    let authors = [];

    try {
        // The query to get the authors is necessary to display the list of possible collections
        const authorQuery = "MATCH (s:Score) RETURN DISTINCT s.collection";
        const results = await queryDB(authorQuery);
        authors = results.map(record => record['s.collection']);
    } catch (err) {
        log('error', `/searchInterface: ${err}`)
    }

    res.render("search_interface", {
        authors: authors
    });
});

/**
 * Route for the contour search page.
 *
 * GET
 *
 * @constant /contourSearchInterface
 */
app.get('/contourSearchInterface', async function (req, res) {
    let authors = [];

    try {
        // The query to get the authors is necessary to display the list of possible collections
        const authorQuery = "MATCH (s:Score) RETURN DISTINCT s.collection";
        const results = await queryDB(authorQuery);
        authors = results.map(record => record['s.collection']);
    } catch (err) {
        log('error', `/contourSearchInterface: ${err}`)
    }

    res.render("contour_search_interface", {
        authors: authors
    });
});

/**
 * Route for the research page with the microphone interface.
 *
 * GET
 *
 * @constant /fuzzy-query-from-microphone
 */
app.get('/fuzzy-query-from-microphone', async function (req, res) {
    let authors = [];

    try {
        // The query to get the authors is necessary to display the list of possible collections
        const authorQuery = "MATCH (s:Score) RETURN DISTINCT s.collection";
        const authorResponse = await queryDB(authorQuery);
        authors = authorResponse.map(record => record['s.collection']);
    } catch(err) {
        log('error', `/fuzzy-query-from-microphone: ${err}`)
    }

    res.render("formulateQueryFromMicrophone", {
        authors: authors
    });
});

/**
 * Route for help page
 * 
 * GET
 *
 * @constant /help
 */
app.get("/help", function (req, res) {
    res.render("help");
});

/**
 * This endpoint will redirect the user to the 'collections' page .
 * Before redirecting, it queries the database in order to get the list of collections.
 *
 * GET
 *
 * @constant /collections
 */
app.get('/collections', async function (req, res) {
    let authors = [];

    try {
        const results = await queryDB("MATCH (s:Score) RETURN DISTINCT s.collection");
        authors = results.map(record => record['s.collection']);
    } catch (err) {
        log('error', `/collections: ${err.message}`);
    }

    res.render("collections", {
        authors: authors,
    });
});

/**
 * Route for the result page.
 *
 * GET
 *
 * @constant /result
 */
app.get('/result', (req, res) => {
    res.render("result");
});

/**
 * This endpoint will search for all the scores containing in the title the string inserted by the user in the search bar.
 *
 * Note: not currently used (seems that it was used with a text search bar at the top of the piano interface page).
 *
 * GET
 *
 * @constant /search
 * @todo this seems to be a duplicate of /searchInterface
 */
app.get('/search', async function (req, res) { //TODO: remove this endpoint as it is not used?
    const searchTerm = req.query.query;
    let results = [];
    let authors = [];

    try {
        const resultQuery = "MATCH (s:Score) WHERE s.source CONTAINS $query RETURN s ORDER BY s.source DESC";
        const resultParams = { query: searchTerm };
        const resultResponse = await queryDB(resultQuery, resultParams);
        results = resultResponse;

        const authorQuery = "MATCH (s:Score) RETURN DISTINCT s.collection";
        const authorResponse = await queryDB(authorQuery);
        authors = authorResponse.map(record => record.collection);

    } catch (err) {
        log('error', `/search: ${err.message}`);
    }

    res.render("search_interface", {
        results: results,
        authors: authors,
    });
});

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

    fetch(`${API_BASE_URL}/collections-names`, {
        method: 'GET',
    })
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


//============================= Endpoints (post) =============================//
/**
 * This endpoint sends the query to the database (if it does not modify the database) and send the result back to the client.
 *
 * POST
 *
 * @constant /crisp-query-results
 */
app.post('/crisp-query-results', (req, res) => { //TODO: remove this endpoint, call the backend instead when needed, or even better: make new endpoints on the backend (to get)
    const query = req.body.query;

    if (queryEditsDB(query)) {
        return res.json({ error: 'Operation not allowed.' });
    }

    log('info', `/crisp-query-results: forwarding query to Flask backend`);

    fetch(`${API_BASE_URL}/execute-crisp-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: query
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error)
                return res.json({ error: data.error });

            return res.json({ results: data.results });
        })
        .catch(error => {
            log('error', `/crisp-query-results: ${error.message}`);
            return res.json({ error: error.message });
        });
});

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

app.listen(port, () => {
    log('info', `Server listening on port ${port}`)
})
