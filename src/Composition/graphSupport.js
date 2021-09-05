import G6 from "@antv/g6";
import store from "../store/index.js";
// import { reduce } from "core-js/core/array";

export function convertCopaData(data) {
  let edges = [];
  let ids = [];
  let uniqueIds = new Set();
  const nano2min = 1 / 1e9 / 60;
  for (let i = 0; i < data.length; i++) {
    const edge = {};
    edge.source = data[i].id_f; // inbound
    edge.target = data[i].id_nf; // outbound
    edge.actAvail = data[i].act_available;
    edge.actSlack = data[i].act_slack;
    edge.actMin = 45;
    edge.schArrInTMZ = data[i].arr_tmz_f; // should be arr_tmz_f
    edge.schDepOutTMZ = data[i].dep_tmz_nf;
    edge.IN = data[i].IN_DTMZ_f * nano2min;
    edge.OUT = data[i].OUT_DTMZ_nf * nano2min;
    edge.actSched = data[i].act_planned; // planned
    edge.pax = data[i].pax_f;
    edges.push(edge);

    const e = edge;
    const d = data[i]; // an edge
    const s = {
      id: e.source,
      depDTZ: d.dep_dtz_f,
      arrDTZ: d.arr_dtz_f,
      depTMZ: d.dep_tmz_f,
      arrTMZ: d.arr_tmz_f,
      inZ: d.IN_DTMZ_f,
      outZ: d.OUT_DTMZ_f,
      schDepZ: d.SCH_DEP_DTMZ_f,
      schArrZ: d.SCH_ARR_DTMZ_f,
      tail: d.TAIL_f,
      rot_avail: d.ROTATION_AVAILABLE_TM_f,
      rot_planned: d.ROTATION_PLANNED_TM_f,
      rot_real: d.ROTATION_REAL_TM_f,
      hubConnections: d.out_degree_f,
    };
    const t = {
      id: e.target,
      depDTZ: d.dep_dtz_nf,
      arrDTZ: d.arr_dtz_nf,
      depTMZ: d.dep_tmz_nf,
      arrTMZ: d.arr_tmz_nf,
      inZ: d.IN_DTMZ_nf,
      outZ: d.OUT_DTMZ_nf,
      schDepZ: d.SCH_DEP_DTMZ_nf,
      schArrZ: d.SCH_ARR_DTMZ_nf,
      tail: d.TAIL_nf,
      rot_avail: d.ROTATION_AVAILABLE_TM_nf,
      rot_planned: d.ROTATION_PLANNED_TM_nf,
      rot_real: d.ROTATION_REAL_TM_nf,
      hubConnections: d.in_degree_nf,
    };
    ids.push(s);
    ids.push(t);
    uniqueIds.add(s.id); // must be better way
    uniqueIds.add(t.id);
    // console.log(ids);
    // ids.push(edge.source.actSlack < 15) {);
    // ids.push(edge.target);
  }
  // Extract nodes from edge array by extracting all 'id_f'
  // and 'id_nf' and removing duplicates (using Set)

  uniqueIds = Array.from(uniqueIds);

  const idObjs = {};
  uniqueIds.forEach((id) => {
    idObjs[id] = [];
  });

  ids.forEach((rec) => {
    // length 249
    idObjs[rec.id] = rec;
  });

  let nodes = [];

  // Must be a better way to iterate. Avoid using key.
  // for (const [key, value] of Object.entries(idObjs)) {
  // console.log("node fields: ");

  Object.values(idObjs).forEach((value) => {
    // console.log(key);

    value.depDelay = (value.outZ - value.schDepZ) * nano2min;
    value.arrDelay = (value.inZ - value.schArrZ) * nano2min;
    nodes.push(value);
  });
  // console.log("nodes");
  // console.log(nodes);
  let new_data = {
    nodes: nodes,
    edges: edges,
  };
  let cityMap = new Set();
  nodes.forEach((node) => {
    const id = node.id;
    cityMap.add(id.slice(10, 13));
    cityMap.add(id.slice(13, 16));
  });
  cityMap = Array.from(cityMap);
  //console.log("cityMap definition");
  //console.log(new_data);
  //console.log(cityMap);
  return [new_data, cityMap];
}

//-------------------------------------
/*
function includesCityInEdges(city) {
  // City entry need not be exact
  return (el) => {
    return (
      el.source.slice(10, 13).startsWith(city) ||
      el.target.slice(13, 16).startsWith(city)
    );
  };
}
*/

// TODO:
// Draw node with delays in orange or red or green
// Draw edges with insufficient connection in orange or red or green
// Fix cities (need entire city name)
// First time plot is drawn, make sure some nodes are larger (MIA)
// Create textboxes next to each node with delays. Not others.

//-----------------------------------------------------
/*
export function filterData(data, city) {
  console.log("entered filterData, and edges");
  console.log(data);
  console.log(data.edges);
  console.log(city);
  const edges = data.edges;
  const new_edges = edges.filter(includesCityInEdges(city));

  // new_edges is ZERO!!! WHY?

  console.log("city");
  console.log(city);
  console.log("new_edges");
  console.log(new_edges);
  let ids = [];
  for (let i = 0; i < new_edges.length; i++) {
    ids.push(new_edges[i].source);
    ids.push(new_edges[i].target);
  }
  ids = Array.from(new Set(ids));
  const nodes = data.nodes;
  // Must find which elements of the pre-filtered nodes array contain 'id'
  // For that, I need a dictionary from 'id' ==> dct['id'] = node
  const obj = {};
  nodes.forEach((node) => {
    obj[node.id] = node;
  });

  const new_nodes = [];

  ids.forEach((id) => {
    new_nodes.push(obj[id]);
  });

  const new_data = {
    nodes: new_nodes,
    edges: new_edges,
  };
  console.log("return from filterData");
  console.log(new_data);
  return new_data;
}
*/
//-----------------------------------------------------
export function findCityInCityMap(city, cityMap) {
  // I could sort the cities in the cityMap array and do a bissection search,
  // but for now linear search is good enough.
  // console.log("graphSuport, cityMap");
  // console.log(cityMap);
  // console.log(cityMapRef.value);
  // console.log(cityMap.length);
  // ForEach is not appropriate here becasuse the inner return statement will not exit the calling function,
  // but instead will exit the callback.
  for (let i = 0; i < cityMap.length; i++) {
    const c = cityMap[i];
    if (c.startsWith(city)) {
      return c;
    }
  }
}
//------------------------------------------------
export function findConnectedNodesEdges(node) {
  // node can be an id or a node
  if (typeof node === "string") {
    const graph = store.getters.fullGraph;
    node = graph.findById(node);
  }
  const inNodes = node.getNeighbors("source");
  const outNodes = node.getNeighbors("target");
  const inEdges = node.getInEdges();
  const outEdges = node.getOutEdges();
  // console.log("findConnectedNodesEdges, nodes: in/out, edges: in/out");
  // console.log(inNodes);
  // console.log(outEdges);
  // console.log(inEdges);
  // console.log(outEdges);
  // console.log(store);
  return {
    node,   // node clicked 
    inNodes,
    outNodes,
    inEdges,
    outEdges,
  };
}
//------------------------------------------------
