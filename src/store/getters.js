export default {
  tableData(state) {
    return state.tableData;
  },
  graph(state) {
    return state.graph;
  },
  fullGraph(state) {
    //console.log("... inside mutator getters.fullGraph");
    return state.fullGraph;
  },
  nodes(state) {
    return state.nodes;
  },
  allNodes(state) {
    return state.allNodes;
  },
  edges(state) {
    return state.edges;
  },
  allEdges(state) {
    return state.allEdges;
  },
  // https://forum.vuejs.org/t/vuex-best-practices-for-complex-objects/10143/2
  // nodesIdMap: (state) => state.nodes.map((node) => state.nodes[node]),

  nodesIdMap(state) {
    // console.log("nodesIdMap getter, nodes");
    // console.log(state.graph);
    const nodes = state.fullGraph.get("data").nodes; //getNodes();
    // console.log(nodes);
    const idMap = {};
    nodes.forEach((node) => {
      idMap[node.id] = node; // using nodes from graph structure. Poor practice.
    });
    // console.log("idMap");
    // console.log(idMap);
    return idMap;
  },

  graphData(state) {
    return state.graphData;
  },
  allGraphData(state) {
    return state.allGraphData;
  },

  city(state) {
    console.log(`inside getters, city: ${state.city}`);
    return state.city;
  },

  cityMap(state) {
    return state.cityMap;
  },
  delayThresh(state) {
    return state.delayThresh;
  },
  delayThreshSlider(state) {
    return state.delayThreshSlider;
  },
  actThreshSlider(state) {
    return state.actThreshSlider;
  },
  actThresh(state) {
    return state.actThresh;
  },
  doActThresh(state) {
    //console.log(`mutator, doActThresh: ${state.doActThresh}`);
    return state.doActThresh;
  },
  doDelayThresh(state) {
    return state.doDelayThresh;
  },

  // I should not need these
  concentricLayout(state) {
    return state.concentricLayout;
  },
  randomForceLayout(state) {
    return state.randomForceLayout;
  },
  dagreLayout(state) {
    return state.dagreLayout;
  },
  activeLayout(state) {
    return state.activeLayout;
  },

  // Support for ConnectionTable
  nodeIdForConnections(state) {
    return state.nodeIdForConnections;
  },
  connectionNodes(state) {
    // console.log("connectionNodes getter");
    // console.log(state.connectionNodes);
    return state.connectionNodes;
  },
  edgeIdForConnections(state) {
    return state.edgeIdForConnections;
  },
  connectionEdges(state) {
    // console.log("connectionEdges getter");
    // console.log(state.connectionEdges);
    return state.connectionEdges;
  },
  connectionData(state) {
    console.log("getters: connectionData");
    return state.connectionData;
  },
  connectionsGraph(state) {
    return state.connectionsGraph;
  },
  cityGraphControls(state) {
    return state.cityGraphControls;
  },
  graphProps(state) {
    return state.graphProps;
  },
  isDataLoaded(state) {
    return state.isDataLoaded;
  },

// Layout Coordinates
  coordsConcentric(state) {
    return state.coordsConcentric;
  },
  coordsDagre(state) {
    return state.coordsDagre;
  },
  coordsForce(state) {
    return state.coordsForce;
  },

// FlightsInAir
  curTime(state) {
    return state.curTime; 
  }

};
