<template>
  <!-- <AntvDemo msg="Welcome to my first Antv/G6 Demo!" /> -->
  <TopLevel></TopLevel>
</template>

<script>
// CORRECT VERSION (last set at 2021-08-18)
//import TopLevel from "./components/AntvDemo_top_levelDebug.vue";

// Duplicate our interface in Streamlit
import TopLevel from "./components/AntvDemo_streamlit.vue"; // Actual program for Miguel

// Figure out why tooltips do not appear when graph is created then destroyed then created again
//import TopLevel from "./components/DestroyCreateGraph.vue"

// Experimental code to analyze bookings and Tails one-day datasets
// Created on 2021-08-18
//import TopLevel from "./components/load2files.vue";

// OverlayPanel Demo from PrimeVue
//import TopLevel from "./components/OverlayDemo.vue";
//import TopLevel from "./components/OverlayPanelStackOverflow.vue";

// Experiment with Blog:
// https://vueschool.io/articles/vuejs-tutorials/state-management-with-composition-api/
//import TopLevel from "./components/top_level_felipe_debug.vue";

export default {
  name: "App",
  components: {
    TopLevel,
    // AntvDemo,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
