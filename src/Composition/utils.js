//import G6 from "@antv/g6";
import store from "../store/index.js";
import { colorByCity } from "../Composition/graphImpl.js"; // should not be called from here
import { assignNodeLabels, transferNodesEdgesToGraph } from "./graphImpl.js"; // not good practice for utils

export function checkEdgesDirection(edges, msg) {
  const wrongOrder = [];
  edges.forEach((r) => {
    // 180
    // const sch_dep_f = r.source.slice(16, 21);
    // const sch_dep_nf = r.target.slice(16, 21);
    const sch_dep_f = r.SCH_ARR_DTMZ_f;
    const sch_dep_nf = r.SCH_ARR_DTMZ_nf;
    const comp = sch_dep_f > sch_dep_nf;
    if (comp) {
      console.log(`${r.source}, ${r.target}`);
      wrongOrder.push(r);
    }
  });
  console.log(msg);
  console.log(`==> wrongOrder.length: ${wrongOrder.length}`); // 84 (30% of edges). How can that be? Check rigidModel
  console.log(`==> edges.length: ${edges.length}`); // 84 (30% of edges). How can that be? Check rigidModel
}

export function print(strg, val) {
  console.log(strg);
  console.log(val);
}

export function printAttributes(msg, table, attrList) {
  const outArray = [];
  table.forEach((r) => {
    const obj = {};
    // print("printAttributes, row: ", r);
    attrList.forEach((attr) => {
      // avoid use of eval (security risk)
      obj[attr] = r[attr]; //r[Function("return " + r[attr])()];
      // console.log(`obj[attr]: ${r[attr]},  ${obj[attr]}`);
    });
    // print("obj", obj);
    outArray.push(obj);
  });
  print(msg, outArray);
}

export function swap(arra) {
  [arra[0], arra[arra.length - 1]] = [arra[arra.length - 1], arra[0]];
  return arra;
}

export function createMappingOneToMany(arr, attr) {
  const mapping = Object.create(null);

  arr.forEach((el) => {
    mapping[el[attr]] = [];
  });

  arr.forEach((el) => {
    mapping[el[attr]].push(el);
  });
  return mapping;
}

export function createMapping(arr, attr) {
  const mapping = Object.create(null);

  arr.forEach((el) => {
    mapping[el[attr]] = el;
  });
  return mapping;
}

export function getAttributeUnique(table, attr) {
  // Return an array with the attribute with duplicates removed and sorted
  const attrSet = new Set();
  table.forEach((r) => {
    attrSet.add(r[attr]);
  });
  return [...attrSet].sort();
}

export function getRowsWithAttribute(table, attr, value) {
  // Extract from the table the rows with the specified attributes
  // attr, value: attribute/value pair:
  // Example: attr,value = 'orig', 'PTY'

  const arr = [];

  table.forEach((r) => {
    if (r[attr] === value) {
      arr.push(r);
    }
  });
  return arr;
}

