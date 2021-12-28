/* eslint-disable no-unreachable */
// import { DirectedGraph } from "@datastructures-js/graph";
import * as u from "./utils.js";
import * as tier from "./Tierref.js";
import { sortBy } from "lodash";
import * as hasher from "node-object-hash";
import { containsProp } from "@vueuse/core";
import * as dt from "./dates.js";
// import { watchEffect } from "vue";

let gcounter = 0;

//--------------------------------------------------------------------
// rigidModel depends on parameters in the user interface.

export function rigidModel(
  dFSU1, // values
  dBookings1,
  graph,
  initialArrDelayP, // delay applied to startingid
  maxArrDelay,
  startingId
) {
  // u.print("rigidModel::graph", graph);
  // dBookings1, dFSU1, dTails1, are copies to protect against overwriting elements. (Does not solve error)
  // These are arrays of Objects. The copy ([...]) copies the references (object addresses), but not the object content.
  // I need a deep copy.
  // Still does not work without the copy operation.
  const dFSU = u.arrOfObjectsCopy(dFSU1);
  const bookings = u.arrOfObjectsCopy(dBookings1);

  // id is a composite of id_f and id_nf separated by a '-'
  const bookingsIdMap = u.createMapping(bookings, "id"); // CHECK

  // Store minAvail Connection time and connection time slack with the outgoing flight
  // Arguments:
  // initialArrDelayP: delay to impose on the startingId flight for experimentation
  // make all flights arrive and depart on time. Update IN and OUT accordingly.
  // IN -> INP, and OUT -> OUTP. Use INP and OUTP in calculations below.
  // For now, ignore OFF and ON

  // resetDelays(dFSU, bookings); // Might not be required
  const FSUm = u.createMapping(dFSU, "id");

  // u.print("rigidModel::FSUm", FSUm);
  // u.print("rigidModel::dFSU", dFSU);

  // End letter P refers to "Propagated" or "Predicted"

  // Edges must be initialized before nodes in order to compute minACT
  initializeEdges(bookings, FSUm); // does not depend on intial delay
  initializeNodes(FSUm, bookingsIdMap);

  // UP UNTIL THIS POINT, there is no dependence on maxArrDelay and initialArrDelayP

  // Initial Node. Add a delay of initialArrDelayPa
  // Rotation at STA is irrelevant. There is no PAX on this return flight.

  // depends on arguments. Should probably be called elsewhere
  setInitialDelays(FSUm, initialArrDelayP, startingId);

  // const outs = bookings_out[startingId];

  // This is the graph to traverse

  // Start the analysis, run through the graph, breadth-first
  // Starting with root_id leaving a Sta and flying to PTY.
  // Consider the impact of a late arrival on all outgoing flights.
  // For each outgoing flight, evaluate the minACT. Update the
  // departureP and arrivalP delays of the outgoing flights if necessary.
  // also update slackP (ACTslack, or min(ACTslack, ROTslack)
  // At PTY, there are many outgoing flights connected to single feeder.
  // At a Station, there is only a single returning flight to PTY we are
  // considering in the analysis with the same tail.

  // Depends on startingId, so should be done elsewhere. Every time
  // a new id is selected
  // u.print("before traverseGraph, graph ", graph);
  let { idsTraversed, edgesTraversed } = traverseGraph(
    startingId,
    graph,
    bookingsIdMap,
    dFSU,
    FSUm
  );
  // u.print("after traverseGraph, graph ", graph);

  // Map to access levels and ids (using the ids traversed starting with the flight startingId)
  const { id2level, level2ids } = createId2Level(idsTraversed);

  // console.log(`before, edgesTraversed.length: ${edgesTraversed.length}`);
  edgesTraversed = makeUnique(edgesTraversed); // already no duplicates.

  const nodesTraversed = [];
  for (let id in id2level) {
    nodesTraversed.push(FSUm[id]);
  }

  nodesTraversed.forEach((r) => {
    // divide by 1000: ns to ms
    const dep = dt.timestampToDateTimeZ(r.SCH_DEP_DTMZ / 1000);
    r.schDepTMZ = dep.dtz + ", " + dep.tmz;
    const arr = dt.timestampToDateTimeZ(r.SCH_ARR_DTMZ / 1000);
    r.schArrTMZ = arr.dtz + ", " + arr.tmz;
    r.tail = r.TAIL;
  });

  // subset of flights and bookings with predicted arrival delay (arrDelayP)
  // greater than maxArrDelay
  // I could call this function before traversing graph, and overwrite dFSU and dBookings
  // Alternatively, I could only return edgesTraversed connecting two flights with incoming
  // arrival delay greater than some amount. (NOT DONE)
  const {
    nodesWithArrDelay,
    edgesWithArrDelay,
  } = computeNodesEdgesWithArrDelay(dFSU, bookings, maxArrDelay);

  // graphEdges: all edges traversed. Traverse tree starting with selected ID.
  // The edges are formed from the inbounds to each node connected to the node.

  // I am not sure graphEdges are needed
  // u.print("rigidModel::edgesTraversed (Set)", edgesTraversed);
  // Only keep unique edges

  // Remove from graphEdges all edges that do not connect two nodes
  // Note that some node were removed, so ss owill also be removed

  // id2level contains all the nodes that were traversed (whether there is delay or not)
  // newEdges only contains edges between nodes that were traversed
  // Note that the rigid model takes feeders into account that are not part of the traversed nodes.
  // The traversed nodes originate at startId, and consider the outbounds recursively.

  // I really should return all nodes, but only draw the nodes with propagation delay > 0
  return {
    // The next two lines are NOT the nodes traveresed. They are a subset of bookings
    nodes: nodesWithArrDelay, // bookings with arrDelayP > maxArrDelay
    edges: edgesWithArrDelay, // not useful
    // these are the edges between the nodes that were traversed.
    // the nodes traversed are computed elsewhere, in the vue code
    edgesTraversed, // this is the graph we wish to plot (without inbounds)
    nodesTraversed, // this is the graph we wish to plot (without inbounds)
    level2ids,
    id2level,
  };
}
//-------------------------------------------------------
function initializeEdges(bookings, FSUm) {
  const ms2min = 1 / 1e3 / 60;
  const milli2min = 1 / 1e3 / 60;

  const fsu_undefined = Object.create(null);
  // Create two counters
  fsu_undefined._f = 0;
  fsu_undefined._nf = 0;

  // u.print("initializeEdges::bookings", sortBy(bookings, "id_f"));

  // Be careful.
  // Scheduled Rotation: based on scheduled departure and a arrival time (an edge attribute)
  // availRotMinReq: A fixed value usual set at 60 min. Sometimes can change from airport to airport. So set for each edge separately
  //   If the schedule rotation time allows for less than 60 min, set availRotMinReq to this value.
  // availRot: should be set

  let countTailTails = 0;

  bookings.forEach((e) => {
    const row_f = FSUm[e.id_f];
    const row_nf = FSUm[e.id_nf];
    if (row_f === undefined || row_nf === undefined) {
      u.print(
        `bookings, row_f or row_nf undefined, id_f: ${e.id_f}, id_nf: ${e.id_nf}`,
        "SHOULD NOT HAPPEN"
      );
    }

    // Following information might be better set in text-processing when the data is read in from the endpoint
    // On the other hand, in the future, the data might be read or load from another source, so setting the data here
    // might be better. The best approach remains unclear.

    // Scheduled available connection time for passengers (PAX)
    // e.ACTAvailable = (row_nf.SCH_DEP_DTMZ - row_f.SCH_ARR_DTMZ) * nano2min; // same as calcAvailRot
    // Predicted PAX connection time (initially set to available time)
    e.ACTAvailableP = e.ACTAvailable;
    // Available time slack: how much time is available beyond the minimum requirements (usually airport-dependent)
    // e.minAvailable = 30;
    // e.ACTSlack = e.ACTAvailable - e.minAvailable;
    e.ACTSlackP = e.ACTAvailableP - 30; // SHOULD BE DEFINED

    // e.availRot = undefined;
    e.availRotP = 10000; // Rotationa does not apply. Need a number to calculate e.availSlackP correctly
    // e.availRotMinReq = undefined;
    // e.rotSlack = undefined;
    e.availRotSlackP = 10000;
    e.slackP = Math.min(e.availRotSlackP, e.ACTSlackP);
    if (isNaN(e.slackP)) {
      console.log(
        `1. e.availRotSlackP (${e.availRotSlackP}) or e.ACTSlackP (${e.ACTSlackP}) not a number. SHOULD NOT HAPPEN`
      );
      console.log(`e.ACTAvailableP: ${e.ACTAvailableP}`); // UNDEFINED
    }
    // rotation only exists for fixed tails
    if (e.tail_f === e.tail_nf) {
      // console.log("==> initializeEdges, single tail rotation");
      countTailTails++;
      // PTY with tail turnaround and passengers
      // Setup rotation parameters and rotation slack
      // setupEdgeProps(e, FSUm);
      // Scheduled rotation time is the same as avaiable connection time.
      e.schedRot = (row_nf.SCH_DEP_DTMZ - row_f.SCH_ARR_DTMZ) * ms2min; // same as calcAvailRot
      // Available rotation is based on best estimates for feeder arrival and outbound departure times
      e.availRotMinReq = 60;
      // e.availRot = (row_nf.estDepTime - row_f.estArrTime) * milli2min;
      e.availRotP = e.availRot;
      e.ACTAvailableP = e.availRotP;
      e.ACTSlackP = e.ACTAvailableP - 30; // hardcoded for now. WILL CHANGE LATER
      //e.rotSlack = e.availRot - e.availRotMinReq; // slack can be negative (slack to spare)
      // e.availRotSlack = e.availRot - e.availRotMinReq; // slack can be negative (slack to spare)
      e.availRotSlackP = e.availRotSlack;

      e.slackP = Math.min(e.availRotSlackP, e.ACTSlackP);
      if (isNaN(e.slackP))
        console.log(
          "2. e.availRotSlackP or e.ACTSlackP not a number. SHOULD NOT HAPPEN"
        );
    }
  });
}
//------------------------------------------------------------------
function initializeNodes(FSUm, bookingsIdMap) {
  // Initialize all records in FSUm
  Object.entries(FSUm).forEach((entry) => {
    const [k, r] = entry;
    r.level = -1; // MUST FIX
    r.slackP = r.slack;
    r.arrDelayP = r.arrDelay;
    r.depDelayP = r.depDelay;
    // console.log(
    //   `initializeNodes, arrDelay: ${r.arrDelay}, depDelay: ${r.depDelay}`
    // );
    // console.log(
    //   `initializeNodes, arrDelayP: ${r.arrDelayP}, depDelayP: ${r.depDelayP}`
    // );
    const obj = computeMinACT(r.id, bookingsIdMap, r.inboundIds);
    // u.print("computeMinACT, obj", obj);
    r.minACT = obj.minACT;
    r.ACTSlack = r.minACT - 30; // hardcoded 30
    r.minACTP = r.minACT;
    r.ACTSlackP = r.ACTSlack;
    r.inboundMinId = obj.inboundMinId;
  });
}
//------------------------------------------------------------------
function printEdgeData(f, msg) {
  console.log(`\n-----  Print edge: ${msg}   ----------------------------`);
  console.log(f);
  console.log(`      id_f: ${f.id_f}`);
  console.log(`      id_nf: ${f.id_nf}`);
  console.log(`      ACTAvailable: ${f.ACTAvailable}`);
  console.log(`      ACTAvailableP: ${f.ACTAvailableP}`);
  console.log(`      ACTSlack: ${f.ACTSlack}`);
  console.log(`      ACTSlackP: ${f.ACTSlackP}`);
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
  // console.log(`      rotSlack: ${f.rotSlack}`);
  // console.log(`      rotSlackP: ${f.rotSlackP}`);
  console.log("");
  // minACTP, ACTSlackP, slackP, depDelayP, arrDelayP, minId, minACT
}
//---------------------------------------------------------------
function resetDelays(dFSU, bookings) {
  dFSU.forEach((n) => {
    n.INP_DTMZ = n.SCH_ARR_DTMZ;
    n.OUTP_DTMZ = n.SCH_DEP_DTMZ;
  });
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
  // ids are obtained by traversing the graph starting with initialId
  // const nb_tiers = tier.getTier.value;
  // console.log(`====> enter createId2Level, nb_tiers: ${nb_tiers}`);
  // u.print(`nb_tiers: ${nb_tiers.value}`);

  const id2level = {};
  const level2ids = {};
  const nb_tiers = 10; // set to some arbitrary maximum (could lead to errors)
  for (let i = 0; i <= nb_tiers; i++) {
    level2ids[i] = [];
  }

  let nextId = 0;
  const idStart = ids[0];
  // u.print("createid2Level, ids: ", ids);
  const offsetEven = getOrig(idStart) === "PTY" ? 1 : 0;
  // u.print("createId2Level, ids", ids);

  for (let level = 0; level < nb_tiers; level++) {
    // Both a while(true) and for(;;) lead to out of memory errors. Strange since the break out
    // of the loop is the same in all cases.
    while (nextId >= 0) {
      const id = ids[nextId];
      if (typeof id === "undefined") break;
      const from = getOrig(id);
      if (level % 2 === offsetEven) {
        if (from === "PTY") break;
      } else {
        if (from !== "PTY") break;
      }
      id2level[id] = level;
      level2ids[level].push(id);
      nextId++;
    }
  }

  // Recreate ids using only the useful Tiers
  // console.log(`nb ids: ${ids.length}`);
  // How to remove all elements from ids array without changing its address
  ids.length = 0;
  for (let tier = 0; tier < nb_tiers; tier++) {
    ids.push(...level2ids[tier]);
  }
  return { id2level, level2ids };
}
//---------------------------------------------------------------
function updateOutboundNodeNew(id_nf, FSUm, bookingsIdMap) {
  //node) {
  // update of a single node
  // const n = node;
  const n = FSUm[id_nf];
  // console.log("=========== updateOutboundNode ====================");
  // u.print("=== n", n);

  // if an ETA changes, the flight arrival delay increases or decreases.
  // This immediately affects rotSlackP according to
  // rotSlackP = rotSlack - arrDelay, where rotSlack is the initial value

  if (n === undefined || n.inboundIds === undefined) {
    console.log("n is undefined or n.inboundIds is undefined.");
    return undefined;
  }

  n.minId = undefined;
  n.minACTP = 10000;
  // n.ACTSlackP = 10000;
  // n.availRotSlackP = 10000;

  // I should be able to call computeMinACT whether I am at PTY or at a Station

  n.count += 1; // This number should never go beyond 1

  // Only call computeMinACT if the flight is leaving PTY

  const obj = computeMinACT(n.id, bookingsIdMap, n.inboundIds, false);
  // u.print("updateOutboundNodeNew::obj ", obj);
  n.minId = obj.minId;
  n.minACTP = obj.minACT;
  const ACTAvailableP = obj.minACT;
  const ACTSlackP = ACTAvailableP - 30; // manual setting
  const slackP = ACTSlackP; // this is really an edge quantity
  // console.log(`n.SCH_DEP_DTMZ: ${n.SCH_DEP_DTMZ}`);
  if (slackP < 0) {
    n.estDepTime = n.SCH_DEP_DTMZ - slackP * 60000; // in ms
    n.estArrTime = n.SCH_ARR_DTMZ - slackP * 60000; // in ms
    n.depDelayP = (n.estDepTime - n.SCH_DEP_DTMZ) / 60000; // in min
    n.arrDelayP = (n.estArrTime - n.SCH_ARR_DTMZ) / 60000; // in min

    // There is no need to update the incoming edges. These will all be updated at the
    // end of the graph traversal, once all the new estArrTime and estDepTimes have been
    // computed.
  }
  // console.log(`... n.arrDelayP: ${n.arrDelayP}, n.depDelayP: ${n.depDelayP}`);

  return undefined;
}
//---------------------------------------------------------------
// Only need to update estDepTime and estArrTime
function updateInboundEdgesNew(
  id_nf,
  FSUm,
  //outboundNode,
  bookingsIdMap,
  graphEdges
) {
  const outboundNode = FSUm[id_nf];
  //
  // add inbounds to graphEdges
  const ms2min = 1 / 1000 / 60;
  const inboundEdgesIds = outboundNode.inboundIds; // UNDEFINED. SHOULD NOT HAPPEN. Or should it?
  const inboundEdges = [];
  inboundEdgesIds.forEach((id_f) => {
    const row = bookingsIdMap[id_f + "-" + id_nf];
    inboundEdges.push(row);
  });
  // u.print(`inboundEdges, id_nf: ${id_nf}`, inboundEdges);

  let ecount = 0; // counter to reduce output
  inboundEdges.forEach((e) => {
    let row_f;
    let row_nf;
    if (e !== undefined) {
      // WHY IS THIS CHECK NEEDED?
      graphEdges.push(e);
      row_f = FSUm[e.id_f];
      row_nf = FSUm[e.id_nf];
      // u.print("updateInboundEdges, inboundEdge", e);
      // e.ACTAvailable = (row_nf.SCH_DEP_DTMZ - row_f.SCH_ARR_DTMZ) / 60000; // same as calcAvailRot

      // Note that when the node is updated, the estDepTime might get updated, which would
      // require an update of slack times for all the edges. However, all the slack times would
      // be updated by the same amount.
      e.ACTAvailableP = (row_nf.estDepTime - row_f.estArrTime) / 60000;
      e.ACTSlackP = e.ACTAvailableP - 30; // harcoded, but really, a function of city/airport
      e.availRotP = 10000;
      e.availRotSlackP = 10000;

      // update rotation
      if (e.tail_f === e.tail_nf) {
        e.availRotP = e.ACTAvailableP;
        e.availRotSlackP = e.availRotP - e.availRotMinReq;
      }
    }
  });
  return null;
}
//---------------------------------------------------------------
// Remove duplicate class to processOutboundFlights
function propDelayNew(id, bookingsIdMap, FSUm, graphEdges) {
  // id is an incoming flight (either to PTY or to Sta)
  // I do not think that graphEdges are needed for anything
  updateInboundEdgesNew(
    id, //  outbound id
    FSUm,
    bookingsIdMap,
    graphEdges
  );
  // the outbound node is id
  updateOutboundNodeNew(id, FSUm, bookingsIdMap);

  // Use the new estimated departure times to update all edge quantities
  updateInboundEdgesNew(
    id, //  outbound id
    FSUm,
    bookingsIdMap,
    graphEdges
  );

  return 0; // not sure what I am returning
}
//--------------------------------------------------------------------------
// Minimum Available Connection Time for Pax for flight "id"
// id is an outgoing flight
// function computeMinACT(feeders, bookings_f, bookings_nf, id) {
// function assumes that inbounds is well formed.
// The function is called by a node. The function collects information  on
// all edges connected to this node to estimate the minimum ACT
// Compute the minimum availACTP among all feeders
function computeMinACT(id_nf, bookingsIdMap, inboundsIds, verbose = false) {
  // u.print(`==> compMinACT, inboundsIds, id_nf: ${id_nf}`, inboundsIds);

  const ms2min = 1 / 1000 / 60;
  // track which inbound is responsible for the minACT.
  // Create a pure object, with no additional functions
  const obj = Object.create(null);
  obj.minACT = 100000; // default
  obj.inboundMinId = undefined;

  const feedersACT = []; // for debugging

  // loop over incoming flights
  // console.log(`computeMinACT::inboundsIds.length: ${inboundsIds.length}`);

  inboundsIds.forEach((id) => {
    const r = bookingsIdMap[id + "-" + id_nf];
    // u.print("loop: computeMinACT::r", r);
    if (r === undefined) {
      // FIGURE OUT WHY THIS IS HAPPENING
      u.print("(SHOULD NOT HAPPEN) computeMinACT::r ", r); // There is an undefined ROW!! THIS IS NOT POSSIBLE
      u.print("computeMinACT, bookingsIdMap: ", bookingsIdMap);
    } else {
      // u.print("r ", r);
    }
    if (r !== undefined && r.ACTAvailableP < obj.minACT) {
      obj.minACT = r.ACTAvailableP;
      obj.inboundMinId = r.id_f;
    }
    feedersACT.push({
      id_nf,
      id,
      availACT: r.ACTAvailable,
      availACTP: r.ACTAvailableP,
    });
  });

  if (verbose === true) u.print("computeMinACT::feedersACT", feedersACT);

  return obj;
}
//---------------------------------------------------------------------
function setInitialDelays(FSUm, initialArrDelayP, startingId) {
  if (FSUm[startingId] === undefined) {
    // Should be done higher up the chain
    return null;
  }

  if (initialArrDelayP !== undefined) {
    FSUm[startingId].arrDelayP = initialArrDelayP;
  } else {
    // Arrival delay as given in FSU table
    // Ideally should be set to ETA, which updates every 15 min or so.
    FSUm[startingId].arrDelayP = FSUm[startingId].ARR_DELAY_MINUTES;
  }
  FSUm[startingId].estArrTime =
    FSUm[startingId].SCH_ARR_DTMZ + initialArrDelayP * 60000;
  // console.log(`FSUm[startingId].arrDelayP: ${FSUm[startingId].arrDelayP}`);
}
//--------------------------------------------------------------------
// Depends on startingId, so should be done elsewhere. Every time
// a new id is selected
function traverseGraph(startingId, graph, bookingsIdMap, dFSU, FSUm) {
  let countUndef = 0;
  let countDef = 0;

  let count = 0;
  // u.print("traverseGraph, graph", graph);

  // return null; // REMOVE. SIMPLY THERE FOR DEBUGGING. Sept. 9, 2021

  // For some reason all flights have a delay. SOMETHING IS SURELY WRONG. But perhaps it is because I am
  // starting with a flight that has not yet left? But in that case, surely, the default should be no delay?
  // Check carefully starting with a flight that has not left. <<<<< TODO.

  let idsTraversed = [];
  let edgesTraversed = []; // (not clear required)

  // Go through the graph and update arrival and departure delays,
  // slack and rotatioan times
  // There is no graph created

  const dFSUids = u.createMapping(dFSU, "id");
  // const idCount = {};

  // for (let id in dFSUids) {
  //   let count = 0;
  //   graph.traverseBfs(id, (key, values) => {
  //     count += 1;
  //   });
  // //   idCount[id] = count;
  // }
  // u.print("rigidModel, traversing graph, idCount", idCount);

  const ids = [];

  graph.traverseBfs(startingId, (key, values) => {
    // outgoing flight from PTY
    idsTraversed.push(key);
    count += 1;
    const isUndefined = propDelayNew(key, bookingsIdMap, FSUm, edgesTraversed);
    ids.push([key, isUndefined]);
    countUndef += isUndefined;
    countDef += 1 - isUndefined;
  });

  // u.print("idsTraversed", idsTraversed);
  // u.print("ids", ids);
  // console.log(`nb idsTraversed: ${idsTraversed.length}`);
  return { idsTraversed, edgesTraversed };
}
//----------------------------------------------------
function computeNodesEdgesWithArrDelay(dFSU, bookings, maxArrDelay) {
  // Compute subset of flights and bookings with arrDelayP > maxArrDelay
  // This method could be outside rigidModel
  const nodesWithArrDelay = [];

  dFSU.forEach((f) => {
    const arrDelayP = f.arrDelayP;
    if (arrDelayP > maxArrDelay) {
      nodesWithArrDelay.push(f);
    }
  });

  const FSUm = u.createMapping(dFSU, "id");

  // The length of dFSU is always the same.
  // But traversing the graph, the arrDelayP times are estimated and thus the length
  // of nodesWithArrDelay can change.
  // console.log(`dFSU.length: ${dFSU.length}`);
  // console.log(
  //   `rigidModel::nodesWithArrDelay.length: ${nodesWithArrDelay.length}`
  // );

  // filter edges from bookings

  // All edges that have arrival delay_f > maxArrDelay
  // Only keep edges with a feeder flight that has a delay > maxArrDelay
  const edgesWithArrDelay = [];

  bookings.forEach((b) => {
    const row_f = FSUm[b.id_f];
    if (row_f.arrDelayP > maxArrDelay) {
      edgesWithArrDelay.push(b); // no particular order
    }
  });
  return { nodesWithArrDelay, edgesWithArrDelay };
}
//--------------------------------------------------------------
function makeUnique(graphEdges) {
  // To get unique edges, first define a unique edges id:
  // Arguments
  // graphEdges: edge Array

  graphEdges.forEach((r) => {
    r.id = r.id_f + "_" + r.id_nf;
  });

  const graphEdgeIds = u.createMapping(graphEdges, "id");

  // Lose reference to input argument
  graphEdges = [];
  for (let id in graphEdgeIds) {
    graphEdges.push(graphEdgeIds[id]);
  }

  // localCompare required to compare strings lexigraphically
  graphEdges = graphEdges.sort((a, b) => a.id_f.localeCompare(b.id_f));
  return graphEdges;
}
//--------------------------------------------------------------
function restrictGraph(graphEdges, id2level) {
  // Only keep edges connecting nodes among those traversed
  const newEdges = [];
  graphEdges.forEach((r) => {
    const lev_f = id2level[r.id_f];
    const lev_nf = id2level[r.id_nf];
    if (lev_f !== undefined && lev_nf !== undefined) {
      newEdges.push(r);
    }
  });

  // console.log(`restrictGraph::graphEdges.length: ${graphEdges.length}`);
  return newEdges;
}
//--------------------------------------------------------------
function updateNodeData(n) {
  // Given estArrTime and estDepTime, update all quantities
  // Nothing to do.
}
//--------------------------------------------------------------
