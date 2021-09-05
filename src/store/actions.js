import G6 from "@antv/g6";
import { IO_works } from "../Composition/IO_works.js";
import {
  convertCopaData,
  findConnectedNodesEdges,
} from "../Composition/graphSupport.js";
import { filterData, dataForCityTable } from "../Composition/utils.js"; //"../components/graphSupport.js";
import { transferNodesEdgesToGraph } from "../Composition/graphImpl.js";
import store from "./index.js";

// External function. Should go to a library outside Vue
// I put it in utils.js
/*
function dataForCityTable(nodeArray) {
  const table = [];
  nodeArray.forEach((node) => {
    table.push({
      id: node.id,
      O: node.id.slice(10, 13),
      D: node.id.slice(13, 16),
      DepTZ: node.id.slice(16, 21),
    });
  });
  return table;
}
*/

export default {
  // https://blog.logrocket.com/using-vuex-4-with-vue-3/
  // Execute operations that do not require the graph
  async getTableDataFromFileNew({ commit, getters, dispatch }, filePath) {
    // meant for new version of code. Each function should be specific
    const io = new IO_works();
    //console.log("*** inside actions: gettabledatafromfile");
    // await SHOULD be synchronous!
    //console.log("inside actions, before await io.readFile");
    let data = await io.readFile(filePath);
    //console.log("inside actions, after await io.readFile");
    //console.log("inside actions, data");
    //console.log(data);
    //console.log("after await io.readFile");
    const results = convertCopaData(data);
    //console.log("store.actions, results = ...");
    commit("setAllNodes", results[0].nodes);
    commit("setAllEdges", results[1].edges);
    commit("setAllGraphData", results[0]);
    //console.log("store.actions, results[0],  allGraphData"); // NOT REACHED FOR SOME REASON
    //console.log(results[0]);
    commit("setCityMap", results[1]);
    //console.log("store.actions: isDataLoaded, in store, set to true");
    //const allGraphData = store.getters.allGraphData;
    //console.log(">>>> actions, allGraphData"); // ok
    //console.log(results[0].nodes); // ok
    const allGraphData = results[0];

    //console.log("*** actions, 1, filterData");
    data = filterData(allGraphData, getters.city); // BUG
    //console.log("after filterData");
    commit("setGraphData", data); // nodes and edges
    commit("setNodes", data.nodes); // nodes and edges
    commit("setEdges", data.edges); // nodes and edges
    const cityData = dataForCityTable(data.nodes);
    commit("setTableData", cityData);

    commit("setIsDataLoaded", true);  // data is loaded
    //console.log("Set isDataLoaded to true: " + getters.isDataLoaded);
  },

  createFilteredData({ commit, getters }) {
    const fullGraph = getters.fullGraph;
    //console.log("createFilteredData, store:"); // ok
    //console.log(fullGraph); // null!!! WHY?

    // NOTE: I had to add the nodes myself into the graph datastructure.
    const allData = getters.allGraphData; // check if define, else error msg
    //fullGraph.data(results[0]); // The graph is NOT updating with the new data

    transferNodesEdgesToGraph(fullGraph);  // RESPONSIBLE for SINGLE POINT!!
    commit("setFullGraph", fullGraph);

    //console.log(allData); // undefined
    //console.log(getters.city);

    //console.log("acions, 2, filterData ******");
    const data = filterData(allData, getters.city); // for now
    //console.log("retrieved data");
    //console.log(data);

    const arr = getters.testMap;
    //console.log("RETURN from actions.getTableDataFromFile");
  },

  /*
  async getTableDataFromFile({ commit, getters, dispatch }, filePath) {
    const io = new IO_works();
    console.log("----- setup IO");
    let data = await io.readFile(filePath);
    console.log("----- data computed");
    const results = convertCopaData(data);
    commit("setAllNodes", results[0].nodes);
    commit("setAllEdges", results[1].edges);
    commit("setAllGraphData", results[0]);
    commit("setCityMap", results[1]);
    console.log("inside actions: gettabledatafromfile, get city"); // ok

    const fullGraph = getters.fullGraph;
    console.log("getTableDataFromFiles, fullGraph: "); // ok
    console.log(fullGraph); // null!!! WHY?

    // NOTE: I had to add the nodes myself into the graph datastructure.
    fullGraph.data(results[0]); // The graph is NOT updating with the new data
    transferNodesEdgesToGraph(fullGraph);
    fullGraph.nbNodes = results[0].nodes.length; // GE
    fullGraph.nbEdges = results[0].edges.length;
    commit("setFullGraph", fullGraph);

    data = filterData(results[0], getters.city); // for now
    commit("setGraphData", data); // nodes and edges
    commit("setNodes", data.nodes); // nodes and edges
    commit("setEdges", data.edges); // nodes and edges
    const cityData = dataForCityTable(data.nodes);
    commit("setTableData", cityData);
    const arr = getters.testMap;
    console.log("RETURN from acionss.getTableDataFromFile");
  },
*/

  createGraph({ commit }, configuration) {
    // console.log("before new G6");
    // console.log(G6); // seems OK
    // console.log(configuration); // seems OK
    // ERROR IN next line. Why is that?
    // onst gg = new G6.Graph(configuration);
    // console.log("gg");
    // console.log(gg); // ERROR for reasons UNKNOWN
    // The configuration does not yet exist since it
    // requires a container. Therefore createGraph must
    // be called after the compoennt is mounted, or perhaps just before it is mounted.
    console.log("==> store createGraph");
	//console.log(configuration);
    const graph = new G6.Graph(configuration); // Argument required with mount point
    // console.log("createGraph, before commit");
    commit("setGraph", graph);
    // console.log("createGraph, after commit");
  },

  createConnectionsGraph({ commit }, config) {
    const graph = new G6.Graph(config);
    commit("setConnectionsGraph", graph);
    console.log("CreateConnectionsGraph");
  },

  createFullGraph({ commit, getters }, configuration) {
    // The graph has no data
    console.log("==> store createFullGraph");
    const graph = new G6.Graph(configuration);
    commit("setFullGraph", graph);
  },

  computeNodeConnections({ getters, commit }, nodeIdForConnections) {
    const obj = findConnectedNodesEdges(nodeIdForConnections);
    const table = [obj.node.getModel()];
    obj.inNodes.forEach((node) => {
      table.push(node.getModel());
    });
    obj.outNodes.forEach((node) => {
      table.push(node.getModel());
    });
    commit("setConnectionNodes", table);
  },

  computeEdgeConnections({ getters, commit }, edgeIdForConnections) {
    const data = getters.allGraphData;
    const obj = findConnectedNodesEdges(edgeIdForConnections);
    const table = [];
    obj.inEdges.forEach((edge) => {
      table.push(edge.getModel());
    });
    obj.outEdges.forEach((edge) => {
      table.push(edge.getModel());
    });

    const fullGraph = getters.fullGraph;
    const nano2min = 1 / 1e9 / 60;
    table.forEach((row) => {
      const srcId = row.source;
      const dstId = row.target;
      const srcNode = fullGraph.findById(srcId).getModel();
      const dstNode = fullGraph.findById(dstId).getModel();
      row.inOrg = srcId.slice(10, 13);
      row.outDst = dstId.slice(13, 16);
      row.inTail = srcNode.tail;
      row.outTail = dstNode.tail;
      row.inArrDelay = (srcNode.inZ - srcNode.schArrZ) * nano2min;
      row.outDepDelay = (dstNode.outZ - dstNode.schDepZ) * nano2min;
    });
    commit("setConnectionEdges", table);
  },
};
