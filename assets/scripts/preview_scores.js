/**
 * @file Manage the creation of previews for the scores.
 * @module preview_scores
 */
//========= Imports =========//
import { ensureTkInitialized, loadPageN, tk } from './paginated_results.js';

/** The maximum length for urls. */
const max_url_length = 16000;

/**
 * Extract the notes from a query using regular expressions.
 *
 * @returns {string} the notes in the format described in {@linkcode makeUrl}
 */
function extractMelodyFromQuery(query) {
    const re = /\{class:'(\w+|None)', octave:(\d+|None), dur:(\d+\.\d+|\d+|None)\}\)/g;
    const re_matches = [...query.matchAll(re)];

    let pattern = '';

    re_matches.forEach(m => {
        pattern += m[1] + '/' + m[2] + '_' + m[3] + ',';
    });

    pattern = pattern.slice(0, -1); // Remove trailing ','.

    return pattern;
}

/**
 * Try to retreive `source` and `collection` from `result`
 *
 * @param {*} result - the json object.
 *
 * @returns \{source: `source`, collection: `collection`\}
 */
function getSourceAndCollection(result) {
    let res = {};
    try {
        if (result.s && result.s.source && result.s.collection) {
            const prop = result.s;
            res.source = prop.source;
            res.collection = prop.collection;
        }
        else {
            console.warn("Strange structure in getSourceAndCollection");
            res.source = null;
            res.collection = null;
        }
    } catch (e) {
        console.error("Error in getSourceAndCollection:", e);
        res.source = null;
        res.collection = null;
    }
    return res;
}

/**
 * Make the url for the previews.
 *
 * It ensures that the url is not longer than `max_url_length` (and removes complete matches).
 * As the matches are ordered, it removes the last ones, which are the less acurate ones.
 *
 * Format of the url :
 * ```
 * /result?author=[collection]&score_name=[score name]
 * &pattern=[searched pattern]
 * &matches=[matches]
 * ```
 *
 * The searched pattern is encoded in the following format: `[class]/[octave]_[duration],...`, e.g `c/5_4,b/4_8,bs/4_8,g/4_8,a/4_8`.
 *
 * The matches are encoded in the following format: `[match 1]:[match 2]:...:[match m]`,
 * where `[match k]` is encoded in the following format: `[note 1];[note 2];...;[note n]`,
 * where `[note i]` is encoded in the following format:
 * ```
 * [id],[overall degree],[pitch degree],[duration degree],[sequencing degree]
 * ```
 *
 * e.g :
 * ```
 * abcdef,100,100,100,100;...;abcdeh,100,100,100,100:...
 * ```
 *
 * @param {string} collection - the name of the collection to which the score belongs ;
 * @param {string} source - the filename of the score ;
 * @param {string|null} [pattern=null] - the search pattern, given in the format described above ;
 * @param {json[][]|null} [matches=null] - an array of matches. A Match is an array of json elements.
 */
function makeUrl(collection, source, pattern=null, matches=null) {
    let url = `${BASE_PATH}`+'/result?author='+ collection +'&score_name=' + source;

    if (pattern != '') {
        url += `&pattern=${pattern}`;
    }
    if (matches != null) {
        url += '&matches=';

        for (let i = 0 ; i < matches.length ; ++i) {
            let url_match = '';
            for (let j = 0 ; j < matches[i].notes.length ; ++j) {
                // Get note data and convert to an int in [0 ; 100]
                let deg = Math.floor(100 * matches[i].notes[j].note_deg);
                let pitch_deg = Math.floor(100 * matches[i].notes[j].pitch_deg);
                let duration_deg = Math.floor(100 * matches[i].notes[j].duration_deg);
                let sequencing_deg = Math.floor(100 * matches[i].notes[j].sequencing_deg);

                // Add note to `url_match`
                url_match += `${matches[i].notes[j].id},${deg},${pitch_deg},${duration_deg},${sequencing_deg}`;
                
                let membership_functions_degrees = matches[i].notes[j].membership_functions_degrees
                if(membership_functions_degrees) {
                    url_match += `,${membership_functions_degrees}`;
                }
                // Separate notes with ';'
                if (j < matches[i].notes.length - 1)
                    url_match += ';';
            }

            // Add the match to the url only if it does not make it too long
            if (url.length + url_match.length < max_url_length) {
                url += url_match + ':';
            }
        }

        // Remove last ':'
        url = url.slice(0, -1);
    }

    return url;
}

/**
 * Create html <a> for the given score.
 *
 * @param {string} url                 - the link that will be used when the user clicks on the preview ;
 * @param {string} source              - the filename of the score ;
 * @param {number} [nb_occ=null]       - if not `null`, display the number of occurrences below the score name ;
 * @param {null} [overall_degree=null] - if not `null`, display the overall degree of the match below the score name (or nb of occurrences).
 *
 * @returns a html \<a\> element containing all the above information.
 */
