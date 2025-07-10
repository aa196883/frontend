<template>
  <div class="wrapper">
    <header>
      <div class="volume-slider">
        <span>Volume</span>
        <input v-model="volume" type="range" min="0" max="1" value="0.5" step="any" />
      </div>

      <div class="keys-checkbox">
        <span>azerty</span><input type="checkbox" id="qwerty-checkbox" @click="toggleKeyboardMapping()" /><span>qwerty</span>
      </div>

      <div class="octave-modif">
        <div class="octave-modif-bt-div">
          <button class="btn btn-outline-secondary text-white octave-modif-bt" @click="changeOctave(-1)">
            <span>Octave - (c)</span>
          </button>
          <button class="btn btn-outline-secondary text-white octave-modif-bt" @click="changeOctave(1)">
            <span>Octave + (v)</span>
          </button>
        </div>
        <label id="octave-lb" class="white-label">{{ octave }}</label>
      </div>

      <div class="keys-checkbox"><span>Touches</span><input type="checkbox" checked @click="showHideKeys()" /></div>
    </header>

    <ul class="piano-keys">
      <li class="key white" data-key="C4">
        <span
          >DO(C) <br />
          q</span
        >
      </li>
      <li class="key black" data-key="C#4">
        <span
          >DO#(c#) <br />
          z</span
        >
      </li>
      <li class="key white" data-key="D4">
        <span
          >RE(D) <br />
          s</span
        >
      </li>
      <li class="key black" data-key="D#4">
        <span
          >RE#(D#) <br />
          e</span
        >
      </li>
      <li class="key white" data-key="E4">
        <span
          >MI(E) <br />
          d</span
        >
      </li>
      <li class="key white" data-key="F4">
        <span
          >FA(F) <br />
          f</span
        >
      </li>
      <li class="key black" data-key="F#4">
        <span
          >FA#(F#) <br />
          t</span
        >
      </li>
      <li class="key white" data-key="G4">
        <span
          >SOL(G) <br />
          g</span
        >
      </li>
      <li class="key black" data-key="G#4">
        <span
          >SOL#(G#) <br />
          y</span
        >
      </li>
      <li class="key white" data-key="A4">
        <span
          >LA(A) <br />
          h</span
        >
      </li>
      <li class="key black" data-key="A#4">
        <span
          >LA#(A#) <br />
          u</span
        >
      </li>
      <li class="key white" data-key="B4">
        <span
          >SI(B) <br />
          j</span
        >
      </li>
      <li class="key white" data-key="C5">
        <span
          >DO(C) <br />
          k</span
        >
      </li>
      <li class="key black" data-key="C#5">
        <span
          >DO#(C#) <br />
          o</span
        >
      </li>
      <li class="key white" data-key="D5">
        <span
          >RE(D) <br />
          l</span
        >
      </li>
      <li class="key black" data-key="D#5">
        <span
          >RE#(D#) <br />
          p</span
        >
      </li>
      <li class="key white" data-key="E5">
        <span
          >MI(E) <br />
          m</span
        >
      </li>
      <li class="key white" data-key="F5">
        <span
          >FA(F) <br />
          ù</span
        >
      </li>
      <li class="key black" data-key="F#5">
        <span
          >FA#(F#) <br />
          )</span
        >
      </li>
      <li class="key white" data-key="G5">
        <span
          >SOL(G) <br />
          *</span
        >
      </li>
      <li class="key black" data-key="G#5">
        <span
          >SOL#(G#) <br />
          $</span
        >
      </li>
      <li class="key white" data-key="A5">
        <span
          >LA(A) <br />
          _</span
        >
      </li>
      <li class="key black" data-key="A#5">
        <span
          >LA#(A#)<br />
          _</span
        >
      </li>
      <li class="key white" data-key="B5">
        <span
          >SI(B)<br />
          _</span
        >
      </li>
    </ul>

    <br />
    <!-- Ajout du boutton options pour optimiser le visuel de la page / clavier -->
    <!--<button id="toggleButton1" class="btn btn-outline-secondary text-white" type="button" data-bs-toggle="collapse" data-bs-target="#bellow-keyboard" aria-expanded="false" aria-controls="bellow-keyboard" data-button="options1">
          Options avancées
        </button>-->
    <!--<div class='below-keyboard collapse collapse-vertical' id="bellow-keyboard">-->
    <div class="d-flex gap-4">
      <!-- <button data-key='r' id='silence-bt'><span>Silence (b)</span></button> -->
      <button @mousedown="keyDown('r')" @mouseup="keyUp('r')" class="m-5" data-key="r" id="silence-bt">
        <span>
          <img src="/silences_pics/s1.png" height="40px" alt="Silence" />
          /
          <img src="/silences_pics/s4.png" height="40px" />
          /
          <img src="/silences_pics/s8.png" height="40px" />
          (b)
        </span>
      </button>

      <div class="rhythm-modif">
        <button @click="staveRepr.changeLastNoteRhythm('w')" class="rhythm-modif-bt" data-key="w" id="whole-bt">
          <img src="/notes_pics/1.png" height="50px" alt="Whole" />
        </button>
        <button @click="staveRepr.changeLastNoteRhythm('hd')" class="rhythm-modif-bt" data-key="hd" id="half-dotted-bt">
          <img src="/notes_pics/2d.png" height="50px" alt="Dotted half" />
        </button>
        <button @click="staveRepr.changeLastNoteRhythm('h')" class="rhythm-modif-bt" data-key="h" id="half-bt">
          <img src="/notes_pics/2.png" height="50px" alt="Half" />
        </button>
        <button @click="staveRepr.changeLastNoteRhythm('qd')" class="rhythm-modif-bt" data-key="qd" id="quarter-dotted-bt">
          <img src="/notes_pics/4d.png" height="50px" alt="Dotted quarter" />
        </button>
        <button @click="staveRepr.changeLastNoteRhythm('q')" class="rhythm-modif-bt" data-key="q" id="quarter-bt">
          <img src="/notes_pics/4.png" height="50px" alt="Quarter" />
        </button>
        <button @click="staveRepr.changeLastNoteRhythm('8d')" class="rhythm-modif-bt" data-key="8d" id="8th-dotted-bt">
          <img src="/notes_pics/8d.png" height="50px" alt="Dotted 8-th" />
        </button>
        <button @click="staveRepr.changeLastNoteRhythm('8')" class="rhythm-modif-bt" data-key="8" id="8th-bt">
          <img src="/notes_pics/8.png" height="50px" alt="8-th" />
        </button>
        <button @click="staveRepr.changeLastNoteRhythm('16d')" class="rhythm-modif-bt" data-key="16d" id="16th-dotted-bt">
          <img src="/notes_pics/16d.png" height="50px" alt="Dotted 16-th" />
        </button>
        <button @click="staveRepr.changeLastNoteRhythm('16')" class="rhythm-modif-bt" data-key="16" id="16th-bt">
          <img src="/notes_pics/16.png" height="50px" alt="16-th" />
        </button>
        <button @click="staveRepr.changeLastNoteRhythm('32d')" class="rhythm-modif-bt" data-key="32d" id="32th-dotted-bt">
          <img src="/notes_pics/32d.png" height="50px" alt="Dotted 32-th" />
        </button>
        <button @click="staveRepr.changeLastNoteRhythm('32')" class="rhythm-modif-bt" data-key="32" id="32th-bt">
          <img src="/notes_pics/32.png" height="50px" alt="32-th" />
        </button>
      </div>

      <!-- <div class='qwerty-switch'>
        <label class='white-label'>
          <input type='checkbox' id='qwerty-checkbox'>
          Qwerty
        </label>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import Player from '@/lib/player.js';
