/* eslint-disable no-unreachable */
import G6 from "@antv/g6";
import store from "../store/index.js";
import * as u from "../Composition/utils.js";
import { watchWithFilter } from "@vueuse/core";

export function setupConfiguration(parameters) {
  const configuration = {
    fitView: true, // do not fit canvas to the viewport
    fitViewPadding: [20, 20, 20, 20],
    animate: false,
    defaultNode: {
      //trigger: 'mouseleave',
      size: parameters.defaultNodeSize,
      // selection of rects works. Circles have a halo around them. WHY?
      type: "rect",
      style: {
        fill: "steelBlue",
        stroke: "#666",
        lineWidth: 0.8,
      },
      labelCfg: {
        style: {
          fill: "#fff",
        },
      },
    },
    defaultEdge: {
      type: "line",
      style: {
        stroke: "green",
        //lineDash: [150, 3],
        lineWidth: 6.5,
        lineAppendWidth: 3, // only used to help select the edge
      },
    },
    labelCfg: {
      autoRotate: true,
    },
    nodeStateStyles: {
      hover: {
        //fill: "purple",
        size: 10, // Nodes do not resize on hover
        lineWidth: 4,
      },
      table: {
        stroke: "red",
        lineWidth: 3,
        width: 30,
        height: 30,
        //size: 20, // exaggerated value for debugging (does not work)
      },
    },
    edgeStateStyles: {
      hover: {
        lineWidth: 4,
      },
    },
    modes: {
      // Not clear whether click-select is required here
      default: ["drag-canvas", "zoom-canvas", "click-select"],
    },
    container: parameters.container, //"mountNode",
    linkCenter: true, // Link edges to node center
    // Width and height ust be consistent with the column width and height in flexbox
    // I created a special `canvas` class to handle this.
    width: parameters.width, //"fit-content", // 800
    height: parameters.height, //"fit-content", //600,
    //autofit: true,
    layout: {
      type: "dagre",
      // rankdir: "TB",
      rankdir: "LR",
      // align: "DL",
    },
    plugins: [myTooltip],
  };
  return configuration;
}
//-----------------------------------------
export function colorEdges(graph) {
  let color;
  graph.edge((edge) => {
    // WHY IS THIS NOT CALLED?
    const avail = edge.data.ACTAvailableP;
    if (avail < 5) {
      color = "black";
    } else if (avail < 15) {
      color = "darkred";
    } else if (avail < 30) {
      color = "red";
    } else if (avail < 45) {
      color = "darkorange";
    } else {
      color = "green";
    }
    return {
      id: edge.id,
      style: {
        stroke: color,
      },
    };
  });
}
//-----------------------------------------
export function colorNodes(graph) {
  // Nodes colored by arrival delay if feeder into PTY
  // Nodes colored by departure delay if outbound from PTY
  let color;
  let stroke;
  let lineWidth;

  graph.node((node) => {
    let delay;
    let strokeDelay;
    const O = node.data.id.slice(10, 13);
    const D = node.data.id.slice(13, 16);
    if (O === "PTY") {
      delay = node.data.depDelayP;
      strokeDelay = node.data.arrDelayP;
    } else if (D === "PTY") {
      delay = node.data.arrDelayP;
      strokeDelay = node.data.depDelayP;
    } else {
      console.log("Neither O or D are PTY. Should not happen!");
      console.log(node);
    }
    if (delay < 5) {
      color = "green";
    } else if (delay < 15) {
      color = "orange";
    } else if (delay < 30) {
      color = "red";
    } else if (delay < 45) {
      color = "darkred";
    } else {
      color = "black";
    }
    if (strokeDelay < 5) {
      stroke = "green";
    } else if (strokeDelay < 15) {
      stroke = "darkorange";
    } else if (strokeDelay < 30) {
      stroke = "red";
    } else if (strokeDelay < 45) {
      stroke = "darkred";
    } else {
      stroke = "black";
    }
    lineWidth = 2;

    return {
      id: node.id,
      style: {
        fill: color,
        lineWidth: lineWidth,
        stroke: stroke,
      },
    };
  });
}
//-------------------------------------
export function colorByCity(graph) {
  // Graph controlled by Vuex, so value not required
  colorEdges(graph);
  colorNodes(graph);
}
//--------------------------------------
const myTooltip = new G6.Tooltip({
  offsetX: 10, // relative to background container
  offsetY: 10, // I do not understand these parameters
  //trigger: "mouseleave",
  fixToNode: [1, 0], // for rect element
  // Types of tooltips allowed
  itemTypes: ["node", "edge"],
  className: "GETooltipId",

  // I need the parent container, which seems not to have a position
  // style.
  // I would like the tooltip to be a fixed position to the right
  // of the graph. Right now it is relative to the viewport so that
  // if the graph moves, the tooltip will not. NOT BEST PRACTICE.
  // Tooltip will likely have problems on mobile devices such as iPad.
  // This App is not meant of phones.
  getContent: (e) => {
    const outDiv = document.createElement("div");
    outDiv.style.width = "40rem"; // font size in root element
    outDiv.style.height = "22rem";
    outDiv.style.position = "absolute"; // position and z-index necessary
    outDiv.style.zIndex = "100"; // be draw above datatable header
    // Right edge of tootip is against viewport edge (fixed pos)
    // When I decrease size of viewport, this continue to be true.
    outDiv.style.left = "1in"; // same distance, independent of scaling!
    outDiv.style.top = "1in"; // rem units might work better.
    // Bottom edge of tooltip is at 50% of viewport height (fixed pos)
    outDiv.style.textAlign = "left";
    outDiv.style.fontSize = "1.0rem";
    outDiv.style.paddingLeft = "1.0em"; // negatives do not work

    // WHY: positioning of toolbar seems to work for all node and edge
    // tooltips except for 7 of them. Pretty strange.
    // How to print out the style elements of nodes?
    // This happens when the right border would exit the viewport. The toolbar is then automatically shifted left. INCORRECT since it also happens when I decrease the width in half. Really strange.

    const nano2min = 1 / 1e9 / 60;
    const node = e.item.getModel(); // Is this the best way?
    const depDelay = (node.outZ - node.schDepZ) * nano2min;
    const arrDelay = (node.inZ - node.schArrZ) * nano2min;

    if (e.item.getType() == "node") {
      let depDelayColor;
      let arrDelayColor;
      if (depDelay < 5) {
        depDelayColor = "green";
      } else if (depDelay < 15) {
        depDelayColor = "darkorange";
      } else if (depDelay < 30) {
        depDelayColor = "red";
      } else if (depDelay < 45) {
        depDelayColor = "darkred";
      } else {
        depDelayColor = "black";
      }

      if (arrDelay < 5) {
        arrDelayColor = "green";
      } else if (arrDelay < 15) {
        arrDelayColor = "darkorange";
      } else if (arrDelay < 30) {
        arrDelayColor = "red";
      } else if (arrDelay < 45) {
        arrDelayColor = "darkred";
      } else {
        arrDelayColor = "black";
      }
      //  Hub Connections: nbOutbounds for feeder, and nbFeeders for outbound, flights
      let connectLabel;
      if (node.id.slice(10, 13) !== "PTY") {
        connectLabel = "Nb Outbounds";
      } else {
        connectLabel = "Nb Feeders";
      }
      outDiv.style.backgroundColor = "lightSteelBlue";
      outDiv.innerHTML = `<div>
      <h4>Flight (node)</h4>
      <ul>
        <li>ID: ${node.id}</li>
        <li>OD: ${node.id.slice(10, 13)}-${node.id.slice(13, 16)}</li>
        <li>Flt#: ${node.id.slice(21)}</li>
        <li>Tail: ${node.tail}</li>
        <li>Sch Dep: ${node.depTMZ} UTC</li>
        <li>Sch Arr: ${node.arrTMZ} UTC</li>
        <li style="color:${depDelayColor};">Dep Delay: ${depDelay} min</li>
        <li style="color:${arrDelayColor};">Arr Delay: ${arrDelay} min</li>
        <li>Availab Rotation: ${node.rot_avail} min</li>
        <li>Real Rotation: ${node.rot_real} min</li>
        <li>Planned Rotation: ${node.rot_planned} min</li>
        <li>${connectLabel}: ${node.hubConnections}</li>
      </ul>
      </div>`;
      return outDiv;
    } else if (e.item.getType() == "edge") {
      const edge = e.item.getModel();
      const inbound = e.item.getSource().getModel();
      const outbound = e.item.getTarget().getModel();
      outDiv.style.backgroundColor = "yellow";

      let actColor;
      if (edge.actAvail < 5) {
        actColor = "black";
      } else if (edge.actAvail < 15) {
        actColor = "darkred";
      } else if (edge.actAvail < 30) {
        actColor = "red";
      } else if (edge.actAvail < 45) {
        actColor = "darkorange";
      } else {
        actColor = "green";
      }
      const minConnectTime = 45;
      const actAvail = edge.actAvail;
      // const actAvail2 = (outbound.schDepZ - inbound.inZ) * nano2min; // Correct
      const actSched = edge.actSched;
      const actActual = (outbound.outZ - inbound.inZ) * nano2min;
      // console.log("2nd edge, edgeSource, edgeTarget");
      // console.log(edge);
      // console.log(edgeSource);
      // console.log(edgeTarget);
      // const schedConnect =
      // const schRot
      outDiv.innerHTML = `<div>
      <h4>Connection (edge, inbound-outbound)</h4>
      <ul>
        <li>Inbound from: ${inbound.id.slice(10, 13)}</li>
        <li>Outbound to: ${outbound.id.slice(13, 16)}</li>
        <li>Sch inbound arr Zulu: ${edge.schArrInTMZ} UTC</li>
        <li>Sch outbound dep Zulu: ${edge.schDepOutTMZ} UTC</li>
        <!-- If the slack < 45 min, draw in red --> 
        <li style="color:${actColor};">Available Connection Time: ${actAvail} min </li>
        <li>Minimum Connection Time: ${minConnectTime} min</li>
        <li>Planned Connection Time (outbound.schDep-inbound.schArr): ${actSched} min </li>
        <li>Actual Connection Time (outbound.outZ-inbound.inZ): ${actActual} min </li>
        <li>Available Connection Time (outbound.schDep-inbound.inZ): ${actAvail} min </li>
        <li>Tail (inbound=>oubound): ${inbound.tail} => ${outbound.tail}</li>
        <li>Connection Time Slack: ${actAvail} - ${minConnectTime}
          = ${actAvail - minConnectTime} min</li>
      </ul> 
      </div>`;
      // <li>Available Connection Time (2) (outbound.schDep-inbound.inZ): ${actAvail2} min </li>
      //<li style="color:${actColor}>Connection Time Slack: ${actAvail} - ${minConnectTime}
      // = ${actAvail - minConnectTime} min</li>

      // How to create dynamic styling in the tooltip?
      return outDiv;
    } else {
      console.log(
        "**** THERE ARE ONLY TWO TYPE OF items AT THIS TIME!!! ERROR!!"
      );
    }
  },
});
//---------------------------------------------
// Challenge: how to pass e.item to another module?
export function setupState(graph) {
  // Mouse enter a node
  graph.on("node:mouseenter", (e) => {
    //console.log("Node mouse enter");
    const nodeItem = e.item; // Get the target item
    //console.log(nodeItem);
    //graph.hoverItemId = nodeItem._cfg.id; // new element to access from main module
    graph.setItemState(nodeItem, "hover", true); // Set the state 'hover' of the item to be true
    // graph.setItemState(nodeItem, "active", true); // Set the state 'hover' of the item to be true
  });

  graph.on("nodeselectchange", (e) => {
    const node = e.target.getModel(); // assumes single click
    // send nodeID to vuex store
    const id = node.id;
    console.log("nodeselectchange");
    store.commit("setNodeIdForConnections", id);
    // since the id is committed, I should not sent it again
    store.dispatch("computeNodeConnections", id);
    store.dispatch("computeEdgeConnections", id);
  });

  // Mouse leaves a node
  // The tooltip (and tooltip node style) on disappears when I enter another node.
  // However, if I comment out the graph.on("node:mouseleave") export function, the node tooltip style never disappears. This indictes the method is doing something, but incorrectly.

  graph.on("node:mouseleave", (e) => {
    //console.log("Node mouse exit");
    const nodeItem = e.item; // Get the target item
    //console.log(nodeItem);
    //graph.hoverItemId = null;
    graph.setItemState(nodeItem, "hover", false); // Set the state 'hover' of the item to be false
    // graph.setItemState(nodeItem, "active", false); // Set the state 'hover' of the item to be true
  });

  graph.on("edge:mouseenter", (e) => {
    //console.log("Edge mouse enter");
    const edgeItem = e.item;
    //console.log(edgeItem);
    graph.setItemState(edgeItem, "hover", true);
  });

  // Mouse leave an edge
  graph.on("edge:mouseleave", (e) => {
    //console.log("Edge mouse exit");
    const edgeItem = e.item;
    //console.log(edgeItem);
    graph.setItemState(edgeItem, "hover", false);
  });
}
//-----------------------------------------------------
export function updateNodeTypes(nodes, city) {
  nodes.forEach((node) => {
    //console.log("before if, node: ", node);
    if (node.id.includes(city)) {
      if (node.style === undefined) {
        node.style = {};
      }
      if (node.id.slice(10, 13) === city) {
        node.style.fill = "blue"; // departing city
      } else {
        node.style.fill = "black"; // arrival city
      }
      // node.size = cityNodeSize.value; // dangerous because hardcoded
    }
  });
  return nodes;
}
//-----------------------------------------------------
function pausecomp(millis) {
  var date = new Date();
  var curDate = null;
  do {
    curDate = new Date();
  } while (curDate - date < millis);
}

