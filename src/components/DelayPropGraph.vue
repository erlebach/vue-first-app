<template>
  <!-- <ModalView class="modal" v-show="showGraph"> -->
  <h1>Delay Propagation Graph</h1>
  <div>
    <div id="GEConnectionsToolTip"></div>
    <div id="mountDelayPropGraph"></div>
  </div>

  <!-- Add a panel surrounding the radio buttons -->
  <!-- <span width="200"> -->
  <div class="p-d-flex flex-start">
    <Panel
      class="dark-panel"
      header="# Tiers"
      :toggleable="true"
      :collapsed="false"
    >
      <div>
        <div class="p-field-radiobutton">
          <RadioButton id="tier2" name="tiers" value="2" v-model="tiers" />
          <label for="tier2">2</label>
        </div>
        <div class="p-field-radiobutton">
          <RadioButton id="tier3" name="tiers" value="3" v-model="tiers" />
          <label for="tier3">3</label>
        </div>
        <div class="p-field-radiobutton">
          <RadioButton id="tier3" name="tiers" value="4" v-model="tiers" />
          <label for="tier3">4</label>
        </div>
        <div class="p-field-radiobutton">
          <RadioButton id="tier3" name="tiers" value="5" v-model="tiers" />
          <label for="tier3">5</label>
        </div>
      </div>
    </Panel>
    <Panel
      class="dark-panel"
      header="# Tiers"
      :toggleable="true"
      :collapsed="false"
    >
      <div>
        <div class="p-field-radiobutton">
          <RadioButton id="tier2" name="tiers" value="2" v-model="tiers" />
          <label for="tier2">2</label>
        </div>
      </div>
    </Panel>
  </div>
  <!-- </span> -->
  <!-- </ModalView> -->

  <!-- <h1>Delay Propagation Graph</h1>
  <div>
    <div id="GEConnectionsToolTip"></div>
    <div id="mountDelayPropGraph"></div>
  </div> -->
</template>

<script>
import * as r from "../Composition/Tableref";
import ModalView from "./ModalView.vue";
import RadioButton from "primevue/radiobutton";
import Panel from "primevue/panel";
import * as u from "../Composition/utils";
import * as tier from "../Composition/RigidTierref";
import G6 from "@antv/g6";
import { useStore } from "vuex";
import * as dp from "../Composition/delayPropagationGraphImpl.js";
import { ref, computed, watch, watchEffect, onMounted } from "vue";

function defineNodes(obj, nb_tiers) {
  const nodes = [];
  obj.nodes.forEach((e) => {
    if (obj.id2level[e.id] < nb_tiers) {
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
    }
  });
  return nodes;
}

function defineEdges(obj, nb_tiers) {
  const edges = [];
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
  return edges;
}

// Draw the graph once the Delay table exists.

export default {
  components: { Panel, RadioButton },
  //components: { ModalView, RadioButton },
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
    const tiers = ref("3");
    let graphCreated = false;

    // console.log("configuration");
    // console.log(configuration);

    watch([r.getTable, tier.getTier], (value, o) => {
      // Only copy what I need
      if (!r.getTable) return;
      if (value[0]) {
        const nb_tiers = value[1]; //tier.getTier.value;
        const obj = value[0];
        const nodes = defineNodes(obj, nb_tiers);
        const edges = defineEdges(obj, nb_tiers);

        edges.forEach((e) => {
          if (e.inDegree == undefined) e.inDegree = 1;
          if (e.outDegree == undefined) e.outDegree = 1;
          if (e.pax == undefined) e.pax = 0;
        });

        if (!graphCreated) {
          graph.value = new G6.Graph(configuration);
          graphCreated = true;
        }

        // This element must be mounted before creating the graph
        graph.value.data({ nodes, edges });
        console.log("================================================");
        u.print("nodes", nodes);
        u.print("edges", edges);
        console.log("================================================");
        graph.value.render();

        // return items, not data models
        // getNodes() only works after render()
        u.print("getNodes", graph.value.getNodes());
        u.print("getEdges", graph.value.getEdges());

        dp.colorByCity(graph.value);
        graph.value.render(); // not sure required

        dp.assignNodeLabels(graph.value);
        graph.value.render();

        // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        // WHY IS A NEW GRAPH ADDED EACH TIME? Not what I want!! <<<<<<<
        // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

        // Temporarily disable, just for the streamlit version, for which  graph does not appear in a modal
        showGraph.value = true; // make graph visible (no content)
      }
    });

    // How to control the graph
    // Take this watchEffect outside this module
    // compute graph depth depending on tiers.value
    watchEffect(() => {
      tier.setTier(tiers.value);
      // if (tiers.value == "3 tiers") {
      //   console.log("3 tiers xx");
      // } else {
      //   console.log("2 tiers xx");
      // }
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
      // console.log("WATCH"); //  not executed
      // u.print("graph", graph);
      if (!c_showGraph || !c_connectionData) {
        return;
      } else {
        const data = c_connectionData;
        const graph = store.getters.connectionsGraph;
        graph.value.data(data);
        store.commit("setConnectionsGraph", graph);
        graph.value.render();
        showGraph.value = true;
        // console.log("SHOW: TRUE"); // not executed
      }
    });

    return {
      showGraph,
      tiers,
    };
  },
};
</script>

<style scoped>
/* #mountDelayPropGraph {
  border-style: solid;
  border-color: red;
} */
</style>

<style>
.p-field-radiobutton {
  color: black;
  font-size: 16pt;
  background-color: var(--gray-200);
}

.p-panel {
  width: 1.3in;
  font-size: 20pt;
  border: solid;
  border-color: black;
}

.p-panel-title {
  font-size: 20pt;
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
  border: "2px solid red"; /* not working */
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

/* not sure v-deep is required. copied from primevue docs. */
</style>

<style scope>
::v-deep(.row-city) {
  background-color: red !important;
}
</style>

<style scoped>
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
