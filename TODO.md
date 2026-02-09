# TODO

## General
- Update code structure in README

- update change log
- remove useless annotation in preview

- Move config folder to the main repository

- Remove the allow all CORS in index.js for production (find an easy way to switch allow for dev and disallow for prod) ;

- Add Alexandre to the truc tu sais ;

## Bugs
- All notes are removed from staff whe pressing delete key
- svg are generated for each result and so process can break when viewing individual result on result page ;
- cle du caveau -> highlight matching broken ;
- key noises on keyboard don't work online version ;
- update links to pdf and other formats in the UI ;

## New features
- filter by scale
- lock notes so matching is only exact for them
- polyphonic queries


## Docker
- Move Verovio + data generation to a separate "data-builder" image.
- Put installation and building of client in CI/CD.