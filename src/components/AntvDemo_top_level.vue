<template>
  <div class="p-d-flex">
    <div>
      <CityTable filePath="./data/bookings_oneday.json"></CityTable>
      <NodeConnectionTable></NodeConnectionTable>
      <EdgeConnectionTable></EdgeConnectionTable>
    </div>
    <div>
      <CityGraphControls></CityGraphControls>
      <!-- <CityGraphControls></CityGraphControls> -->
    </div>
    <!-- LAYOUT PANEL -->
    <!-- TODO: set activeLayout correctly upon open -->
    <div>
      <Layouts></Layouts>
    </div>
    <div>
      <CityGraph
        city="PUJ"
        keepOnTimeArrivals
        keepSufficientACT
        :width="800"
        :height="600"
      />
      <ConnectionsGraph :width="100" :height="600" v-show="false" />
      <!-- removed connectionsToolTipId -->
    </div>
  </div>
</template>

<!-- CityGraph and CityTable are coupled through Vuex. 
They cannot be used independently -->

<script>
import CityTable from "./CityTable.vue";
import NodeConnectionTable from "./NodeConnectionTable.vue";
import EdgeConnectionTable from "./EdgeConnectionTable.vue";
//import CityGraph from "./CityGraphNew.vue"; // experimental
import CityGraph from "./CityGraphNewExp.vue"; // experimental
import CityGraphControls from "./CityGraphControls.vue";
import ConnectionsGraph from "./ConnectionsGraph.vue";
import Layouts from "./Layouts.vue";
import { useStore } from "vuex";
import { ref, watch } from "vue";
import { boundingBox } from "./graphImpl.js";
import { findConnectedNodesEdges } from "./graphSupport.js";
import { onBeforeMount, onMounted, onBeforeUpdate, onUpdated } from "vue";

export default {
  components: {
    CityTable,
    CityGraphControls,
    NodeConnectionTable,
    EdgeConnectionTable,
    CityGraph,
    ConnectionsGraph,
    Layouts,
  },

  //components: { CityTable, Graph, InputText, CheckBox, Slider, Panel, CheckBox },
  setup() {
    const store = useStore();

    const delayThresh = ref(0);
    const delayThreshDisplay = ref();
    const delayThreshSlider = ref(0);
    const actThresh = ref();
    const actThreshDisplay = ref();
    const actThreshSlider = ref(30);
    const doDelayThresh = ref(true); // overrides setting in component
    const doActThresh = ref(true);
    const doTrackTails = ref(false);
    const activeLayout = ref();

    onBeforeMount(() => {
      console.log(">>>>> TopLevel, onBeforeMount(), root.value");
    });
    onMounted(() => {
      console.log(">>>>> TopLevel, Inside onMounted (this) <<<<<");
    });
    onBeforeUpdate(() => {
      console.log(">>>>> TopLevel, Inside onBeforeUpdate (this) <<<<<");
    });
    onUpdated(() => {
      console.log(">>>>> TopLevel, Inside updated (this) <<<<<");
    });

    const centerGraph = () => {
      const graph = store.getters.graph;
      const activeLayout = store.getters.activeLayout;
      const viewController = graph.get("viewController");
      const layout = graph.get("layout");
      boundingBox(graph);
      // Must render in order to x,y coordinates
      // "group" not defined
      const bbox = graph.get("group").getCanvasBBox();
      graph.fitView(); // Not clear this is required
      graph.render(); // Not clear this is required

      const id = "2019/10/01PTYHAV20:35438";
      const fullGraph = store.getters.fullGraph;
      console.log("fullGraph");
      console.log(fullGraph); // data is all nodes.

      // How to transfer data from data to the graph. Using render()? Don't know.
      // This worked. However, I should not have to render. Also, where is it rendering.
      // I do not see the plot because there is no container.
      //fullGraph.render();

      console.log(fullGraph.getNodes().length);
      console.log(graph.getNodes().length);
      const node = fullGraph.findById(id);
      console.log("*** node=  ");
      console.log(node);
      findConnectedNodesEdges(node);

      // graph.getNodes().forEach((node) => {
      //   node.afterDraw((cfg, group) => {
      //     console.log("afterDraw");
      //   });
      // });
      // graph.render();

      // boundingBox(graph);  // same results as first boundingBox
      // I do not understand how the graph is recentered, and why it sometimes
      // works and sometimes does not work.
    };

    const tabOpen = (event) => {
      const graph = store.getters.graph;
      switch (event.index) {
        case 0: {
          const layout = store.getters.dagreLayout;
          graph.updateLayout(layout);
          activeLayout.value = "Dagre";
          break;
        }
        case 1: {
          const layout = store.getters.concentricLayout;
          graph.updateLayout(layout);
          activeLayout.value = "Concentric";
          break;
        }
        case 2: {
          const layout = store.getters.randomForceLayout;
          graph.updateLayout(layout);
          activeLayout.value = "Random Force";
          break;
        }
      }
      store.commit("setActiveLayout", activeLayout);
      console.log("*** graph render, layout: ");
      console.log(graph);
      const layout = graph.get("layout");
      console.log("graph.getLayout():");
      console.log(layout);
      graph.render();
    };

    // I really do not understand how to center the graph

    // watch(doDelayThresh, (newVal, oldVal) => {
    //   store.commit("setDoDelayThresh", doDelayThresh);
    // });

    // watch(doActThresh, (newVal, oldVal) => {
    //   store.commit("setDoActThresh", doActThresh);
    // });

    //watch(doTrackTails, (newVal, oldVal) => {
    //store.commit("setDoTrackTails", doTrackTails);
    //});
    // watch(delayThreshSlider, (newVal, oldVal) => {
    //   // try with and without value
    //   store.commit("setDelayThreshSlider", delayThreshSlider.value);
    // });

    // watch(actThreshSlider, (newVal, oldVal) => {
    //   // try with and without value
    //   store.commit("setActThreshSlider", actThreshSlider);
    // });

    const entryDelayThresh = () => {
      console.log("===== entryDelayThresh");
      // Make sure that only "displayed" data (i.e., fully entered) is sent to the store
      delayThreshDisplay.value = delayThresh.value;
      store.commit("setDelayThresh", delayThreshDisplay.value);
      delayThresh.value = "";
    };
    const entryActThresh = () => {
      actThreshDisplay.value = actThresh.value;
      store.commit("setActThresh", actThreshDisplay.value);
      actThresh.value = "";
    };

    return {
      doDelayThresh,
      doActThresh,
      delayThresh,
      delayThreshSlider,
      delayThreshDisplay,
      doTrackTails,
      actThresh,
      actThreshSlider,
      actThreshDisplay,
      entryDelayThresh,
      entryActThresh,
      activeLayout,
      tabOpen,
      centerGraph,
    };
  },
};
</script>

<style>
/* Not clear how this works! */
/* Seems to have no effect! */
/*
#GETooltipId {
  background-color: red;
  border-color: red;
  left: "2in";
}
*/
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
  border-color: red;
}
</style>
