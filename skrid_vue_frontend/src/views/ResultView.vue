<template>
  <div>
    <div class="searchbar-box">
      <h1 class="searchbar-title" id="searchbar_title">
        {{ props.titre }}
      </h1>
    </div>
    <div class="content-wrapper">
      <div class="container">
        <div class="score-container">
          <div class="button-container">
            <button id="playMIDI" class="play-button"><i class="fas fa-play"></i></button>
            <button id="stopMIDI" class="stop-button"><i class="fas fa-stop"></i></button>
            <button id="prevPage" class="prevpage-button">Page précédente</button>
            <label id="page_info"></label>
            <button id="nextPage" class="nextpage-button">Page suivante</button>
          </div>
          <div id="notation"></div>
        </div>
        <div class="right-infos">
          <div class="box-right">
            <div id="gradient-legend">Légende :</div>

            <div id="match-toggle">
              Surligner :

              <label id="toggle-all-lb">
                <input id="toggle-all-cb" type="checkbox" checked />
                Tout
              </label>
              <div id="match-toggle-checkboxes"></div>
            </div>
          </div>

          <div class="general_info">
            <p id="author"><b>Collection :</b></p>
            <!-- <p id="composition_date"><b>Compos&eacute; en :</b> </p> -->
            <p id="fichier_mei"><b>Fichier MEI :</b></p>
            <!-- <p id="fichier_ly"><b>Fichier LilyPond :</b> </p> -->
            <p id="fichier_mid"><b>Fichier Midi :</b></p>
            <p id="fichier_musicxml"><b>Fichier MusicXML :</b></p>
            <p id="fichier_pdf"><b>Fichier PDF :</b></p>
            <p id="fichier_svg"><b>Fichier SVG :</b></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";

defineOptions({
  name: 'ResultView',
});

let props = defineProps({
  titre: {
    type: String,
    required: true,
  },
});



onMounted(() => {
  
});
</script>

<style scoped>
</style>