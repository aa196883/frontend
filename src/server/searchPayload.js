const { ValidationError } = require('./errors');

const MAX_VOICES = 4;

function coerceNumber(value, defaultValue) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : defaultValue;
}

function coerceBoolean(value, defaultValue = false) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
    }

    return Boolean(value);
}

function coerceString(value, defaultValue = '') {
    if (value === undefined || value === null) {
        return defaultValue;
    }

    return String(value);
}

function hasNotes(notes) {
    if (notes === undefined || notes === null) {
        return false;
    }

    if (typeof notes === 'string') {
        return notes.trim().length > 0;
    }

    if (Array.isArray(notes)) {
        return notes.length > 0;
    }

    return true;
}

function serialiseNotes(notes) {
    if (notes === undefined || notes === null) {
        return '';
    }

    if (typeof notes === 'string') {
        return notes;
    }

    try {
        return JSON.stringify(notes);
    } catch (error) {
        return String(notes);
    }
}

function normaliseVoices(rawVoices) {
    const voices = rawVoices.filter((voice) => voice && hasNotes(voice.notes));

    if (voices.length === 0) {
        throw new ValidationError('Polyphonic search requires at least one voice with notes.');
    }

    if (voices.length > MAX_VOICES) {
        throw new ValidationError(`A maximum of ${MAX_VOICES} voices is supported.`);
    }

    return voices.map((voice) => ({
        notes: serialiseNotes(voice.notes),
        pitchDistance: coerceNumber(voice.pitch_distance, 0.0),
        durationFactor: coerceNumber(voice.duration_factor, 1.0),
        durationGap: coerceNumber(voice.duration_gap, 0.0),
        allowTransposition: coerceBoolean(voice.allow_transposition, false),
        allowHomothety: coerceBoolean(voice.allow_homothety, false),
        mode: coerceString(voice.mode, ''),
    }));
}

function extractSharedParameters(rawBody) {
    const shared = (rawBody && typeof rawBody.shared === 'object' && rawBody.shared) || {};

    return {
        alpha: coerceNumber(
            shared.alpha !== undefined ? shared.alpha : rawBody.alpha,
            0.0,
        ),
        incipitOnly: coerceBoolean(
            shared.incipit_only !== undefined ? shared.incipit_only : rawBody.incipit_only,
            false,
        ),
        collection: shared.collection !== undefined ? shared.collection : rawBody.collection,
        contourMatch:
            shared.contour_match !== undefined
                ? coerceBoolean(shared.contour_match)
                : rawBody.contour_match,
    };
}

function transformPolyphonicPayload(body) {
    const voices = normaliseVoices(body.voices);
    const shared = extractSharedParameters(body);

    const payload = {
        notes: voices.map((voice) => voice.notes),
        pitch_distance: voices.map((voice) => voice.pitchDistance),
        duration_factor: voices.map((voice) => voice.durationFactor),
        duration_gap: voices.map((voice) => voice.durationGap),
        allow_transposition: voices.map((voice) => voice.allowTransposition),
        allow_homothety: voices.map((voice) => voice.allowHomothety),
        mode: voices.map((voice) => voice.mode),
        alpha: shared.alpha,
        incipit_only: shared.incipitOnly,
    };

    if (shared.collection !== undefined) {
        payload.collection = shared.collection;
    }

    if (shared.contourMatch !== undefined) {
        payload.contour_match = shared.contourMatch;
    }

    // Preserve any additional top-level parameters that are not part of the
    // polyphonic structure so that new backend features keep working without
    // changes in this proxy.
    Object.entries(body)
        .filter(([key]) => key !== 'voices' && key !== 'shared')
        .forEach(([key, value]) => {
            if (payload[key] === undefined) {
                payload[key] = value;
            }
        });

    return payload;
}

function transformSearchPayload(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return body;
    }

    if (Array.isArray(body.voices)) {
        return transformPolyphonicPayload(body);
    }

    return body;
}

module.exports = {
    transformSearchPayload,
    MAX_VOICES,
};