export function assignNodeLabels(graph) {
  // Some kind of stack overflow. THIS is identical to the version in graphImpl.js,
  // so the error must be an Antv/G6 bug! I DO NOT UNDERSTAND how this bug is possible.
  //await new Promise (r => setTimeout(r, 2000)); // wait 2 sec

  console.log("before pausecomp");
  // pausecomp(10000);

  console.log("Enter delayPropagationGraph::assignNodeLabels: ");
  const nodes = graph.getNodes();
  u.print("delayProps::assignNodeLabels, graph: ", graph);
  u.print("delayProps::assignNodeLabels, typeof nodes: ", typeof nodes);
  console.log("delayProps::assignNodeLabels, nodes: ");
  console.log(nodes);
  u.print("delayProps::assignNodeLabels, nodes[3]: ", nodes[3]);

  nodes.forEach((node) => {
    u.print("delayPropagationGraph::>> node", node);
    // const degree = graph.getNodeDegree(node, "total");
    const degree = 3;
    console.log("before updateItem");
    graph.updateItem(node, {
      // <<< ERROR, infinite recursion
      label: "gor",
    });
    console.log("after updateItem");
  });
  console.log("Exit delayPropagationGraph::assignNodeLabels");
  return nodes;
}
//-----------------------------------------------------
export function findNodesWithArrivalDelays(graph, delay = 0) {
  const fct = (node) => {
    return node.getModel().arrDelay < delay;
  };
  const nodes = graph.findAll("node", fct);
  //const xxx = graph.findAll("node", fct);
  //console.log(`findNodes, nb: ${xxx.length}`);
  nodes.forEach((node) => {
    node.hide();
  });
  graph.paint();
  return nodes;
}
//-------------------------------------------------------
export function findEdgesWithInsufficientACT(graph, act = 45) {
  const fct = (edge) => {
    return edge.getModel().actAvail > act;
  };
  const edges = graph.findAll("edge", fct);

  edges.forEach((edge) => {
    edge.hide();
  });
  graph.paint();
  return edges;
}
//--------------------------------------------------------
export function showAllEdges(graph) {
  const allEdges = graph.getEdges();
  allEdges.forEach((edge) => {
    edge.show();
  });
  graph.paint();
}
//-------------------------------------------------------
export function showAllNodes(graph) {
  const allNodes = graph.getNodes();
  allNodes.forEach((node) => {
    node.show();
  });
  graph.paint();
}
//----------------------------------------------------------
export function boundingBox(graph) {
  const nodes = graph.getNodes();
  const minX = Math.min.apply(
    Math,
    nodes.map((o) => {
      return o.getModel().x;
    })
  );
  const maxX = Math.max.apply(
    Math,
    nodes.map((o) => {
      return o.getModel().x;
    })
  );
  const minY = Math.min.apply(
    Math,
    nodes.map((o) => {
      return o.getModel().y;
    })
  );
  const maxY = Math.max.apply(
    Math,
    nodes.map((o) => {
      return o.getModel().y;
    })
  );
  console.log(`min/max x: ${minX}, ${maxX}`);
  console.log(`min/max y: ${minY}, ${maxY}`);
  //graph.fitView();
}
//----------------------------------------------------------
export function transferNodesEdgesToGraph(graph) {
  const nodes = graph.get("data").nodes;
  const edges = graph.get("data").edges;
  console.log("transfer ..., graph, nodes, edges:");
  console.log(graph);
  console.log(nodes);
  console.log(edges);
  nodes.forEach((node) => {
    graph.add("node", node, false, false);
  });

  edges.forEach((edge) => {
    graph.add("edge", edge, false, false);
  });
}
//----------------------------------------------
