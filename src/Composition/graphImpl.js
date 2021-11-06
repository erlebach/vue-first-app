/* eslint-disable no-unreachable */
import * as u from "../Composition/utils.js";
import G6 from "@antv/g6";
import store from "../store/index.js";
import {
  getStyles,
  getStyle,
  prettyDOM,
  debugDOM,
  printDOMTree,
  traverseDOMTree,
} from "./printDomTree.js";

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
        fill: "steelBlue", // color is accepted
        stroke: "#666",
        lineWidth: 0.2,
      },
      labelCfg: {
        style: {
          fill: "#fff",
        },
      },
    },
    defaultEdge: {
      type: "line",
      //label: "gordon",
      labelCfg: {
        autoRotate: true,
        position: "middle",
      },
      style: {
        stroke: "darkorange", // I could not overide
        lineWidth: 2.0,
        lineAppendWidth: 3, // only used to help select the edge
        startArrow: false,
        endArrow: {
          // ARROWS ARE NOT DISPLAYING. THEY USED TO.
          path: G6.Arrow.triangle(4, 6, 7), // width, length, offset
          //d: 5, // not part of the style
        },
      },
    },
    nodeStateStyles: {
      hover: {
        //fill: "purple",
        size: 10, // Nodes do not resize on hover
        lineWidth: 4,
      },
      table: {
        stroke: "green",
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
      // table: {
      //   // exagerated values for checking
      //   stroke: "red",
      //   lineWidth: 10,
      // },
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
      type: "concentric",
      preventOverlap: true,
      nodeSize: 0, // diameter of node (not working correctly)
      minNodeSpacing: 5, // diameter of node
      equidistant: false,
      //sortBy: "degree",
      //center: [300, 300],
    },
    /*
    layout: {
      type: "force",
      preventOverlap: true,
      nodeSpacing: 1,
      edgeStrength: 0.9,
      linkDistance: 50,
      nodeSize: 15,
      WorkerEnabled: true,
      layoutEnd: () => alert("Layout ended"),
      alphaMin: 0.07,
      alphaDecay: 0.02,
    },
    */
    plugins: [myTooltip],
    // modes: {
    // default: [
    // {
    // Only shows connected edges and source nodes, along with the selected node. StrangeF.
    //type: "activate-relations",
    //resetSelected: True, // Not clear what this does
    // },
    // ],
    // },
  };
  return configuration;
}
//-----------------------------------------
export function colorEdges(graph) {
  let color;
  //console.log("Enter colorEdges in graphImpl.js");
  //u.print("graphImpl, graph: ", graph);

  // Why is this not entered until first city called?

  graph.edge((edge) => {
    // u.print("graphImpl: colorEdges: ", edge);
    if (edge.actAvail < 5) {
      color = "black";
    } else if (edge.actAvail < 15) {
      color = "darkred";
    } else if (edge.actAvail < 30) {
      color = "red";
    } else if (edge.actAvail < 45) {
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
    const O = node.id.slice(10, 13);
    const D = node.id.slice(13, 16);
    if (O === "PTY") {
      delay = node.depDelay;
      strokeDelay = node.arrDelay;
    } else if (D === "PTY") {
      delay = node.arrDelay;
      strokeDelay = node.depDelay;
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
  graph.on("nodeselectchange", (e) => {
    const node = e.target.getModel(); // assumes single click
    // send nodeID to vuex store
    //console.log("graphInpl, nodeselectchange");
    const id = node.id;
    // console.log(`Gorddon id: ${id}`);
    store.commit("setNodeIdForConnections", id);
    // I could also compute the next two lines lazily, when I need the
    // data. On the other hand, I compute them before they are required,
    // soft of a pre-fetch.
    store.dispatch("computeEdgeConnections", id);
    // setup connectionGraphData
    const data = {};
    data.nodes = store.getters.connectionNodes;
    data.edges = store.getters.connectionEdges;
    store.commit("setConnectionData", data);
  });

  // Mouse enter a node
  graph.on("node:mouseenter", (e) => {
    const nodeItem = e.item; // Get the target item
    graph.setItemState(nodeItem, "hover", true);
  });

  // Mouse leaves a node
  // The tooltip (and tooltip node style) on disappears when I enter another node.
  // However, if I comment out the graph.on("node:mouseleave") function, the node tooltip style never disappears. This indictes the method is doing something, but incorrectly.

  graph.on("node:mouseleave", (e) => {
    const nodeItem = e.item; // Get the target item
    graph.setItemState(nodeItem, "hover", false);
  });

  graph.on("edge:mouseenter", (e) => {
    const edgeItem = e.item;
    graph.setItemState(edgeItem, "hover", true);
  });

  // Mouse leave an edge
  graph.on("edge:mouseleave", (e) => {
    const edgeItem = e.item;
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
export function assignNodeLabels(graph) {
  // console.log("Enter graphImpl::assignNodeLabel");
  const nodes = graph.getNodes();
  // u.print("graphImpl::assignNodeLabels, graph: ", graph);
  // u.print("graphImpl::assignNodeLabels, typeof nodes: ", typeof nodes);
  // console.log("graphImpl::assignNodeLabels, nodes: ");
  // console.log(nodes);
  // u.print("graphImpl::assignNodeLabels, nodes[3]: ", nodes[3]);
  nodes.forEach((node) => {
    graph.updateItem(node, {
      label: node.getModel().hubConnections,
    });
  });
  // console.log("Exit graphImpl::assignNodeLabels");
  return nodes;
}
//-----------------------------------------------------
//public findAll<T extends Item>(type: ITEM_TYPE, fn: (item: T, index?: number) => boolean): T[] {
function findAll(graph, type, fn) {
  const result = [];

  console.log("findAll, nb items");
  console.log(graph.get(`${type}s`).length);
  // each(this.get(`${type}s`), (item, i) => {
  graph.get(`${type}s`).forEach((item, i) => {
    if (fn(item, i)) {
      result.push(item);
    }
  });

  return result;
}
//-----------------------------------------------------
export function findNodesWithArrivalDelays(graph, delay = 0) {
  const fct = (node) => {
    return node.getModel().arrDelay < delay;
  };
  const nodes = graph.findAll("node", fct);
  //const nodes = findAll(graph, "node", fct);
  //const xxx = graph.findAll("node", fct);
  //console.log(`findNodes, nb: ${xxx.length}`);
  nodes.forEach((node) => {
    node.hide();
  });
  //graph.paint();
  return nodes;
}
//-------------------------------------------------------
export function findEdgesWithInsufficientACT(graph, act = 45) {
  // Return an array of edges whose ACT is greater
  // than "act" provided as an argument
  const fct = (edge) => {
    return edge.getModel().actAvail > act;
  };
  const edges = graph.findAll("edge", fct);
  //const edges = findAll(graph, "edge", fct);

  edges.forEach((edge) => {
    edge.hide();
  });
  //graph.paint();
  // console.log(`nb hidden edges: ${edges.length}`);
  // console.log(`act: ${act}`);
  return edges;
}
//--------------------------------------------------------
export function showAllEdges(graph) {
  const allEdges = graph.getEdges();
  allEdges.forEach((edge) => {
    edge.show();
  });
  //graph.paint();
}
//-------------------------------------------------------
export function showAllNodes(graph) {
  const allNodes = graph.getNodes();
  allNodes.forEach((node) => {
    node.show();
  });
  //graph.paint();
}
//----------------------------------------------------------
export function boundingBox(graph) {
  const nodes = graph.getNodes();
  const minX = Math.min.apply(
    Math,
    nodes.map(function(o) {
      return o.getModel().x;
    })
  );
  const maxX = Math.max.apply(
    Math,
    nodes.map(function(o) {
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
    nodes.map(function(o) {
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
  //console.log("transfer ..., graph, nodes, edges:");
  //console.log(graph);
  //console.log(nodes);
  //console.log(edges);
  nodes.forEach((node) => {
    graph.add("node", node, false, false);
  });

  edges.forEach((edge) => {
    graph.add("edge", edge, false, false);
  });
}
//----------------------------------------------
