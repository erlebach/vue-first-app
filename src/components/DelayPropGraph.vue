<template>
  <!-- <ModalView class="modal" v-show="true"> -->
  <ModalView class="modal" v-show="showGraph">
    <h1>Delay Propagation Graph</h1>
    <div>
      <!-- v-show="showGraph"> -->
      <div id="GEConnectionsToolTip"></div>
      <div id="mountDelayPropGraph"></div>
    </div>
  </ModalView>
</template>

<script>
import ModalView from "./ModalView.vue";
import * as r from "../Composition/Tableref";
import G6 from "@antv/g6";
// import _now from "lodash/now";
import { useStore } from "vuex";
import * as u from "../Composition/utils.js";
import * as dp from "../Composition/delayPropagationGraphImpl.js";
import { ref, computed, watch, watchEffect, onMounted } from "vue";

// Draw the graph once the Delay table exists.

export default {
  components: { ModalView },
  props: {
    width: Number,
    height: Number,
  },
  setup(props) {
    const store = useStore();

    const configuration = dp.setupConfiguration({
      container: "mountDelayPropGraph",
      width: props.width,
      height: props.height,
      defaultNodeSize: 40,
    });

    const graph = ref(null);
    const showGraph = ref(null);

    watch(r.getTable, (value, o) => {
      // Only copy what I need
      if (value) {
        const obj = r.getTable.value;
        const nodes = [];

        // copy needed attributes to avoid infinite recursions due to inbounds and outbounds fields
        obj.nodes.forEach((e) => {
          nodes.push({
            id: e.id,
            actSlackP: e.actSlackP,
            depDelayP: e.depDelayP,
            minACTP: e.minACTP,
            rotSlackP: e.rotSlackP,
            slackP: e.slackP,
            ACTSlackP: e.ACTSlackP,
            plannedRot: e.ROTATION_PLANNED_TM,
            arrDelayP: e.arrDelayP,
            fltNum: e.FLT_NUM,
            tail: e.TAIL,
            schDepTMZ: e.SCH_DEP_TMZ,
            schArrTMZ: e.SCH_ARR_TMZ,
          });
          console.log(e);
        });
        u.print("nodes", nodes);

        const edges = [];
        u.print("obj.edges", obj.edges);
        obj.edges.forEach((e) => {
          edges.push({
            source: e.id_f,
            target: e.id_nf,
            ACTSlack: e.ACTSlack,
            ACTSlackP: e.ACTSlackP,
            ACTAvailable: e.ACTAvailable,
            ACTAvailableP: e.ACTAvailableP,
            inDegree: e.in_degree_nf,
            outDegree: e.out_degree_f,
            pax: e.pax_f,
            rotSlackP: e.rotSlackP,
          });
        });

        edges.forEach((e) => {
          if (e.inDegree == undefined) e.inDegree = 1;
          if (e.outDegree == undefined) e.outDegree = 1;
          if (e.pax == undefined) {
            e.pax = 0;
            // e.rotAvail = edges[0].
          }
          // Need rotation?
        });
        u.print("new edges: ", edges);

        // This element must be mounted before creating the graph
        graph.value = new G6.Graph(configuration);
        graph.value.data({ nodes, edges });
        graph.value.render();
        dp.colorByCity(graph.value);

        graph.value.render(); // not sure required
        dp.assignNodeLabels(graph.value);
        graph.value.render();
        showGraph.value = true; // make graph visible
      }
    });

    // Initially, the connection graph will be empty
    onMounted(() => {
      // Should only draw graph when mounted
      // console.log("DelayProp: onMounted"); // occurs very early
      // const data = store.getters.connectionData;
      // This line is required. WHY? Empty graph is only created once.
      // store.dispatch("createConnectionsGraph", configuration);
    });

    const connectionData = computed(() => {
      return store.getters.connectionData;
    });

    watch([showGraph, connectionData], ([c_showGraph, c_connectionData], o) => {
      if (!c_showGraph || !c_connectionData) {
        return;
      } else {
        const data = c_connectionData;
        const graph = store.getters.connectionsGraph;
        graph.data(data);
        store.commit("setConnectionsGraph", graph);
        graph.render();
        showGraph.value = true;
      }
    });

    return {
      showGraph,
    };
  },
};
</script>

<style scoped>
#mountDelayPropGraph {
  border-style: solid;
  border-color: red;
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
/* .modal { */
/* background-color: rgb(111, 0, 0);
  opacity: 0.9; */
/* position: absolute; */
/* left: 100px; */
/* right: 100px; */
/* z-index: 99;
  padding: 30px;
  border: solid; */
/* } */
</style>

<style scoped>
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
