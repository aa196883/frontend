# TODO
- update change log
- remove useless annotation in preview
- remove cipher query from client side in fetchCollectionScoresNamesByAuthor -> make an endpoint in frontend that call backend
- remove ping pong -> only one endpoint for searchInterface (not 2)

## Bugs
- accidental not considered on search (nor in data ingestion);
- svg are generated for each result and so process can break when viewing individual result on result page ;
- cle du caveau -> highlight matching broken ;

## New features
- query-by-humming/by-instrument
- remove multipage for results when using keyboard -> keep results preview for quick switch, put clicked result in place of the keyboard
- better listening capabilities for results 
- UI for contour expression
- filter by scale
- migrating to Vue.js
- lock notes so matching is only exact for them
- polyphonic queries