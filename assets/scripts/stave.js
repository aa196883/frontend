/**
 * @file Defines a class to represent the stave using vexflow.
 *
 * @module stave
 */

//====== Imports ======//
const { Renderer, Stave, Formatter, StaveNote, Accidental, Dot} = VexFlow;


//====== Constants ======//
/** All the possible durations for a note */
const durationNoteWithDots = {
    '32': 1/32,         // thirty-second (triple croche)
    '32d': 1/32 + 1/64, // dotted thirty-second (triple croche pointée)
    '16': 1/16,         // sixteenth (double croche)
    '16d': 1/16 + 1/32, // dotted sixteenth (double croche pointée)
    '8': 1/8,           // eighth (croche)
    '8d': 1/8 + 1/16,   // dotted eighth (croche pointée)
    'q': 1/4,           // (quarter)
    'qd': 1/4 + 1/8,    // (dotted quarter)
    'h': 1/2,           // (half)
    'hd': .5 + .25,     // (dotted half)
    'w': 1              // (whole)
};


//====== Classes ======//
/**
 * Class defining the vexflow stave used to display the notes from the piano
 */
class StaveRepresentation {
    /** Array containing the notes */
    melody;

    #width;
    #height;
    #init_pentagram_width = 450;

    #html_elem;
    #stave;
    #renderer;
    #context;

    /**
     * Construct the class
     *
     * @param {number} [width=450] - the width of the representation of the stave
     * @param {number} [height=200] - the height of the representation of the stave
     */
    constructor(width = 450, height = 200) {
        this.melody = [];

        this.#width = width;
        this.#height = height;
    }

    /**
     * Initiates the HTML (vexflow).
     * Also connects the buttons.
     *
     * @param {Player} player - the player associated to this stave
     * @param {HTMLElement} playBt - the HTML button used to play / stop the melody. Here it is used to connect
     * @param {HTMLElement} clearAllButton - the HTML button used to clear all the stave
     * @param {HTMLElement} clearLastNoteButton - the HTML button used to clear the last note from the stave
     */
    init(player, playBt, clearAllButton, clearLastNoteButton) {
        this.#html_elem = document.getElementById('music-score');

        /* global VexFlow */
        VexFlow.loadFonts('Bravura', 'Academico').then(() => {
            VexFlow.setFonts('Bravura', 'Academico');
            // Create an SVG renderer and attach it to the pentagram
            this.#renderer = new Renderer(this.#html_elem, Renderer.Backends.SVG);

            // Configure the rendering context
            this.#renderer.resize(this.#width, this.#height);
            this.#context = this.#renderer.getContext();
            this.#context.setFont('Arial', 10);

            // Finally create the stave with the treble symbol and draw it
            this.#stave = new Stave(10, 40, this.#width);
            this.#stave.addClef("treble");
            this.#stave.setContext(this.#context).draw();
        });

        playBt.addEventListener('click', () => player.playMelodyBtHandler(playBt, this.melody));
        clearAllButton.addEventListener('click', () => this.clear_all_pattern());
        clearLastNoteButton.addEventListener('click', () => this.remove_last_note());
    }

