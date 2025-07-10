/** All the possible durations for a note */
export const durationNote: Record<string, number>= {
    '32': 1 / 32,         // thirty-second (triple croche)
    '32d': 1 / 32 + 1 / 64, // dotted thirty-second (triple croche pointée)
    '16': 1 / 16,         // sixteenth (double croche)
    '16d': 1 / 16 + 1 / 32, // dotted sixteenth (double croche pointée)
    '8': 1 / 8,           // eighth (croche)
    '8d': 1 / 8 + 1 / 16,   // dotted eighth (croche pointée)
    'q': 1 / 4,           // (quarter)
    'qd': 1 / 4 + 1 / 8,    // (dotted quarter)
    'h': 1 / 2,           // (half)
    'hd': .5 + .25,     // (dotted half)
    'w': 1              // (whole)
};

/** The keyboard mapping that tie computer keys with piano notes. Use with `octave` global var. */
export const mapping_azerty: Record<string, { pitch: string, octave: number }> = {
    'q': { pitch: 'C', octave: 0 },
    'z': { pitch: 'C#', octave: 0 },
    's': { pitch: 'D', octave: 0 },
    'e': { pitch: 'D#', octave: 0 },
    'd': { pitch: 'E', octave: 0 },
    'f': { pitch: 'F', octave: 0 },
    't': { pitch: 'F#', octave: 0 },
    'g': { pitch: 'G', octave: 0 },
    'y': { pitch: 'G#', octave: 0 },
    'h': { pitch: 'A', octave: 0 },
    'u': { pitch: 'A#', octave: 0 },
    'j': { pitch: 'B', octave: 0 },
    'k': { pitch: 'C', octave: 1 },
    'o': { pitch: 'C#', octave: 1 },
    'l': { pitch: 'D', octave: 1 },
    'p': { pitch: 'D#', octave: 1 },
    'm': { pitch: 'E', octave: 1 },
    'ù': { pitch: 'F', octave: 1 },
    // '^': 'F#/5',
    ')': { pitch: 'F#', octave: 1 },
    '*': { pitch: 'G', octave: 1 },
    '$': { pitch: 'G#', octave: 1 },
    //TODO: there is also A, A#, and B (/5) missing
    'b': { pitch: 'r', octave: 0 },
}

/** Used to convert qwerty keys to the azerty corresponding ones. */
export const qwerty_us_to_azerty: Record<string, string> = {
    'q': 'a',
    'w': 'z',
    'a': 'q',
    'z': 'w',
    ';': 'm',
    "'": 'ù',
    '\\': '*',
    'm': ',',
    '[': '^',
    ']': '$',
}