function createPreview(url, source, nb_occ=null, overall_degree=null) {
    // Main element (link)
    const a = document.createElement('a');
    a.className = 'score-preview';
    a.href = url;
    a.target = '_blank'; // open link in a new tab ;
    a.rel = 'noopener noreferrer'; // recommended security measure (see https://stackoverflow.com/a/15551842)

    // Main div (in the link)
    const score_box = document.createElement('div');
    score_box.className = 'music-score-box';
    score_box.id = source;
    a.append(score_box);

    // Score title
    const h3 = document.createElement('h3');
    h3.className = "score_title";
    h3.textContent = source.slice(0, -4).replaceAll('_', ' ');

    // Number of occurrences
    if (nb_occ != null) {
        const occurrences = document.createElement('p');
        occurrences.className = "score_author";
        occurrences.textContent = 'Occurrences : ' + nb_occ;
        a.append(occurrences);
    }

    // Overall degree
    if (overall_degree != null) {
        const overall_degree_p = document.createElement('p');
        overall_degree_p.className = "score_author";
        if (overall_degree < 0.01){
            overall_degree_p.textContent = `Satisfaction < 1%`;
        } else {
            overall_degree_p.textContent = `Satisfaction : ${Math.floor(100 * overall_degree)}%`;
        }
        
        a.append(overall_degree_p);
    }

    a.append(h3);
    return a;
}

/**
 * Uses verovio to generate a svg preview of the score (first page) and set it into `score_div`.
 *
 * @param {HTMLElement} score_div        - the html element that will contain the svg preview ;
 * @param {string} score_path            - the (relative) path to the score (`./data/[collection name]/[score name]`) ;
 * @param {json[][]|null} [matches=null] - an array of matches. A Match is an array of json elements.
 * @param {number} [parentWidth=180]     - the width of the parent (used to calculate the width of the svg) ;
 * @param {number} [parentHeight=250]    - the height of the parent (used to calculate the height of the svg) ;
 * @param {number} [zoom=20]             - the zoom for the svg ;
 */
async function fillPreview(score_div, score_path, matches=null, parentWidth=180, parentHeight=250, zoom=20) {
    let pageHeight = parentHeight * 100 / zoom;
    let pageWidth = parentWidth * 100 / zoom;

    let options = {
        pageHeight: pageHeight,
        pageWidth: pageWidth,
        scale: zoom,
    };

    await ensureTkInitialized();
    tk.setOptions(options);

    fetch(score_path)
    .then( (response) => response.text() )
    .then( (meiXML) => {
        tk.loadData(meiXML);
        let svg = tk.renderToSVG(1); // render the first page
        score_div.innerHTML = svg;

        // Then highlight each match
        if (matches != null) {
            for (let match_nb = matches.length - 1 ; match_nb >= 0 ; --match_nb) { // Reverse order to get the best color in last 'layer'
                for (let k = 0 ; k < matches[match_nb].length ; ++k) {
                    const id = matches[match_nb][k].note.id;
                    const deg = Math.floor(100 * matches[match_nb][k].note_deg);

                    const parent_note = document.getElementById(id);
                    let col = getGradientColor(deg / 100);

                    if (parent_note != null) {
                        const notes = parent_note.getElementsByClassName('notehead');

                        for (let k = 0 ; k < notes.length ; ++k)
                            notes[k].setAttribute('fill', col);
                    }
                }
            }
        }
    })
    .catch (err => {
        console.error('fill_preview: fetch(): error: ' + err);
    })
}

/**
 * Return a color between `fromColor` and `toColor`, at `percent`%
 *
 * @param {json} fromColor - the origin color (0%). Format : {r: [nb], g: [nb], b: [nb]}, with 0 <= nb < 256 ;
 * @param {json} toColor - the destination color (100%). Format : {r: [nb], g: [nb], b: [nb]} ;
 * @param {number} percent - the percentage.
 *
 * @returns {string} an RGB string.
 */
