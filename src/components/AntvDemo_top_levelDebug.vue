/* eslint-disable vue/no-unused-components */ /* eslint-disable
vue/no-unused-components */ /* eslint-disable vue/no-unused-components */ /*
eslint-disable vue/no-unused-components */ /* eslint-disable
vue/no-unused-components */ /* eslint-disable vue/no-unused-components */ /*
eslint-disable vue/no-unused-components */ /* eslint-disable
vue/no-unused-components */ /* eslint-disable vue/no-unused-components */ /*
eslint-disable vue/no-unused-components */ /* eslint-disable
vue/no-unused-components */
<template>
  <div class="p-d-flex flex-start">
    <div>
      <FlightsInAirTable filePath="./data/bookings_oneday.json" /> -->
      <TailConnectionTable filePath="./data/tail_pairs.json" />
      <DelayPropagationTable />
      <CityTable filePath="./data/bookings_oneday.json"></CityTable>
      <NodeConnectionTable />
      <EdgeConnectionTable />
    </div>
    <!-- <div class="p-flex-column"> -->
    <div class="p-flex-column">
      <!--  p-flex-column and p-flex-row have the same effect -->
      <CityGraphControls />
      <Layouts />
    </div>
    <div class="p-d-flex">
      <div class="flex-start">
        >
        <CityGraph
          style="border:solid; color:green"
          city="PUJ"
          keepOnTimeArrivals
          keepSufficientACT
          :width="800"
          :height="800"
        />
        <!-- Must be below <CityGraph> -->
        <ConnectionsGraph :width="800" :height="600" v-show="false" />
        <!-- <DelayPropagationGraph :width="800" :height="800" v-show="false" /> -->
      </div>
    </div>
  </div>
</template>

<!-- CityGraph and CityTable are coupled through Vuex. 
They cannot be used independently -->

<!-- I was reading data file in both CityGraph and CityTable components 
Make sure that does not happen!! Could bge the cause of request headers too large. -->

<script>
import DelayPropagationTable from "./DelayPropagationTable.vue";
import CityTable from "./CityTable.vue";
import NodeConnectionTable from "./NodeConnectionTable.vue";
import EdgeConnectionTable from "./EdgeConnectionTable.vue";
import CityGraph from "./CityGraphNewExp.vue"; // newest experimental
import CityGraphControls from "./CityGraphControlsNew.vue";
import TailConnectionTable from "./TailConnectionTable.vue";
import FlightsInAirTable from "./FlightsInAirTable.vue"; // newest experimental
import ConnectionsGraph from "./ConnectionsGraph.vue";
import DelayPropagationGraph from "./DelayPropGraph.vue";
import Layouts from "./Layouts.vue";

export default {
  components: {
    // 'C'omponents allows use of unused components. Else use "components"
    CityTable,
    CityGraph,
    CityGraphControls,
    DelayPropagationTable,
    TailConnectionTable,
    Layouts,
    NodeConnectionTable,
    EdgeConnectionTable,
    FlightsInAirTable,
    ConnectionsGraph,
    // DelayPropagationGraph,
  },
};
</script>

<style>
/* Not clear how this works! */
/* Seems to have no effect! */
/* position: 'static'; */
</style>

<style>
.p-panel-title {
  align-content: center;
}

.p-panel-header {
  background-color: red;
  align-content: center;
}

/* I can't seem to style with p-checkbox. WHy not? */
/*.p-checkbox {
}*/

.ui {
  /* comment style for all ui elements */
  margin: 10px;
}

.graph {
  border-color: red; /* no effect */
}
</style>
