<template>
  <div
    class="flex p-align-start flex-column align-items-start justify-content-start opacity-20"
  >
    <h3 class="flex align-items-start justify-content-start">hello</h3>
    <!-- -->
    <div class="opacity-20">
      <h3 class="opacity-20">City: {{ newCity }}</h3>
    </div>
    <p v-show="graphProps">
      # nodes: {{ graphProps.nbNodes }}, # edges: {{ graphProps.nbEdges }}
    </p>
    <p v-if="graphProps">
      # visible nodes: {{ graphProps.nbVisNodes }}, Nb visible edges:
      {{ graphProps.nbVisEdges }}
    </p>
    <h4>
      Departure city (blue squares)<br />
      Arrival city (black squares)
    </h4>
    <!-- -->
    <!-- Mount fullgraph, but do not display. This is just a trick. -->
    <div id="fullMountNode" v-show="false" />
    <div
      id="mountNode"
      class="flex p-align-start justify-content-center align-items-start align-self-start opacity-20"
    ></div>
  </div>
</template>

<script>
import { ensureConditionIsMet } from "../Composition/IO_works.js";
import { transferNodesEdgesToGraph } from "../Composition/graphImpl.js";
// import G6 from "@antv/g6";
import * as u from "../Composition/utils.js";
import { useStore } from "vuex";
import {
  setupConfiguration,
  // filterData,
  setupState,
  // findNodesWithArrivalDelays,
  // findEdgesWithInsufficientACT,
  assignNodeLabels,
  // showAllNodes,
  // showAllEdges,
} from "../Composition//graphImpl.js";
import { ref, computed, watch } from "vue";
import { onMounted } from "vue";

export default {
  props: {
    city: String,
    width: Number,
    height: Number,
    keepOnTimeArrivals: Boolean,
    keepSufficientACT: Boolean,
  },
  setup(props) {
    // console.log("inside CityGraphExp setup");
    const store = useStore();

    // let new_data = null;
    const graph_city = ref();
    // const defaultNodeSize = ref(10);
    // const cityNodeSize = ref(15); // dep or arr === city
    // const nodeIdMap = ref();
    // const cityMap = ref();
    // const isInitialDataRead = ref(false);
    // const checkRef = ref(false);

    const city = computed(() => {
      return store.getters.city;
    });

    // watch(checkRef, (curVal, oldVal) => {
    //   console.log(">>>> watch checkRef: ");
    //   console.log(`curVal: ${curVal}, oldVal: ${oldVal}`);
    // });

    watch(city, () => {
      // console.log("inside watch(city)");
      const graphData = store.getters.graphData;
      const graph = store.getters.graph;

      graph.data(graphData);
      transferNodesEdgesToGraph(graph);
      assignNodeLabels(graph, graph.getNodes());

      graph.render();
      store.commit("setGraph", graph);
    });

    const setupGraphs = () => {
      // console.log("*** CityGraph: inside setupGraphs");
      // After setting the configuration parameters, find a better
      // way to override the default using Javascript best practice

      // Fake container for full graph
      // A better way is to create the full graph outside vue, perhaps
      const configurationFull = setupConfiguration({
        container: "fullMountNode",
        defaultNodeSize: 20,
        width: 10,
        height: 10,
      });

      const configuration = setupConfiguration({
        container: "mountNode",
        defaultNodeSize: 20,
        width: props.width,
        height: props.height,
      });

      // console.log("SETUP GRAPH");
      u.setupGraphs(configurationFull, configuration, setupState);
    };

    const isDataLoaded = computed(() => {
      return store.getters.isDataLoaded;
    });

    onMounted(() => {
      const timeout = 20000; // ms
      try {
        ensureConditionIsMet(timeout, () => {
          return isDataLoaded.value === true;
        }).then(() => {
          // console.log("==> Exp, Mounted, Data read succesfully!!");
          setupGraphs();
        });
      } catch (error) {
        console.log("Data not read correctly");
        console.log("isDataLoaded");
        console.log(store.getters.isDataLoaded);
      }
      // console.log("... Setting up graph");
    });

    const nodesTable = computed(() => {
      return store.getters.tableData;
    });

    const nodes = computed(() => {
      return store.getters.nodes;
    });
    const edges = computed(() => {
      return store.getters.edges;
    });
    // const graph = computed(() => {
    //   return store.getters.graph;
    // });

    const graphProps = computed(() => {
      // console.log("**** CityGrapNew, graphProps, computed");
      // console.log(store.getters.graphProps); // null. WHY?
      return store.getters.graphProps;
    });

    // const graphData = computed(() => {
    //   const data = store.getters.graphData;
    //   return data;
    // });

    const newCity = computed(() => {
      const city = store.getters.city;
      return city;
    });

    return {
      nodesTable,
      // onRowSelect,
      graph_city,
      // cityClass,
      newCity,
      nodes,
      edges,
      graphProps,
    };
  },
};
</script>

<style>
#mountNode {
  /* id */
  /*position: "relative"; */ /* for tooltips */
  border-style: solid;
  border-color: blue;
  width: 800;
  height: 800;
  /* border: "2px solid green";*/ /* does not work */
}
</style>

<style scoped>
#p-field-radiobutton {
  color: blue;
}

/* Not used */
.canvasview {
  -webkit-box-flex: 0;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  padding: 0.5rem;
  /*width: 800px;
  height: 600px;*/
  border: "2px solid red"; /* Not working */
}

.origclass {
  color: blue;
}

.defaultodclass {
  color: steelblue;
}

.destclass {
  color: black;
}

/* Not sure v-deep is required. Copied from PrimeVue Docs. */
</style>

<style scope>
::v-deep(.row-city) {
  background-color: red !important;
}
</style>

<style>
/*
.node-tooltip {
  background-color: lightsteelblue;
}
.edge-tooltip {
  background-color: yellow;  
}
*/
/* Not working */
.idbackgrounddefault {
  background-color: white; /* or nullify the class */
}
.idbackgroundhover {
  background-color: orange;
}
</style>

<style scoped>
.p-slider-horizontal,
.p-inputtext {
  width: 14rem;
}
.p-slider-vertical {
  height: 14rem;
}
</style>

/* .tooltip { position: relative; left: 30px; border: 3px solid #73AD21; } */
