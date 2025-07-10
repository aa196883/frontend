export interface SearchParams {
    "collection": string, // name of the collection to search in
    "notes": Array<String>, 
    "allow_transposition": boolean,
    "allow_homothety": boolean,
    "incipit_only": boolean,
    "pitch_distance": number,
    "duration_factor": number,
    "duration_gap": number, 
    "alpha": number, // in [0.0, 1.0]
    "contour_match": boolean,
};