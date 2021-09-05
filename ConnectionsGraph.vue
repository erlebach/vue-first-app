<template>
  <div v-show="showGraph">
    <div id="GEConnectionsToolTip"></div>
    <div id="mountConnectionGraph"></div>
  </div>
</template>

<script>
import G6 from "@antv/g6";
import _now from "lodash/now";
import { useStore } from "vuex";
import {
  setupConfiguration,
  filterData,
  setupState,
  findNodesWithArrivalDelays,
  findEdgesWithInsufficientACT,
  assignNodeLabels,
  showAllNodes,
  showAllEdges,
} from "../Composition/graphImpl.js";
import * as u from "../Composition/utils.js";
import flightsInAir from "../Composition/FlightsInAir.js";
import * as cg from "../Composition/connectionsGraphImpl.js";
import { ref, computed, watch } from "vue";
import { onMounted } from "vue";

export default {
  props: {
    width: Number,
    height: Number,
  },
  setup(props) {
    const store = useStore();

    const configuration = cg.setupConfiguration({
      container: "mountConnectionGraph",
      width: props.width,
      height: props.height,
    });

    // Initially, the connection graph will be empty
    onMounted(() => {
      const data = store.getters.connectionData;
      // This line is required. WHY? Empty graph is only created once.
      store.dispatch("createConnectionsGraph", configuration);
    });

    const showGraph = computed(() => {
      // Must make sure graph is created
      const data = store.getters.connectionData;
      if (data === null) {
        return false;
      } else {
        return true;
      }
    });

    const connectionData = computed(() => {
      return store.getters.connectionData;
    });

    watch([showGraph, connectionData], ([c_showGraph, c_connectionData], o) => {
      // console.log("[showGraph, connectionData]");
      // u.print("c_showGraph", c_showGraph);
      // u.print("connectionData", connectionData);
      if (!c_showGraph || !c_connectionData) {
        return;
      } else {
        // console.log("in else");
        const data = c_connectionData;
        const graph = store.getters.connectionsGraph;
        graph.data(data);
        store.commit("setConnectionsGraph", graph);
        graph.render();
        showGraph.value = true;
        // u.print("showGraph", showGraph);
      }
    });

    return {
      showGraph,
    };
  },
};
</script>

<style>
#mountNode {
  /* id */
  /*position: "relative"; */ /* for tooltips */
  border-style: solid;
  border-color: red;
  /* border: "2px solid green";*/ /* does not work */
}
</style>

<style scoped>

#p-field-radiobutton {
  color: blue;
}

.canvasview {
  -webkit-box-flex: 0;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  padding: 0.5rem;
  /*width: 800px;
  height: 600px;*/
  border-style: solid;
  border-color: red;
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
