//============= Imports =============//
import { loadPageN } from './paginated_results.js';
import { extractMelodyFromQuery } from './preview_scores.js';
import { StaveRepresentation, Player } from './stave.js';
import { startRecording, staveRepr, player } from './micro_recorder_wav.js';


//============= Variables globales =============//
// BASE_PATH doit être défini (par exemple, via une variable globale ou importé depuis un autre module)
const BASE_PATH = window.BASE_PATH || ''; // ajustez si nécessaire

//============= Fonctions =============//

/**
 * Initialise l'interface micro.
 */

document.addEventListener("DOMContentLoaded", init);

function init() {
    document.getElementById('start-rec').addEventListener('click', () => {
        startRecording(4000);
    });
    //document.getElementById('stop-rec').addEventListener('click', () => {
    //  stopRecording();
    //});

    // Create the HTML for the stave
    const clearAllButton = document.getElementById("clear_all");
    const clearLastNoteButton = document.getElementById("clear_last_note");
    const playBt = document.getElementById('play_melody');

    staveRepr.init(player, playBt, clearAllButton, clearLastNoteButton);
}

function getPageData() {
    return JSON.parse(document.getElementById('data').textContent);
}