import StaveRepresentation from '@/lib/stave.js';
import { durationNote, mapping_azerty, qwerty_us_to_azerty } from '@/constants/index.ts';
import { onMounted, ref, watch } from 'vue';

defineOptions({
  name: 'Keyboard',
});

const staveRepr = StaveRepresentation.getInstance();
const player = Player.getInstance(); // use singleton patron to centrelize the volume handler

const octave = ref(4);

const volume = ref(0.5);
watch(volume, (newVolume) => {
  player.setVolume(newVolume);
});

let currently_played_notes = {}; // Object to keep track of currently played notes

let isAzertyMapping = true; // Default keyboard mapping = azerty
/**
 * Changes the current octave
 *
 * @param {number} diff - the number of octaves to change (e.g +1, -1, ...)
 */
function changeOctave(diff) {
  octave.value += diff;

  if (octave.value < 1) octave.value = 1;

  if (octave.value > 6) octave.value = 6;
}

/**
 * This function hides/shows the keys for the buttons according to the user input
 */
function showHideKeys() {
  // getting all the piano keys
  const pianoKeys = document.querySelectorAll('.piano-keys .key');
  // toggling hide class from each key on the checkbox click
  pianoKeys.forEach((key) => key.classList.toggle('hide'));
}

function toggleKeyboardMapping() {
  isAzertyMapping = !isAzertyMapping;
}

