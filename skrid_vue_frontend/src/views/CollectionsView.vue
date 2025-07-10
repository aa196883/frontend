<template>
  <div>
    <div class="searchbar-box">
      <h1 class="searchbar-title p-2">Les collections</h1>
    </div>
    <div class="father_container d-flex flex-row gap-1" id="fatherContainer">
      <!-- MENU LEFT -->
      <div
        class="card-lg shadow bg-body-tertiary gap-5 position-fixed rounded-end"
        id="collectionMenu"
        style="width: 18rem; top: 30; left: 0; height: 60vh; z-index: 1"
      >
        <div class="card-header text-center fs-1 d-flex flex-column">
          <i class="bi bi-people-fill fs-1" style="color: #006485"></i>
          Collections
        </div>
        <hr />
        <br />
        <div class="list-group gap-5" id="list-tab" role="tablist">
          <a
            v-for="(author, index) in authors.listeAuthors"
            :key="index"
            class="btn list-group-item-action w-75 mx-auto d-flex align-items-center"
            :class="authors.selectedAuthorIndex == index ? 'selected' : 'authors'"
            @click="authorButtonHandler(author, index)"
          >
            {{ author }}
          </a>
        </div>
      </div>
      <!-- PARTITIONS VIEW (avec du margin-left pour ne pas être caché sous le menu) -->
      <div class="archives">
        <p id="archives" class="text-secondary m-4">
          Télécharger la collection sous la forme d'une archive :
          <a :href="`data/${authors.selectedNameAuthor}/archives/${authors.selectedNameAuthor}_FilesMei.zip`">MEI</a>,
          <a :href="`data/${authors.selectedNameAuthor}/archives/${authors.selectedNameAuthor}_FilesLy.zip`">LY</a>,
          <a :href="`data/${authors.selectedNameAuthor}/archives/${authors.selectedNameAuthor}_FilesMid.zip`">MID</a>,
          <a :href="`data/${authors.selectedNameAuthor}/archives/${authors.selectedNameAuthor}_FilesMusicXML.zip`">MUSICXML</a>,
          <a :href="`data/${authors.selectedNameAuthor}/archives/${authors.selectedNameAuthor}_FilesPdf.zip`">PDF</a>,
          <a :href="`data/${authors.selectedNameAuthor}/archives/${authors.selectedNameAuthor}_FilesSvg.zip`">SVG</a>
        </p>
        <paginated-results :data="collectionScoresMetadata" :loading="isLoading" />
      </div>
    </div>
  </div>
</template>

<script setup>
import PaginatedResults from '@/components/common/PaginatedResults.vue';
import { fetchCollectionScoresNamesByAuthor } from '@/services/dataBaseQueryServices';
import { useAuthorsStore } from '@/stores/authorsStore';
import { onMounted, ref } from 'vue';

defineOptions({
  name: 'CollectionsView',
});

const isLoading = ref(true);
const authors = useAuthorsStore();
const collectionScoresMetadata = ref([]);

onMounted(() => {
  authors.loadAuthors().then(() => {
    isLoading.value = true;
    fetchCollectionScoresNamesByAuthor(authors.selectedAuthorName).then((data) => {
      collectionScoresMetadata.value = data;
      isLoading.value = false;
    });
  });
});

const authorButtonHandler = (author, index) => {
  authors.selectedAuthorIndex = index;
  isLoading.value = true;
  fetchCollectionScoresNamesByAuthor(authors.selectedAuthorName).then((data) => {
    collectionScoresMetadata.value = data;
    isLoading.value = false;
  });
};
</script>

<style scoped>
#menuCollection {
  margin-top: 8%;
}

.searchbar-box {
  background-color: white;
  color: black;
  border-bottom: 0.5px solid aqua;
}
.selected {
  background-color: #006485;
  color: white;
}

.selected:hover {
  background-color: #0082aa;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
.authors {
  background-color: #edebe6;
}
.authors:hover {
  /* background-color: #d0d0d0; */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
.archives{
  margin-left: 18rem;
  width: 100%;
}
</style>