    /**
     * Resizes the stave width, according to the notes in the melody.
     * Ensures that the minimal width is respected (`init_pentagram_width`).
     */
    resizeStave() {
        let totalWidth = 0;
        this.melody.forEach((note) => {
            totalWidth += note.getWidth() + 5;
        });

        totalWidth = Math.max(totalWidth, this.#init_pentagram_width);

        // If the new width is greater or smaller than the initial width, update stave width and pentagran_width variable
        if (totalWidth > this.#width || totalWidth < this.#width) {
            this.#stave.setWidth(totalWidth + 100);
            this.#renderer.resize(totalWidth + 100, this.#height)
            this.#width = totalWidth;
        }

        // Cancel the previous pentagram
        const svg = document.querySelector("#music-score svg");
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }
        this.#stave.setContext(this.#context).draw();

        // Re-draw it
        this.melody.forEach((note) => {
            note.setContext(this.#context).draw();
        });
    }

    /**
     * Displays the note to the stave and add it to `melody`.
     *
     * @param {string} note - the note name (e.g C/5, C#/4, with the '/') ;
     * @param {string[]} keys - array of keys ;
     * @param {string} duration - the note duration (w, h, q, 8, 16, 32, hd, qd, 8d, 16d, 32d).
     */
    displayNote(note, keys, duration) {
        let display_note;
        if (note == 'r') {
            display_note = new StaveNote({
                keys: ['B/4'], // just for middle height
                type: 'r', // rest
                duration: duration,
            });
        }
        else {
            display_note = new StaveNote({
                keys: keys,
                duration: duration,
                clef: 'treble',
                auto_stem: true
            });
        }

        if (note.includes('#'))
            display_note.addModifier(new Accidental("#"), 0);

        if (duration.includes('d')) {
            // display_note.addModifier(new Dot(), 0);
            display_note.dots = 1;
            Dot.buildAndAttach([display_note], {all: true});
        }

        this.melody.push(display_note);

        // Format stave and all notes
        Formatter.FormatAndDraw(this.#context, this.#stave, this.melody);

        this.resizeStave();
    }

    /**
     * Changes the last note on the stave for one with the same pitch, but with a different rhythm.
     *
     * @param {*} newRhythm - the new wanted rhythm.
     */
    changeLastNoteRhythm(newRhythm) {
        // If there is no note to modify, abort
        if (this.melody.length == 0)
            return;

        // Remove last note
        let last_note = this.melody.slice(-1)[0];
        let note = last_note.keys[0];
        if (last_note.noteType == 'r')
            note = 'r';

        this.remove_last_note();

        // Add the note with the new rhythm
        this.displayNote(note, last_note.keys, newRhythm);
    }

    /**
     * Remove from the melody array all the inserted note and clear the stave as well
     */
    clear_all_pattern() {
        this.melody = [];

        // Cancel the previous pentagram
        let pentagram_svg = document.querySelector("#music-score svg");
        while (pentagram_svg.firstChild) {
            pentagram_svg.removeChild(pentagram_svg.firstChild);
        }
        this.#stave.setContext(this.#context).draw();

        this.resizeStave();
    }

    /**
     * Remove from the melody array the last inserted note and re-draw the pentagram
     */
    remove_last_note() {
        this.melody.pop();

        // Cancel the previous pentagram
        let pentagram_svg = document.querySelector("#music-score svg");
        while (pentagram_svg.firstChild) {
            pentagram_svg.removeChild(pentagram_svg.firstChild);
        }
        this.#stave.setContext(this.#context).draw();

        // Re-draw the pentagram
        this.melody.forEach((note) => {
            note.setContext(this.#context).draw();
        });

        this.resizeStave();
    }
}

/**
 * Class defining methods to play music from the vexflow stave
 */
class Player {
    // #currently_played_notes;

    /** Stores notes when they are beeing played */
    #currently_played_notes_playback;

    /** Store when the user plays the melody */
    #is_playing;
    /** Flag to stop the melody from playing */
    #stop_melody;

    constructor() {
        // this.#currently_played_notes = {};
        this.#currently_played_notes_playback = {};

        this.#is_playing = false;
        this.#stop_melody = false;
    }

    /**
     * Plays the sound of the button that has been pressed
     *
     * @param {string} note - the note to play (format example : C#4, C4)
     * @param {Audio} [audio=null] - if not null, use this audio to make the sound
     * @param {number} [volume=0.5] - the audio volume (in [0, 1])
     * */
    playTune(note, audio=null, volume=0.5) {
        if (note == 'r')
            return;

        note = note.toUpperCase();

        if (audio == null) {
            this.#currently_played_notes_playback[note] = {audio: new Audio()};
            audio = this.#currently_played_notes_playback[note].audio;
        }

        let key = note.replace('#', 's');

        if (key.includes('s')) { // convert sharp to flat
            const Notes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

            for (let k = 0 ; k < Notes.length ; ++k) {
                if (key[0] == Notes[k]) {
                    key = key.replace(Notes[k], Notes[(k + 1) % Notes.length]);
                    key = key.replace('s', 'b');
                    break;
                }
            }
        }

        audio.volume = volume;
        audio.src = `acoustic_grand_piano-mp3/${key}.mp3`;

        audio.play();
    }

    /**
     * Stops the sound for the given note, with a fade out.
     *
     * @param {string} note - the note to stop playing (format example : C#/4, C/4)
     * @param {Audio} [audio=null] - if not null, use this audio to stop the sound.
     */
    stopTune(note, audio=null) {
        if (note == 'r')
            return;

        note = note.toUpperCase();

        let note_arr = note.replace('/', '');

        if (audio == null) {
            audio = this.#currently_played_notes_playback[note_arr].audio;
            delete this.#currently_played_notes_playback[note_arr];
        }

        var fadeAudio = setInterval(function() {
            if (audio.volume > 0) {
                audio.volume -= 1/8;
            }
            else {
                clearInterval(fadeAudio);
                audio.pause();
            }
        }, 30);
    }

    /**
     * Plays a note and stop after the given rhythm.
     *
     * @param {string} note - the note (pitch) to play (e.g C#/4) ;
     * @param {string} rhythm - the rhythm of the note (e.g h, 8d, ...)
     */
    playNoteWithRhythm(note, rhythm) {
        let audio = new Audio();

        this.playTune(note, audio);

        // let audio = currently_played_notes_playback[note].audio;

        let class_inst = this;
        var stopAudio = setInterval(function() {
            if (audio.currentTime >= 2 * durationNoteWithDots[rhythm]) {
                clearInterval(stopAudio);
                class_inst.stopTune(note, audio);
            }
        }, 1)
    }

    /**
     * Wait `ms` ms.
     *
     * @param {number} ms - the time to wait, in ms.
     */
    #sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Plays / stop the melody from the `melody` global array.
     *
     * If the melody is already playing, it stops it. Otherwise, it plays it.
     *
     * @param {Array} melody - the `melody` array from {@linkcode StaveRepresentation}
     */
    async playMelody(melody) {
        for (let k = 0 ; k < melody.length ; ++k) {
            if (!this.#stop_melody) {
                let duration = melody[k].dots > 0 ? melody[k].duration + 'd' : melody[k].duration;

                if (melody[k].noteType == 'r')
                    this.playNoteWithRhythm('r')
                else
                    melody[k].keys.forEach((key) => {this.playNoteWithRhythm(key.replace('/', ''), duration)}); // Play chord (or just one note)

                await this.#sleep(1000 * durationNoteWithDots[duration]);
            }
            else {
                this.#stop_melody = false;
                break;
            }
        }
    }

    /**
     * Plays the melody if it not currently playing.
     * Otherwise stop it.
     *
     * @param {HTMLElement} play_bt - the HTML button used to play / stop the melody. Here it is used to change the color (for 'play' or 'stop').
     * @param {Array} melody - the `melody` array from {@linkcode StaveRepresentation}
     */
    async playMelodyBtHandler(play_bt, melody) {
        // const play_bt = document.getElementById('play_melody');

        if (!this.#is_playing) {
            this.#is_playing = true;
            // play_bt.disabled = true;
            play_bt.innerText = 'Arrêter la mélodie';
            play_bt.style.backgroundColor = 'red';

            await this.playMelody(melody);

            this.#is_playing = false;
            // play_bt.disabled = false;
            play_bt.innerText = 'Jouer la mélodie';
            play_bt.style.backgroundColor = '#62aadd';
        }
        else
            this.#stop_melody = true;
    }
}

export { StaveRepresentation, Player };
