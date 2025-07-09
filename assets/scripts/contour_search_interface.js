import { loadPageN } from './paginated_results.js';
import { extractMelodyFromQuery } from './preview_scores.js';

document.addEventListener("DOMContentLoaded", () => {
    const searchButton = document.getElementById("stricte");
    const melodicInput = document.getElementById("melodic-contour");
    const rhythmicInput = document.getElementById("rhythmic-contour");
    const collectionSelect = document.getElementById("collections");

    searchButton.addEventListener("click", async () => {
        const results_container = $('#results-container');

        const melodicContour = melodicInput.value.trim();
        const rhythmicContour = rhythmicInput.value.trim();
        const selectedCollection = collectionSelect.value;

        if (melodicContour === "" && rhythmicContour === "") {
            alert("Veuillez renseigner au moins un des deux champs !");
            return;
        }

        // TODO : add checking on melodicContour and rhythmicContour : both of same length, if one complitly empty fill with Xs
        const notes = `${melodicContour}-${rhythmicContour}`;

        // Write that a search is performing
        results_container.empty();
        results_container.append($('<h3>').text('Chargement...'));

        createQuery(
            notes, 
            selectedCollection,
            false
        ).then(
            fuzzyQuery => sendQuery(fuzzyQuery)
        );

        // Sélectionne le container qui doit être affiché après la recherche
        const resultsContainer = document.querySelector(".container_2");
        resultsContainer.style.display = "flex";

    });
});

function sendQuery(fuzzyQuery) {
    fetch(`${BASE_PATH}/fuzzy-query-results`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: fuzzyQuery, format: 'json' })
    })
        .then(response => response.json())
        .then(data => {
            const dataDiv = document.getElementById('data');
            const patternDiv = document.getElementById('pattern');

            if ('results' in data) {
                dataDiv.textContent = data.results;
                patternDiv.textContent = extractMelodyFromQuery(fuzzyQuery);
                loadPageN(1, null, true, true, true);
            } else {
                dataDiv.textContent = '[]';
                patternDiv.textContent = '';
                loadPageN(1, null, true, true);
                console.error(data.error);
                alert(data.error);
            }

            const resultsContainer = document.querySelector(".container_2");
            resultsContainer.style.display = "flex";
        })
        .catch(err => {
            console.error("Erreur lors de l’envoi de la requête fuzzy :", err);
        });
}


async function createQuery(contour, selectedCollection, incipit_only=false) {

    //------Use the python script to get a fuzzy query
    let data = {
        notes: contour,
        incipit_only: incipit_only,
        contour_match: true,
        collection: selectedCollection
    };

    return fetch(`${BASE_PATH}/fuzzy-query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            return data.query;
        });
}