//----------------------------------------------
export function dataForCityTable(nodeArray) {
  const table = [];
  //console.log("inside dataForCityTable");
  //console.log(nodeArray);
  nodeArray.forEach((node) => {
    table.push({
      id: node.id,
      O: node.id.slice(10, 13),
      D: node.id.slice(13, 16),
      //DepTZ: node.id.slice(16, 21),
      tail: node.tail,
      rotAvail: node.rot_avail,
      nbConn: node.hubConnections,
      schDep: node.depDTZ + ", " + node.depTMZ, // scheduled? Yes.
      schArr: node.arrDTZ + ", " + node.arrTMZ, // scheduled? Yes.
      flightNb: node.id.slice(21),
      depDelay: node.depDelay,
      arrDelay: node.arrDelay,
    });
  });
  //console.log(table);
  //console.log("before return");
  return table;
}
//----------------------------------------------
export function filterAndUpdateTable(city, data) {
  //print("filterAndUpdate, data: ", data);
  const filteredData = filterData(data, city);
  const nbRows = filteredData.nodes.length;
  store.commit("setGraphData", filteredData);
  // There is watcher for nodesTable
  store.commit("setTableData", filteredData.nodes);
  // Update city table
  const tableNodes = dataForCityTable(filteredData.nodes);
  return { tableNodes, nbRows };
  //nodesTable.value = tableNodes;
}
//----------------------------------------------
export function filterData(data, city) {
  //console.log("entered utils::filterData, and edges");
  //console.log("data is a ref, and should not be");
  //print("data", data.value);
  const edges = data.edges;
  //print("before includesCity..., city: ", city);
  const new_edges = edges.filter(includesCityInEdges(city));

  //console.log("city");
  //console.log(city);
  //console.log("new_edges");
  //console.log(new_edges);
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
  //console.log("return from filterData");
  //console.log(new_data);
  return new_data;
}
//---------------------------------------------------
export function includesCityInEdges(city) {
  //print("includesCityInEdges, city: ", city);
  // City entry need not be exact
  return (el) => {
    return (
      el.source.slice(10, 13).startsWith(city) ||
      el.target.slice(13, 16).startsWith(city)
    );
  };
}
//---------------------------------------------------
export const setupGraphs = (configurationFull, configuration, setupState) => {
  // console.log("*** CityGraph: inside setupGraphs");
  // const configuration = setupConfiguration({
  //   container: "mountNode",
  //   defaultNodeSize: 20, // hardcoded
  //   width: props.width,
  //   height: props.height,
  // });
  // There is no real need for full graph, except to
  // use neighbor functions. No render of fullGraph.
  store.dispatch("createFullGraph", configurationFull);
  store.dispatch("createGraph", configuration);

  // PROBLEM: the arrows (in configuration) are not displayed!!!

  const fullGraph = store.getters.fullGraph; // empty
  const allData = store.getters.allGraphData;
  fullGraph.data(allData);
  store.commit("setFullGraph", fullGraph);

  const graph = store.getters.graph;
  // setup up actions during hover and mouse clicks
  setupState(graph);

  // Filtered by what? Called only once
  store.dispatch("createFilteredData");
  const graphData = store.getters.graphData;
  graph.data(graphData);

  // transfer graph data to internal datastructures without rendering.
  // Normally this is done via render
  transferNodesEdgesToGraph(graph);

  assignNodeLabels(graph);
  graph.setMinZoom(0.1);
  colorByCity(graph);
  graph.render(); // The correct graph
  store.commit("setGraph", graph);

  // Calculate the degree of all nodes
  graph.getNodes().forEach((node) => {
    const degree = graph.getNodeDegree(node, "total", "false");
    if (degree === 0) {
      console.log("node degree is zero");
    }
  });

  const graphProps = store.getters.graphProps;
  graphProps.nbNodes = graphData.nodes.length;
  graphProps.nbEdges = graphData.edges.length;
  store.commit("setGraphProps", graphProps);
};
//---------------------------------------------------
export function saveGraphCoords(graph, layoutType) {
  if (layoutType === "concentric") {
    saveCoordsConcentric(graph); // save to store
  } else if (layoutType === "dagre") {
    saveCoordsDagre(graph); // save to store
  } else if (layoutType === "force") {
    saveCoordsForce(graph); // save to store
  } else {
    console.log(`Layout: ${layoutType} not implemented`);
  }
}
//----------------------------------------------------------------------
export function loadGraphCoords(graph, layoutType) {
  let coord;
  console.log(layoutType);
  if (layoutType === "dagre") {
    coord = loadCoordsDagre(graph); // load to store
  } else if (layoutType === "concentric") {
    coord = loadCoordsConcentric(graph); // load to store
  } else if (layoutType === "force") {
    coord = loadCoordsForce(graph); // load to store
  } else {
    console.log(`Layout: ${layoutType} not implemented`);
  }
  const nodes = graph.getNodes();
  if (coord !== null && coord !== undefined) {
    // console.log("coord !== null");
    // console.log(coord);
    for (let i = 0; i < coord.length; i++) {
      nodes[i].getModel().x = coord[i].x; // probably inefficient
      nodes[i].getModel().y = coord[i].y; // but happens rarely
    }
  }
}
//----------------------------------------------------------------------
function saveCoordsConcentric(graph) {
  store.commit("setCoordsConcentric", getCoords(graph));
}
//----------------------------------------------------------------------
function saveCoordsDagre(graph) {
  store.commit("setCoordsDagre", getCoords(graph));
}
//----------------------------------------------------------------------
function saveCoordsForce(graph) {
  store.commit("setCoordsForce", getCoords(graph));
}
//----------------------------------------------------------------------
function loadCoordsConcentric(graph) {
  return store.getters.coordsConcentric;
}
//----------------------------------------------------------------------
function loadCoordsDagre() {
  return store.getters.coordsDagre;
}
//----------------------------------------------------------------------
function loadCoordsForce() {
  return store.getters.coordsForce;
}
//----------------------------------------------------------------------
export function getCoords(graph) {
  const coords = [];
  const nodes = graph.getNodes();
  nodes.forEach((node) => {
    coords.push({
      x: node.getModel().x,
      y: node.getModel().y,
    });
  });
  return coords;
}
//----------------------------------------------------------------------
// function loadCoords(graph) {
//   const coords = store.getters.coords;
//   const nodes = graph.getNodes();
//   nodes.forEach((node) => {
//     coords.push({
//       x: node.getModel().x,
//       y: node.getModel().y,
//     });
//   });
//   return coords;
// }
//----------------------------------------------------------------------
export function removeDuplicatesFromArrayOfObjs(arrayOfObjs) {
  // Create a unique array of objects from arrayOfObjs
  const jsonObject = arrayOfObjs.map(JSON.stringify);
  const uniqueSet = new Set(jsonObject);
  const uniqueArray = Array.from(uniqueSet).map(JSON.parse);
  return uniqueArray;
}
//--------------------------------------------------------------------
// https://www.the-art-of-web.com/javascript/validate-date/
export function checkDate(field) {
  var allowBlank = true;
  var minYear = 1902;
  var maxYear = new Date().getFullYear();

  var errorMsg = "";

  // regular expression to match required date format
  const re = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

  if (field.value != "") {
    const regs = field.value.match(re);
    if (regs) {
      if (regs[1] < 1 || regs[1] > 31) {
        errorMsg = "Invalid value for day: " + regs[1];
      } else if (regs[2] < 1 || regs[2] > 12) {
        errorMsg = "Invalid value for month: " + regs[2];
      } else if (regs[3] < minYear || regs[3] > maxYear) {
        errorMsg =
          "Invalid value for year: " +
          regs[3] +
          " - must be between " +
          minYear +
          " and " +
          maxYear;
      }
    } else {
      errorMsg = "Invalid date format: " + field.value;
    }
  } else if (!allowBlank) {
    errorMsg = "Empty date not allowed!";
  }

  if (errorMsg != "") {
    alert(errorMsg);
    field.focus();
    return false;
  }

  return true;
}
//--------------------------------------------------------------------
// Original JavaScript code by Chirp Internet: chirpinternet.eu
// Please acknowledge use of this code by including this header.
// https://www.the-art-of-web.com/javascript/validate-date/

export function checkTime(field) {
  var errorMsg = "";

  // regular expression to match required time format
  const re = /^(\d{1,2}):(\d{2})(:00)?([ap]m)?$/;

  if (field.value != "") {
    // const regs = field.value.match(re);
    const regs = field.match(re);
    if (regs) {
      if (regs[4]) {
        // 12-hour time format with am/pm
        if (regs[1] < 1 || regs[1] > 12) {
          errorMsg = "Invalid value for hours: " + regs[1];
        }
      } else {
        // 24-hour time format
        if (regs[1] > 23) {
          errorMsg = "Invalid value for hours: " + regs[1];
        }
      }
      if (!errorMsg && regs[2] > 59) {
        errorMsg = "Invalid value for minutes: " + regs[2];
      }
    } else {
      errorMsg = "Invalid time format: " + field.value;
    }
  }

  if (errorMsg != "") {
    // console.log(errorMsg);
    //alert(errorMsg);
    //field.focus();
    return false;
  }

  return true;
}
//--------------------------------------------------------------------
//--------------------------------------------------------------------
