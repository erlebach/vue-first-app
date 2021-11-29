/* eslint-disable no-unreachable */
import { DirectedGraph } from "@datastructures-js/graph";
// import { max, tail, update } from "lodash";
// import * as d from "./dates.js";
import * as u from "./utils.js";
import * as tier from "./Tierref.js";
// import { watchEffect } from "vue";

//--------------------------------------------------------------------
//-------------------------------------------------------
function setupEdgeProps(e, FSUm) {
  const nano2min = 1 / 1e9 / 60;
  // u.print("=> setupEdgeProps, e", e); // e.id_f, e.id_f not defined. WHY?
  // u.print("=> setupEdgeProps, FSUm", FSUm);
  e.fsu_f = FSUm[e.id_f];
  e.fsu_nf = FSUm[e.id_nf];
  // rotation only exists for fixed tails

  // CONSIDER using scheduled ACT available on all flights since we do not know the future.
  //const actAvailable = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // same as calcAvailRot
  // u.print("=> setupEdgeProps, e", e);
  const actAvailable =
    (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // same as calcAvailRot

  e.ACTAvailable = actAvailable; // Based on best estimated information
  e.ACTAvailableP = e.ACTAvailable; // Based on best estimated information
  e.ACTSlack = e.ACTAvailable - 30; // not clear required
  e.ACTSlackP = e.ACTSlack;
}
//----------------------------------------------------------------
function initializeEdges(bookings, FSUm) {
  const nano2min = 1 / 1e9 / 60;

  const fsu_undefined = Object.create(null);
  // Create two counters
  fsu_undefined._f = 0;
  fsu_undefined._nf = 0;

  // u.print("initializeEdges, bookings", bookings);

  // PROBABLY  AN ERROR IN HERE. CHECK OUT FIELDS OF VARIOUS TABLES, 2021-11-27

  bookings.forEach((e) => {
    // u.print("initializeEdges, bookings row", e);
    // u.print("bookings.forEach, e", e);
    e.fsu_f = FSUm[e.id_f];
    e.fsu_nf = FSUm[e.id_nf];

    // rotation only exists for fixed tails
    //if (e.tail) {
    // Station
    //setupEdgeProps(e, FSUm);
    //} else if (e.TAIL_f === e.TAIL_nf) {
    if (e.tail_f === e.tail_nf) {
      // PTY with tail turnaround and passengers
      setupEdgeProps(e, FSUm);
    } else {
      // CONSIDER using scheduled ACT available on all flights since we do not know the future.
      e.ACTAvailable =
        (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // same as calcAvailRot
      e.ACTAvailableP = e.ACTAvailable;
      e.ACTSlack = e.ACTAvailable - 30; // not clear required
      e.ACTSlackP = e.ACTSlack;
    }
    if (e.fsu_f === undefined) {
      fsu_undefined._f++;
    }
    if (e.fsu_nf === undefined) {
      fsu_undefined._nf++;
    }
  });
  // Additional edge attributes
  // availRotP, availRotMinReq, rotSlackP, ACTAvailableP, ACTSlackP
}
//------------------------------------------------------------------
//------------------------------------------------------------------
function initializeNodes(FSUm, bookings_in, bookings_out) {
  console.log("inside initializeNods");
  Object.values(FSUm).forEach((n) => {
    n.inbounds = bookings_in[n.id]; // could be undefined (from PTY or Sta)
    n.outbounds = bookings_out[n.id]; // could be undefined (from PTY or Sta)

    n.count = 0; // number of times the node has been handled

    // Flights that depart a Station too late arrive in PTY the next morning, and
    // are not included in the day's flights. So there are no outbounds.
    // The bookings object has no connections between arriving and departing flights
    // at  station

    if (n.ROTATION_PLANNED_TM < 60) {
      // scheduled rotation
      n.availRotMinReq = n.ROTATION_PLANNED_TM;
    } else {
      n.availRotMinReq = 60;
    }
    n.rotSlack = n.ROTATION_PLANNED_TM - n.availRotMinReq;
    n.rotSlackP = n.rotSlack;

    if (n.id.slice(10, 13) === "PTY") {
      // outbound flights from PTY
      if (n.inbounds !== undefined) {
        const obj = computeMinACT(n.inbounds, true);
        n.minId = obj.minId;
        n.minACT = obj.minACT;
        n.minACTP = n.minACT;
        n.ACTSlackP = n.minACTP - 30; // DO NOT HARDCODE 30 min
      } else {
        // u.print("inbounds undefined, id", n.id);
      }
    } else {
      // oubbound flight from station
      n.minACT = 100000; //undefined;
      n.minACTP = n.minACT;
      n.ACTSlack = 100000; //undefined;
      n.ACTSlackP = n.ACTSlack;
      n.rotSlack = 0;
      n.rotSlackP = n.rotSlack;
      n.gordon = "NONAME"; // to test Developer environemnt in Chrome

      // const calcPlannedRot =
      const calcPlannedRot = n.ROTATION_PLANNED_TM;
      if (calcPlannedRot < 60) {
        n.availRotMinReq = calcPlannedRot;
      } else {
        n.availRotMinReq = 60; //  hardcoded (min)
      }

      // Rotation time corresponds to the need time at destination
      n.availRotP = calcPlannedRot; // scheduled
      n.rotSlackP = n.availRotP - n.availRotMinReq;
    }
    n.slack = Math.min(n.rotSlack, n.ACTSlack);
    n.slackP = n.slack;
    n.depDelayP = n.depDelay; // If flight to study has no delay, it will have no impact.
    n.arrDelayP = n.arrDelay; // Best guess
  });
}

// Additional node attributes
// minACTP, ACTSlackP, slackP, depDelayP, arrDelayP, minId, minAct, minACTP

// Additional edge attributes
// availRotP, availRotMinReq, rotSlackP, ACTAvailableP, ACTSlackP

//-----------------------------------------------------------------
function printEdgeData(f, msg) {
  console.log(`\n-----  Print edge: ${msg}   ----------------------------`);
  console.log(f);
  console.log(`      id_f: ${f.id_f}`);
  console.log(`      id_nf: ${f.id_nf}`);
  console.log(`      ACTAvailable: ${f.ACTAvailable}`);
  console.log(`      ACTAvailableP: ${f.ACTAvailableP}`);
  console.log(`      ACTSlack: ${f.ACTSlack}`);
  console.log(`      ACTSlackP: ${f.ACTSlackP}`);
  console.log(`      arrDelay_f: ${f.fsu_f.arrDelay}`);
  console.log(`      arrDelayP_f: ${f.fsu_f.arrDelayP}`);
  console.log(`      depDelay_f: ${f.fsu_nf.depDelay}`);
  console.log(`      depDelayP_f: ${f.fsu_nf.depDelayP}`);
  // availRotP, availRotMinReq, rotSlackP, ACTAvailableP, ACTSlackP
  console.log("");
  // minACTP, ACTSlackP, slackP, depDelayP, arrDelayP, minId, minACT
}
//-----------------------------------------------------------------
function printNodeData(f, msg = "") {
  console.log(`\n-----   Print Node: ${msg}   ----------------------------`);
  console.log(f);
  console.log(`      Id: ${f.id}`);
  console.log(`      depDelay: ${f.depDelay}`);
  console.log(`      arrDelay: ${f.arrDelay}`);
  console.log(`      depDelayP: ${f.depDelayP}`);
  console.log(`      arrDelayP: ${f.arrDelayP}`);
  console.log(`      ACTSlackP: ${f.ACTSlackP}`);
  console.log(`      slack: ${f.slack}`);
  console.log(`      slackP: ${f.slackP}`);
  console.log(`      minACT: ${f.minACT}`);
  console.log(`      minACTP: ${f.minACTP}`);
  console.log(`      rotSlack: ${f.rotSlack}`);
  console.log(`      rotSlackP: ${f.rotSlackP}`);
  console.log("");
  // minACTP, ACTSlackP, slackP, depDelayP, arrDelayP, minId, minACT
}
//---------------------------------------------------------------
function resetDelays(dFSU, bookings) {
  dFSU.forEach((n) => {
    n.INP_DTMZ = n.SCH_ARR_DTMZ;
    n.OUTP_DTMZ = n.SCH_DEP_DTMZ;
  });
  // u.print("bookings", bookings);
  bookings.forEach((b) => {
    b.INP_DTMZ_f = b.SCH_ARR_DTMZ_f;
    b.INP_DTMZ_nf = b.SCH_ARR_DTMZ_nf;
    b.OUTP_DTMZ_f = b.SCH_DEP_DTMZ_f;
    b.OUTP_DTMZ_nf = b.SCH_DEP_DTMZ_nf;
  });
}
//---------------------------------------------------------------
function getOrig(id) {
  return id.slice(10, 13);
}
function getDest(id) {
  return id.slice(13, 16);
}
//---------------------------------------------------------------
function createId2Level(ids) {
  // const nb_tiers = tier.getTier.value;
  // console.log(`====> enter createId2Level, nb_tiers: ${nb_tiers}`);
  // u.print(`nb_tiers: ${nb_tiers.value}`);

  const id2level = {};
  const level2ids = {};
  const nb_tiers = 6;
  for (let i = 0; i <= nb_tiers; i++) {
    level2ids[i] = [];
  }

  // ids.forEach((id) => {
  //   console.log(`id: ${id}`);
  // });

  let nextId = 0;

  for (let level = 0; level < nb_tiers; level++) {
    while (nextId >= 0) {
      const id = ids[nextId];
      if (typeof id === "undefined") break;
      const from = getOrig(id);
      if (level % 2 === 0) {
        if (from === "PTY") break;
      } else {
        if (from !== "PTY") break;
      }
      id2level[id] = level;
      level2ids[level].push(id);
      nextId++;
    }
  }

  // Depending on the number of tiers, select a susbset

  // u.print("id2level: ", { ...id2level });
  // u.print("level2ids: ", { ...level2ids });

  // Recreate ids using only the useful Tiers
  console.log(`nb ids: ${ids.length}`);
  // How to remove all elements from ids array without changing its address
  ids.length = 0;
  for (let tier = 0; tier < nb_tiers; tier++) {
    ids.push(...level2ids[tier]);
  }
  // // // // console.log(`nb_tiers: ${nb_tiers}`);
  // // // u.print("ids: ", ids);
  // // console.log(`length ids: ${ids.length}`);
  // console.log("--------------------------------");
  // u.print("new ids: ", ids);
  return { id2level, level2ids };
}
//---------------------------------------------------------------
export function rigidModel(
  dFSU, // values
  bookings,
  bookings_in,
  bookings_out,
  edges,
  initialArrDelayP, // delay applied to startingid
  startingId
) {
  // watchEffect(() => {
  //   console.log(`top of rigidModel, r= ${r.getPost.value}`);
  // });
  // checkEdgeSta(); // Debugging
  // checkEdgePTY(); // Debugging

  // Store minAvail Connection time and connection time slack with the outgoing flight

  // make all flights arrive and depart on time. Update IN and OUT accordingly.
  // IN -> INP, and OUT -> OUTP. Use INP and OUTP in calculations below.
  // For now, ignore OFF and ON

  resetDelays(dFSU, bookings);
  const FSUm = u.createMapping(dFSU, "id");

  // End letter P refers to "Propagated" or "Predicted"

  // Edges must be initialized before nodes in order to compute minACT
  initializeEdges(bookings, FSUm);
  initializeNodes(FSUm, bookings_in, bookings_out);

  // Initial Node. Add a delay of initialArrDelayPa
  // Rotation at STA is irrelevant. There is no PAX on this return flight.

  u.print("=> rigidModel, startingId", startingId);
  u.print("=> FSUm", FSUm);

  if (FSUm[startingId] === undefined) {
    // Should be done higher up the chain
    return null;
  }

  if (initialArrDelayP) {
    console.log(`startingId: ${startingId}`);
    u.print(`FSUm[${startingId}]`, FSUm[startingId]);
    FSUm[startingId].arrDelayP = initialArrDelayP;
    FSUm[startingId].rotSlackP -= initialArrDelayP;
  } else {
    // Arrival delay as given in FSU table
    // Ideally should be set to ETA, which updates every 15 min or so.
    FSUm[startingId].arrDelayP = FSUm[startingId].ARR_DELAY_MINUTES;
  }

  const outs = bookings_out[startingId];

  const graph = createGraph(edges, bookings_in, bookings_out);
  const id = startingId;

  let countUndefined = 0;
  let countDefined = 0;

  // Start the analysis, run through the graph, breadth-first
  // Starting with root_id leaving a Sta and flying to PTY.
  // Consider the impact of a late arrival on all outgoing flights.
  // For each outgoing flight, evaluate the minACT. Update the
  // departureP and arrivalP delays of the outgoing flights if necessary.
  // also update slackP (ACTslack, or min(ACTslack, ROTslack)
  // At PTY, there are many outgoing flights connected to single feeder.
  // At a Station, there is only a single returning flight to PTY we are
  // considering in the analysis with the same tail.

  dFSU.forEach((f) => {
    if (f.arrDelayP > 0) {
      const outbounds = bookings_out[f.id];
      const inbounds = bookings_in[f.id];
    }
  });

  let countUndef = 0;
  let countDef = 0;

  const ids = [];
  let count = 0;

  // return null; // REMOVE. SIMPLY THERE FOR DEBUGGING. Sept. 9, 2021

  console.log("TRAVERSE GRAPH, endpointRigidModel");
  console.log(`id: ${id}`);
  u.print("bookings_in", bookings_in);
  u.print("bookings_out", bookings_out);
  u.print("bookings", bookings);
  u.print("FSUm", FSUm);
  // DEBUG
  // bookings.forEach((r) => {
  //   if (r.id_f === id || r.id_nf === id) {
  //     u.print("MIA row in bookings", r);
  //   }
  // });

  const idsTraversed = [];

  graph.traverseBfs(id, (key, values) => {
    // outgoing flight from PTY
    idsTraversed.push(key);
    count += 1;
    // console.log("-------------------------------------");
    const isUndefined = propDelayNew(key, bookings_in, FSUm);
    ids.push([key, isUndefined]);
    countUndef += isUndefined;
    countDef += 1 - isUndefined;
  });

  // console.log("\nAfter Traverse All nodes with arrival DelayP > 0\n");
  const nodesWithArrDelay = [];
  // u.print("idsTraversed: ", idsTraversed);

  // return a dictionary that returns the level for any id
  // also return a dictionary that returns a list of ids for each level
  console.log(`before createId2Level, idsTraversed: ${idsTraversed.length}`);
  const obj = createId2Level(idsTraversed);
  console.log(`after createId2Level, idsTraversed: ${idsTraversed.length}`);
  const id2level = obj.id2level; // there is better approach.
  const level2ids = obj.level2ids;

  // idsTraversed is not used later
  // Rather, arrDelayP, and other attributes are computed in dFSU

  dFSU.forEach((f) => {
    const arrDelayP = f.arrDelayP;
    if (arrDelayP > 0) {
      nodesWithArrDelay.push(f);
      // console.log(`id: ${f.id}, arrDelayP: ${arrDelayP}`);
      // printNodeData(f, "Nodes with delayP>0");
    }
    if (f.count > 1) {
      console.log(`(${f.id}: count: ${f.count} cannot be greater than 1!`);
    }
  });

  // All edges that have arrival delay_f > 0
  const edgesWithInArrDelay = [];

  bookings.forEach((b) => {
    if (b.fsu_f.arrDelayP > 0) {
      edgesWithInArrDelay.push(b);
    }
  });

  // console.log("Edges with In Arrival Delay");
  // console.log(u.createMapping(edgesWithInArrDelay, "id_f"));
  return {
    nodes: nodesWithArrDelay,
    edges: edgesWithInArrDelay,
    level2ids,
    id2level,
  };
}
//---------------------------------------------------------------------
function updateInboundEdges(outboundNode, bookings_in) {
  const nano2min = 1 / 1e9 / 60;

  // Delay: ARR_DELAY_MIN and arrDelayP (not the same)
  const node = outboundNode; // feeder node

  u.print("updateInboundEdges, (feeder) outboundNode", outboundNode);
  //u.print("updateInboundEdges, bookings_in", bookings_in);

  const inboundEdges = bookings_in[outboundNode.id];
  u.print("updateInboundEdges, inboundEdges", inboundEdges);

  // u.print("inboundEdge:", inboundEdges);
  if (inboundEdges === undefined) {
    return null;
  }

  inboundEdges.forEach((e) => {
    // u.print("updateInboundEdges, inboundEdge", e);
    e.ACTAvailable = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // same as calcAvailRot

    // ACTAvailable is based on scheduled departure and arrival times
    const arrDelayP = e.fsu_f.arrDelayP;
    e.ACTAvailableP = e.ACTAvailable - arrDelayP; // Based on best estimated information
    e.ACTSlackP = e.ACTAvailableP - 30; // harcoded, but really, a function of city/airport

    // update rotation
    if (e.tail_f === e.tail_nf) {
      e.rotSlackP = e.rotSlack - e.arrDelayP;
    }
  });
  return null;
}
//-------------------------------------------------------------
function updateOutboundNode(node, bookings_in) {
  const n = node;

  // if an ETA changes, the flight arrival delay increases or decreases.
  // This immediately affects rotSlackP according to
  // rotSlackP = rotSlack - arrDelay, where rotSlack is the initial value

  const feeders = bookings_in[node.id];
  if (feeders === undefined) {
    return undefined;
  }

  if (n === undefined || n.inbounds === undefined) {
    return undefined;
  }

  n.count += 1; // This number should never go beyond 1

  if (n.id.slice(10, 13) === "PTY") {
    // outbound flights from PTY
    console.log(" . outbound flight from PTY");
    if (n.inbounds !== undefined) {
      const obj = computeMinACT(n.inbounds, true);
      n.minId = obj.minId;
      n.minACT = obj.minACT;
      n.minACTP = n.minACT; // CHANGE FORMULA
      n.ACTSlackP = n.minACTP - 30; // DO NOT HARDCODE 30 min
    }
  } else {
    n.minACT = 100000; //undefined;
    n.minACTP = n.minACT;
    n.ACTSlack = 100000; //undefined;
    n.ACTSlackP = n.ACTSlack;
    // update Rotation rotSlackP
    const nano2min = 1 / 1e9 / 60;
    const e = n.inbounds[0];
    n.rotAvail = (n.SCH_DEP_DTMZ - e.fsu_f.INP_DTMZ) * nano2min;
    n.rotSlack = n.rotAvail - n.availRotMinReq;
    n.rotSlackP = n.rotSlack - e.fsu_f.arrDelayP;
    // Each node should only be touched once.
  }
  // Not sure about rotSlackP. Must look into that.  ****** DEBUG
  n.slackP = Math.min(n.rotSlackP, n.ACTSlackP);
  if (n.slackP < 0) {
    n.depDelayP = -n.slackP; // If flight to study has no delay, it will have no impact.
    n.arrDelayP = n.depDelayP;
    //-------------------
  } else {
    // Flights never leave early.
    n.depDelayP = 0; // If flight to study has no delay, it will have no impact.
    n.arrDelayP = 0;
  }
  return undefined;
}
//-------------------------------------------------------------------------
// Remove duplicated class to processOutboundFlightss
function propDelayNew(id, bookings_in, FSUm) {
  // id is an incoming flight (either to PTY or to Sta)
  // console.log("INSIDE propDelayNew");
  updateInboundEdges(FSUm[id], bookings_in);
  updateOutboundNode(FSUm[id], bookings_in);

  return 0; // not sure what I am returning
}

//--------------------------------------------------------------------------
function createGraph(edges, bookings_in, bookings_out) {
  // Enter the edges into a graph
  const graph = new DirectedGraph();

  // u.print("inside createGraph, edges", edges);

  // DANGER: MODIFYING ORIGINAL ARRAY.
  // Safer to copy the array. Will this work if data is updated dynamically?

  // Generate vertices from edges. Each vertex appears only once
  const nodes = new Set();
  edges.forEach((e) => {
    nodes.add(e.src);
    nodes.add(e.dst);
  });

  nodes.forEach((n) => {
    graph.addVertex(n);
  });

  edges.forEach((e) => {
    graph.addEdge(e.src, e.dst);
  });

  const sources = Object.create(null);
  const targets = Object.create(null);
  graph.sources = sources;
  graph.targets = targets;

  nodes.forEach((n) => {
    sources[n] = [];
    targets[n] = [];
  });

  let edges_undefined = 0;

  edges.forEach((e) => {
    const src = e.src;
    const dst = e.dst;
    if (targets[src] === undefined) {
      // never entered
      edges_undefined++;
    } else {
      targets[src].push(dst);
    }
    if (sources[dst] === undefined) {
      edges_undefined++;
    } else {
      sources[dst].push(src);
    }
  });

  graph.help =
    "targets[srcid] returns all the outbounds of the srcid inbound\n" +
    " sources[srcid] returns all the inbounds of the destid outbound";

  return graph;
}
//--------------------------------------------------------------------------
// Minimum Available Connection Time for Pax for flight "id"
// id is an outgoing flight
// function computeMinACT(feeders, bookings_f, bookings_nf, id) {
// function assumes that inbounds is well formed.
// The function is called by a node. The function collects information  on
// all edges connected to this node to estimate the minimum ACT
function computeMinACT(inbounds, FSUm = undefined, verbose = false) {
  const nano2min = 1 / 1e9 / 60;
  // track which inbound is responsible for the minACT.
  let a = undefined;
  const obj = Object.create(null);
  obj.minACT = 100000;

  inbounds.forEach((i) => {
    if (i.ACTAvailableP < obj.minACT) {
      const inboundMinId = i.id_f;
      obj.minACT = i.ACTAvailableP;
      obj.inboundMinId = inboundMinId;
    }
  });

  return obj;
}
