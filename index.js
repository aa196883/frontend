/**
 * @file Main file. Creates the express app.
 * @module index.js
 */

//============================= Init =============================//
const express = require('express');
const bodyParser = require('body-parser');

const multer  = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

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

app.use(express.static('assets'))
app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static('data'));
app.use('/data', express.static('data'));

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

    for (let k = 0 ; k < keywords.length ; ++k) {
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
 * @param {string} caller - the caller name (e.g '/fuzzy-query'). Used for logs ;
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

app.get("/", function(req,res){
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
    } catch(err) {
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
    } catch(err) {
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
 * This endpoint is called to get the score of a specific composer/author.
 *
 * GET
 *
 * @constant /getCollectionByAuthor
 */
app.get('/getCollectionByAuthor', async (req, res) => {
    let results = [];
    const name = req.query.author;

    try {
        const myQuery = "MATCH (s:Score) WHERE s.collection CONTAINS $name RETURN s ORDER BY s.source";
        authors = results.map(record => record['s']);
    } catch(err) {
        log('error', `/getCollectionByAuthor: ${err}`)
    }

    res.json({
        results: results,
        author: name,
    });
})

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
 * This endpoint makes a fuzzy query from notes, filters and fuzzy parameters.
 *
 * Data to post :
 *     ```
 *     {
 *         'notes': "[(class, octave, duration), ...]",
 *         'pitch_distance': float,
 *         'duration_factor': float,
 *         'duration_gap': float,
 *         'alpha': float,
 *         'allow_transposition': bool,
 *         'contour_match': bool,
 *         'collection': str
 *     }
 *     ```
 * If some parameters (apart `notes`) are not specified, they will take their default values.
 * 
 * Returns a fuzzy query, in the following form: `{'query': string}`
 *
 * POST
 *
 * @constant /fuzzy-query
 */
app.post('/fuzzy-query', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/generate-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();  // Receive { query: ... } or { error: ... }

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error || 'Flask returned an error' });
        }
        log('info', `/fuzzy-query: generated ${data.query}`);
        return res.json(data);  // Forward response to browser

    } catch (error) {
        console.error('/fuzzy-query failed:', error);
        return res.status(500).json({ error: 'Internal server error connecting to Flask API' });
    }
});


// Endpoint pour traiter l'audio et créer une requête
/** 
*
* @constant /createQueryFromAudio
*/
app.post('/createQueryFromAudio', upload.single('audio'), (req, res) => {
    // Get the params
    let pitch_distance = req.body.pitch_distance;
    let duration_factor = req.body.duration_factor;
    let duration_gap = req.body.duration_gap;
    let alpha = req.body.alpha;
    let allow_transposition = req.body.allow_transposition;
    let contour_match = req.body.contour_match;
    let collection = req.body.collection;

    // Set default values if some params are null
    if (pitch_distance == null)
        pitch_distance = 0;
    if (duration_factor == null)
        duration_factor = 1;
    if (duration_gap == null)
        duration_gap = 0;
    if (alpha == null)
        alpha = 0;
    if (allow_transposition == null)
        allow_transposition = false;
    if (contour_match == null)
        contour_match = false;

    // Create the connection
    log('info', `/fuzzy-query: openning connection.`);
    const { spawn } = require('child_process');
    let args = [
        'compilation_requete_fuzzy/audio_parser.py',
        '-p', pitch_distance,
        '-f', duration_factor,
        '-g', duration_gap,
        '-a', alpha,
    ];
    if (allow_transposition)
        args.push('-t');

    if (contour_match)
        args.push('-C');

    if (collection != null) {
        args.push('-c');
        args.push(collection);
    }
    let pyParserWrite = spawn('python3', args);

    // Get the data
    let allData = '';
    pyParserWrite.stdout.on('data', data => {
        log('info', `/fuzzy-query: received data (${data.length} bytes) from python script.`);
        allData += data.toString();
    });

    // log stderr
    let errors = [];
    pyParserWrite.stderr.on('data', data => {
        let e = handlePythonStdErr('/fuzzy-query', data);

        if (e != null)
            errors.push(e);
    });

    // Send the data to the client
    pyParserWrite.stdout.on('close', () => {
        log('info', `/fuzzy-query: connection closed.`);

        if (errors.length > 0)
            return res.json({ error: errors.slice(-1)[0] });

        return res.json({ query: allData });
    });
});

/**
 * This endpoint sends a fuzzy query and process its results.
 *
 * Data to post : `{'query': some_fuzzy_query, 'format': f}`, where f is 'json' or 'text'.
 *
 * Returns `{results: json[]}`
 *
 * POST
 *
 * @constant /fuzzy-query-results
 */
app.post('/fuzzy-query-results', async (req, res) => {
    const query = req.body.query;
    try {
        // Prevent DB edits
        if (queryEditsDB(query)) {
            log('info', `/fuzzy-query-results: Operation not allowed.`);
            return res.json({ error: 'Operation not allowed.' });
        }
        log('info', `/fuzzy-query-results: forwarding fuzzy query to Flask backend.`);

        const response = await fetch(`${API_BASE_URL}/execute-fuzzy-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: query,
                format: 'json'
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            return res.status(400).json({ error: data.error || 'Flask returned an error' });
        }

        // Format result like original logic
        return res.json({ results: data.results || '[]' });

    } catch (err) {
        console.error(`/fuzzy-query-results: error`, err);
        return res.status(500).json({ error: 'Internal server error contacting Flask' });
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