/**
 * Manages when a piano key is released.
 *
 * It gets the duration, adds the note to `melody`, and display the note.
 *
 * @param {string} note - the note name (e.g C/5, C#/4, with the '/')
 * @param {string} [key_id=null] - the html `data-key` field. If null, uses `note_arr` instead.
 */
function keyUp(note, key_id = null) {
  let note_arr = note.replace('/', '');

  // Set key as unselected in the html
  if (key_id == null || note == 'r') key_id = note_arr;

  const clickedKey = document.querySelector(`[data-key="${key_id}"]`); // getting clicked key element
  clickedKey.classList.remove('active');

  // Stop the playing sound
  player.stopTune(note_arr);

  // Calculate duration
  let elapsed = (new Date() - currently_played_notes[note_arr].start) / 1000;
  elapsed /= 2;

  // Check the correct note duration based on the time elapsed (using the durationNote array previously defined)
  const sortedKeys = Object.keys(durationNote).sort((a, b) => durationNote[a] - durationNote[b]);
  let duration;

  if (elapsed <= durationNote[sortedKeys[sortedKeys.length - 1]]) {
    for (let i = 0; i < sortedKeys.length; i++) {
      if (elapsed < durationNote[sortedKeys[i]]) {
        duration = sortedKeys[i];
        break;
      }
    }
  } // If the duration is longer than the longest note, just add the longest note.
  else duration = sortedKeys[sortedKeys.length - 1];

  if (Object.keys(currently_played_notes).length > 1) currently_played_notes[note_arr] = { duration: duration };
  else delete currently_played_notes[note_arr];

  let wait_for_chord = false;
  for (let notePlayed in currently_played_notes) {
    if ('start' in currently_played_notes[notePlayed])
      // if there is a note that is not stopped, wait of it.
      wait_for_chord = true;
  }

  if (wait_for_chord) return;

  let keys = [note];
  for (let notePlayed in currently_played_notes) {
    let nt = notePlayed.slice(0, -1) + '/' + notePlayed.slice(-1);
    if (!keys.includes(nt)) keys.push(nt);
    delete currently_played_notes[notePlayed];
  }

  // Display the note
  staveRepr.displayNote(note, keys, duration);
}

/**
 * Manages when a piano key is pressed down.
 *
 * It starts a timer and plays the note.
 *
 * @param {string} note - the note name (e.g C/5, C#/4, or C5, C#4, ...)
 * @param {string} [key_id=null] - the html `data-key` field. If null, uses `note` instead.
 */
function keyDown(note, key_id = null) {
  note = note.replace('/', '');

  currently_played_notes[note] = { start: new Date() };

  if (note != 'r')
    // silence
    player.playTune(note);

  // Set key as selected in the html
  if (key_id == null || note == 'r') key_id = note;

  const clickedKey = document.querySelector(`[data-key="${key_id}"]`); // getting clicked key element
  clickedKey.classList.add('active');
  // Removing active class after 150 ms from the clicked key element
  // setTimeout(() => {
  //     clickedKey.classList.remove("active");
  // }, 150);
}

/**
 * Manages event associated to key presses.
 * only for the piano keys and the silence. (melody management is in stave.vue)
 */
function keyListener(event) {
  // change octave with '-' and '+' keys
  // or 'c' and 'v' keys
  if (event.type == 'keydown' && (event.key == '-' || event.key == '+' || event.key == 'c' || event.key == 'v')) {
    if (event.key == '-' || event.key == 'c') {
      changeOctave(-1);
    } else {
      changeOctave(1);
    }
  }
  //---Ignore repeat key for all the following
  if (event.repeat) return;

  // Get the key (convert if qwerty)
  let key;
  if (!isAzertyMapping) {
    key = qwerty_us_to_azerty[event.key] || event.key;
  } else {
    key = event.key;
  }

  // If the key is not in the mapping, return
  if (key in mapping_azerty) {
    let note_json = mapping_azerty[key];
    let note = note_json.pitch + '/' + (note_json.octave + octave.value);
    let key_id = note_json.pitch + (note_json.octave + 4);

    if (note_json.pitch == 'r') {
      note = 'r';
      key_id = 'r';
    }

    if (event.type == 'keydown') {
      // Pressed down : play sound, start timer
      keyDown(note, key_id);
    } else if (event.type == 'keyup') {
      // Key released : add note
      keyUp(note, key_id);
    }
  }
}