function interpolateBetweenColors(fromColor, toColor, percent) {
    const delta = percent / 100;
    const r = Math.round(toColor.r + (fromColor.r - toColor.r) * delta);
    const g = Math.round(toColor.g + (fromColor.g - toColor.g) * delta);
    const b = Math.round(toColor.b + (fromColor.b - toColor.b) * delta);

    return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Return the color to use.
 *
 * Internally it uses three colours.
 *
 * @param {float} degree - the match degree for a given note
 * @returns {string} a color corresponding best to `degree`
 */
function getGradientColor(degree) {
    const gray = {r: 100, g: 100, b: 100};
    const white = {r: 255, g: 255, b: 255};
    const red = {r: 255, g: 0, b: 0};
    const green = {r: 0, g: 255, b: 0};
    const dark_green = {r: 0, g: 179, b: 0};
    const blue = {r: 0, g: 0, b: 255};
    const yellow = {r: 255, g: 255, b: 0};
    const dark_yellow = {r: 215, g: 215, b: 0};
    const cyan = {r: 0, g: 255, b: 255};

    let a = dark_green;
    let b = dark_yellow;
    let c = red;

    if (degree > 0.5)
        return interpolateBetweenColors(a, b, 200 * (degree - 0.5)); // the degree is transformed from interval ]0.5 ; 1] to ]0 ; 100] linearly.
    else
        return interpolateBetweenColors(b, c, 200 * degree); // the degree is transformed from interval [0 ; 0.5] to [0 ; 100] linearly.

    // return interpolateBetweenColors(dark_green, red, 100 * degree);
}

/**
 * Create and fill the previews.
 *
 * Clears the current results container and redirect toward the right function,
 * that will create new score previews in it that fits the current data.
 *
 * there are multiple function because the query results are different in format.
 *
 * @param {JQuery<HTMLElement>} results_container - the html element that will contain the previews (e.g `$('#results_container')`) ;
 * @param {*} results - the query result containing all the scores ;
 * @param {string|null} [pattern=null] - the search pattern.
 */
async function loadPreviews(results_container, results, pattern=null) {
    await ensureTkInitialized();

    results_container.empty();

    if(results.length != 0) {
        if (results[0].hasOwnProperty('s') || (results[0].hasOwnProperty('_fields') && results[0]._fields[0].hasOwnProperty('properties'))) {
            createPreviews_1(results_container, results, pattern);
            fillPreviews(results);
        }
        else
            createPreviews_2(results_container, results, pattern);
    }
    else {
        const default_text = $('<h2>').text('No music score found');
        results_container.append(default_text);
    }
}

/**
 * Create new score previews in the results container that fits the current data.
 * Used by collection page.
 *
 * @param {JQuery<HTMLElement>} results_container - the html element that will contain the previews (e.g `$('#results_container')`) ;
 * @param {*} results - the query result containing all the scores ;
 * @param {string|null} [pattern=null] - the search pattern.
 */
function createPreviews_1(results_container, results, pattern=null) {
    results.forEach(result => {
        let prop = getSourceAndCollection(result);
        // let url = makeUrl(prop.collection, prop.source, result.hasOwnProperty('notes_id') ? result.notes_id : null);
        let url = makeUrl(prop.collection, prop.source, pattern, result.hasOwnProperty('matches') ? result.matches : null);

        const a = createPreview(url, prop.source);
        results_container.append(a);
    });
}

/**
 * Create new score previews in the results container that fits the current data.
 * Used by piano interface page.
 *
 * @param {JQuery<HTMLElement>} results_container - the html element that will contain the previews (e.g `$('#results_container')`) ;
 * @param {*} results - the query result containing all the scores ;
 * @param {string|null} [pattern=null] - the search pattern.
 */
async function createPreviews_2(results_container, results, pattern=null) {
    await ensureTkInitialized();

    // Get the collections associated with each result
    for (let k = 0 ; k < results.length ; ++k) {
        const result = results[k];

        // Get the source
        let source;
        if ('name' in result)
            source = result.name;
        else if ('source' in result)
            source = result.source
        else
            source = result._fields[0];

        // Get the notes IDs
        let notes_id = [];
        if ('notes_id' in result)
            notes_id = result.notes_id;

        // Get the author (needs a fetch since it is not in the result)
        const query = "MATCH (s:Score {source: '" + source + "'}) RETURN s.collection as collection";
        let data = {
            "query": query,
        };

        await fetch(`${BASE_PATH}/crisp-query-results`, { // await is needed here to keep the order of the results
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            return response.json();
        })
        .then(data_auth => {
            let collection = data_auth.results[0].collection;
            let url = makeUrl(collection, source, pattern, result.matches);
            results_container.append(createPreview(url, source, result.number_of_occurrences, result.overall_degree));

            let score_div = document.getElementById(source);
            let score_path = './data/' + collection.replace(/\s+/g, "-") + '/mei/' + source;
            fillPreview(score_div, score_path, result.matches);
        });
    }
}

/**
 * Fills the score previews with svg previews.
 *
 * @param {*} results - results from the query to get the collection ;
 */
function fillPreviews(results) {
    for (var i = 0; i < results.length; i++) {
        let prop = getSourceAndCollection(results[i]);

        let score_name = prop.source;

        let score_div = document.getElementById(prop.source);
        let score_path = './data/' + prop.collection.replace(/\s+/g, "-") + '/mei/' + score_name;
        fillPreview(score_div, score_path);
    }
}

export { loadPreviews, getGradientColor, extractMelodyFromQuery };
