export default {
  setTableData(state, data) {
    state.tableData = data;
  },
  setFullGraph(state, fullGraph) {
    state.fullGraph = fullGraph;
  },
  setGraph(state, graph) {
    //console.log("setGraph mutator, set graph");
    state.graph = graph;
  },
  setNodes(state, nodes) {
    state.nodes = nodes;
  },
  setAllNodes(state, nodes) {
    state.allNodes = nodes;
  },
  setEdges(state, edges) {
    state.edges = edges;
  },
  setAllEdges(state, edges) {
    state.allEdges = edges;
  },
  setNodesIdMap(state, nodesIdMap) {
    state.nodesIdMap = nodesIdMap;
  },
  setGraphData(state, graphData) {
    //graphDataconsole.log("graphData mutation");
    console.log(graphData);
    state.graphData = graphData;
  },
  setAllGraphData(state, allGraphData) {
    //graphDataconsole.log("allGraphData mutation");
    console.log("mutation: allGraphData updated");
    state.allGraphData = allGraphData;
  },
  setCity(state, city) {
    state.city = city;
  },
  setCityMap(state, cityMap) {
    state.cityMap = cityMap;
  },
  setActThresh(state, actThresh) {
    state.actThresh = actThresh;
  },
  setDelayThresh(state, delayThresh) {
    //console.log("==> inside delayThresh mutator");
    state.delayThresh = delayThresh;
  },
  setDelayThreshSlider(state, delayThreshSlider) {
    //console.log("==> inside delayThreshSlider mutator");
    state.delayThreshSlider = delayThreshSlider;
  },
  setActThreshSlider(state, actThreshSlider) {
    //console.log("==> inside actThreshSlider mutator");
    state.actThreshSlider = actThreshSlider;
  },
  setDoActThresh(state, doActThresh) {
    state.doActThresh = doActThresh;
  },
  setDoDelayThresh(state, doDelayThresh) {
    state.doDelayThresh = doDelayThresh;
  },

  // Layouts
  setConcentricLayout(state, concentricLayout) {
    state.concentricLayout = concentricLayout;
    //graphDataconsole.log("setConcentric mutation");
  },
  setRandomForceLayout(state, randomForceLayout) {
    state.randomForceLayout = randomForceLayout;
    //graphDataconsole.log("setForce mutation");
  },
  setDagreLayout(state, dagreLayout) {
    state.dagreLayout = dagreLayout;
    //graphDataconsole.log("setDagre mutation");
  },
  setActiveLayout(state, activeLayout) {
    state.activeLayout = activeLayout;
  },

  // Data to support ConnectionTable
  setNodeIdForConnections(state, nodeId) {
    console.log("*** setNodeId... in mutations");
    state.nodeIdForConnections = nodeId;
  },
  setConnectionNodes(state, nodes) {
    console.log("**** Mutations, connectionNodes");
    state.connectionNodes = nodes;
  },
  // Data to support ConnectionTable
  setEdgeIdForConnections(state, edgeId) {
    state.edgeIdForConnections = edgeId;
  },
  setConnectionEdges(state, edges) {
    console.log("**** Mutations, connectionEdges");
    state.connectionEdges = edges;
  },
  setConnectionsGraph(state, graph) {
    console.log("**** Mutations, connectionGraph");
    state.connectionsGraph = graph;
  },
  setConnectionData(state, data) {
    console.log("**** Mutations, connectionData");
    state.connectionData = data;
  },
  setCityGraphControls(state, controls) {
    state.cityGraphControls = controls;
  },
  setGraphProps(state, props) {
    state.graphProps = props;
  },
  setIsDataLoaded(state, isLoaded) {
    state.isDataLoaded = isLoaded; // true/false
  },
  // Layout Coordinates
  setCoordsConcentric(state, coords) {
    state.coordsConcentric = coords;
  },
  setCoordsDagre(state, coords) {
    state.coordsDagre = coords;
  },
  setCoordsForce(state, coords) {
    state.coordsForce = coords;
  },
  
// FlightsInAir
  setCurTime(state, curTime) {
    state.curTime = curTime;
  },
};
