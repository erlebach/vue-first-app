<template>
  <div ref="root">
    <h5>{{ h5Value }}</h5>
    <panel header="Input" :toggleable="true">
      <!-- ------ SLIDER ---------- -->
      <div v-if="doDelayThresh" class="ui">
        <h3>Arrival Delay Threshold: {{ delayThreshSlider }}</h3>
        <Slider v-model="delayThreshSlider" :step="5" :min="-60" :max="60" />
      </div>
      <!-- --------- CHECKBOX ---- -->

      <div class="ui" style="text-align:left;">
        <label class="ui" for="doDelayThresh">
          Arrival Delay Thresholding?
        </label>
        <CheckBox id="doDelayThresh" v-model="doDelayThresh" :binary="true" />
      </div>

      <!-- ------ SLIDER ----------, turn visibility on/off -->
      <div v-if="doActThresh" class="ui">
        <h5>ACT Threshold: {{ actThreshSlider }}</h5>
        <Slider v-model="actThreshSlider" :step="5" :min="0" :max="100" />
      </div>

      <!-- --------- CHECKBOX ---- -->
      <div class="ui" style="text-align:left;">
        <CheckBox v-model="doActThresh" :binary="true" />
        <label class="ui" id="doActThresh" for="doActThresh">
          ACT Thresholding?
        </label>
      </div>

      <!-- -------------- CHECKBOX ------ -->
      <div class="ui" style="text-align:left;">
        <CheckBox v-model="doTrackTails" :binary="true" />
        <label class="ui" id="doTrackTails" for="doTrackTails">
          Track Tails?
        </label>
      </div>
    </panel>
  </div>
</template>

<!-- For some reason, the controls are non-selectable. Do not 
know why. -->

<script>
import Panel from "primevue/panel";
import CheckBox from "primevue/checkbox";
import Slider from "primevue/slider";
import { useStore } from "vuex";
import {
  findNodesWithArrivalDelays,
  findEdgesWithInsufficientACT,
  assignNodeLabels,
  showAllNodes,
  showAllEdges,
} from "../Composition/graphImpl.js";
import { ref, reactive, computed, watch } from "vue";
import { onMounted } from "vue";
export default {
  components: {
    Panel,
    CheckBox,
    Slider,
  },
  setup() {
    const root = ref(null);
    const h5Value = ref("gordon");

    onMounted(() => {
      console.log(">>>>> Controls, Inside onMounted (this) <<<<<");
      console.log("root.value");
      console.log(root.value);
      console.log(h5Value.value);
    });

    const store = useStore();
    // const controls = reactive({
    //   delayThreshSlider: 0,
    //   actThreshSlider: 30,
    //   doDelayThresh: true, // overrides setting in component
    //   doActThresh: true,
    //   doTrackTails: false,
    // });
    const delayThreshSlider = ref(0);
    const actThreshSlider = ref(30);
    const doDelayThresh = ref(true); // overrides setting in component
    const doActThresh = ref(true);
    const doTrackTails = ref(false);
    const graphProps = reactive({
      nbVisEdges: null,
      nbVisNodes: null,
      nbNodes: null,
      nbEdges: null,
    });

    // Not clear this is required
    const graph = computed(() => {
      console.log("****** CityGraphControls computed, graph");
      console.log(store.getters.graph);
      console.log(store.getters.graph.getNodes()); // Correct
      console.log(store.getters.graph.getEdges()); // Correct
      console.log(store.getters.graph.get("data")); // Correct
      return store.getters.graph;
    });

    watch(store.getters.graph, (cur, old) => {
      // console.log("******* watch(graph), CityGraphControls, graph/cur");
      // console.log(cur); // Correct
      const ccur = Object.assign({}, cur);
      // console.log("data");
      // I should be able to do cur.get("data"). Does not work!
      // Or cur.getNodes()
      graphProps.nbNodes = cur.cfg.nodes.length;
      graphProps.nbEdges = cur.cfg.edges.length;
      console.log(graphProps.nbNodes);
      graphProps.nbNodes = cur.getNodes().length;
      console.log(graphProps.nbNodes);
      console.log(graphProps);
    });

    // const graphData = computed(() => {
    //   //   console.log("controls, graphData getter");
    //   //   console.log(store.getters.graphdata);
    //   return store.getters.graphData;
    // });

    watch(graphProps, (cur) => {
      console.log("**** CityGraphControls, commit graphProps");
      console.log(graphProps);
      store.commit("setGraphProps", graphProps);
    });

    // watch(graphData, (c, o) => {
    //   console.log("watch graphData");
    //   if (graphData.value === null) {
    //     return;
    //   }
    // });

    watch(doActThresh, (c, n) => {
      console.log("watch doActThresh, graph");
      console.log(graph.value);
      if (c === false) {
        showAllEdges(graph.value);
      } else {
        //const act = store.getters.actThreshSlider;
        const act = actThreshSlider.value;
        const edgesHidden = findEdgesWithInsufficientACT(graph.value, act);
        graphProps.nbVisEdges = graphProps.nbEdges - edgesHidden.length;
      }
    });

    watch(doDelayThresh, (c, n) => {
      if (c === false) {
        showAllNodes(graph.value);
        console.log("GGGGGordon false, graph");
        console.log(graph);
      } else {
        //const delay = store.getters.delayThreshSlider;
        const delay = delayThreshSlider.value;
        const nodesHidden = findNodesWithArrivalDelays(graph.value, delay);
        graphProps.nbVisNodes = graphProps.nbNodes - nodesHidden.length;
        console.log("GGGGGordon true");
      }
    });

    watch(delayThreshSlider, (curDelay, newval) => {
      showAllNodes(graph.value);
      const nodesHidden = findNodesWithArrivalDelays(graph.value, curDelay);
      graphProps.nbVisNodes = graphProps.nbNodes - nodesHidden.length;
    });

    watch(actThreshSlider, (curAct, newval) => {
      showAllEdges(graph.value);
      const edgesHidden = findEdgesWithInsufficientACT(graph.value, curAct);
      graphProps.nbVisEdges = graphProps.nbEdges - edgesHidden.length;
    });

    watch(doTrackTails, () => {
      console.log("trackTails");
    });

    // watch(graphData, (c, o) => {
    //   console.log("watch graphData");
    //   if (graphData.value === null) {
    //     return;
    //   }
    // });

    // return { controls };
    return {
      delayThreshSlider,
      actThreshSlider,
      doDelayThresh,
      doActThresh,
      doTrackTails,
      graphProps,
      root, // for debugging
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
.GEToolTip {
  position: "absolute"; /* relative to closest ancestor with position */
  left: "50%";
  bottom: "50%";
}

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
