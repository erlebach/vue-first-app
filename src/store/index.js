import { createStore } from "vuex";
import rootMutations from "./mutations.js";
import rootActions from "./actions.js";
import rootGetters from "./getters.js";

const store = createStore({
  state() {
    return {
      tableData: null,
      fullGraph: null, // all graph data (whatever is read in)
      graph: null, // assumes a single graph
      allNodes: null,
      allEdges: null,
      nodes: null,
      edges: null,
      nodesIdMap: null,
      graphData: null,
      allGraphData: null,
      city: "PUJ", // Ideally, city should be set from higher up
      cityMap: null,
      delayThresh: null,
      delayThreshSlider: null,
      actThresh: null,
      actThreshSlider: null,
      doDelayThresh: null,
      doActThresh: null,
      activeLayout: null,
      isDataLoaded: false,

      // Layouts
      concentricLayout: null,
      dagreLayout: null,
      randomForceLayout: null,

      // Data to support ConnectionTable
      nodeIdForConnections: null,
      connectionNodes: null,
      edgeIdForConnections: null,
      connectionEdges: null,
      connectionData: null,

      connectionsGraph: null,
      cityGraphControls: null,
      graphProps: {
        nbNodes: null,
        nbEdges: null,
        nbVisNodes: null,
        nbVisEdges: null,
      },

      // Graph Coordinates
      coordsConcentric: null,
      coordsDagre: null,
      coordsForce: null,
      //graphProps: {nbNodes: 10},

      // FlightsInAir
      curTime: null, // Zulu

      // Propagation
      dFSU: null,
      dTails: null,
      dBookings: null,
    };
  },
  mutations: rootMutations,
  actions: rootActions,
  getters: rootGetters,
});

export default store;