onMounted(() => {
  let pianoKeys = document.querySelectorAll('.piano-keys .key');
  // Adding mouseDown, mouseUp listeners to each piano key
  pianoKeys.forEach((key) => {
    key.addEventListener('mousedown', () => {
      let oct = parseInt(key.dataset.key.at(-1)) - 4;
      let key_ = key.dataset.key.slice(0, -1) + (oct + octave.value);
      keyDown(key_, key.dataset.key);
    });
    key.addEventListener('mouseup', () => {
      // Make the note with the '/'
      let newkey;

      if (key.classList.contains('black')) newkey = key.dataset.key.slice(0, 2) + '/' + key.dataset.key.slice(2);
      else newkey = key.dataset.key.slice(0, 1) + '/' + key.dataset.key.slice(1);

      let oct = parseInt(key.dataset.key.slice(-1)[0]) - 4;
      newkey = newkey.slice(0, -1) + (oct + octave.value);

      keyUp(newkey, key.dataset.key);
    });
  });

  // Adding keydown, keyup listeners to the document only for the piano keys
  // and the silence button
  document.addEventListener('keydown', keyListener);
  document.addEventListener('keyup', keyListener);
});
</script>

<style scoped>
.wrapper {
  padding: 35px 40px;
  width: 950px;
  border-radius: 20px;
  background: #141414;
}

.wrapper header {
  display: flex;
  color: #b2b2b2;
  align-items: center;
  justify-content: space-between;
}

.volume-slider {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.volume-slider input {
  accent-color: #fff;
}

header input {
  outline: none;
  border-radius: 30px;
}

.keys-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.keys-checkbox input {
  height: 30px;
  width: 60px;
  cursor: pointer;
  appearance: none;
  position: relative;
  background: #4b4b4b;
}
.keys-checkbox input::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #8c8c8c;
  transform: translateY(-50%);
  transition: all 0.3s ease;
}
.keys-checkbox #qwerty-checkbox::before {
  background: #fff;
}
.keys-checkbox input:checked::before {
  left: 35px;
  background: #fff;
}
.piano-keys {
  display: flex;
  list-style: none;
  margin-top: 40px;
  margin-right: 20px;
}
.piano-keys .key {
  cursor: pointer;
  user-select: none;
  position: relative;
  text-transform: uppercase;
  writing-mode: sideways-lr;
}
#silence-bt {
  cursor: pointer;
  user-select: none;
  position: relative;
  /* text-transform: uppercase; */
  /* writing-mode:sideways-lr; */
  height: 70px;
  width: 230px;
  border-radius: 8px;
  border: 1px solid #000;
  background: linear-gradient(#fff 96%, #eee 4%);
}
#silence-bt .active {
  box-shadow: inset -5px 5px 20px rgba(0, 0, 0, 0.2);
  background: linear-gradient(to bottom, #fff 0%, #eee 100%);
}

.rhythm-modif {
  display: flex;
  margin: 0px;
  gap: 5px;
  align-items: center;
}

.rhythm-modif-bt {
  height: 50px;
  border-radius: 5px;
  width: 40px;
  background-color: white;
  position: relative;
}

.rhythm-modif-bt img {
  border-radius: 3px;
}

.octave-modif-bt-div {
  display: flex;
  margin-right: 10px;
  gap: 10px;
}

.octave-modif {
  display: flex;
  align-items: center;
  margin: 10px;
}

.rhythm-modif-bt,
.octave-modif-bt {
  border-radius: 3px;
  border: none;
}

.white-label {
  color: white;
}

.piano-keys .black {
  z-index: 2;
  width: 44px;
  height: 140px;
  margin: 0 -22px 0 -22px;
  border-radius: 0 0 5px 5px;
  background: linear-gradient(#333, #000);
}
.piano-keys .black.active {
  box-shadow: inset -5px -10px 10px rgba(255, 255, 255, 0.1);
  background: linear-gradient(to bottom, #000, #434343);
}
.piano-keys .white {
  height: 230px;
  width: 70px;
  border-radius: 8px;
  border: 1px solid #000;
  background: linear-gradient(#fff 96%, #eee 4%);
}
.piano-keys .white.active {
  box-shadow: inset -5px 5px 20px rgba(0, 0, 0, 0.2);
  background: linear-gradient(to bottom, #fff 0%, #eee 100%);
}
.piano-keys .key span {
  position: absolute;
  bottom: 20px;
  width: 100%;
  color: #a2a2a2;
  font-size: 1.13rem;
  text-align: center;
}
.piano-keys .key.hide span {
  display: none;
}
.piano-keys .black span {
  bottom: 13px;
  color: #888888;
}
</style>