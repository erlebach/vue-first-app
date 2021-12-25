/* eslint-disable no-unreachable */
// import { DirectedGraph } from "@datastructures-js/graph";
import * as u from "./utils.js";
import * as tier from "./Tierref.js";
import { sortBy } from "lodash";
import * as hasher from "node-object-hash";
// import { watchEffect } from "vue";

let gcounter = 0;

//--------------------------------------------------------------------
export function rigidModel(
  dFSU, // values
  bookings,
  bookingsIdMap, // CHECK
  dTails,
  edges,
  graph,
  bookingsIds_in, // CHECK
  bookingsIds_out, // CHECK
  initialArrDelayP, // delay applied to startingid
  maxArrDelay,
  startingId
) {
  // Store minAvail Connection time and connection time slack with the outgoing flight
  // Arguments:
  // initialArrDelayP: delay to impose on the startingId flight for experimentation
  // make all flights arrive and depart on time. Update IN and OUT accordingly.
  // IN -> INP, and OUT -> OUTP. Use INP and OUTP in calculations below.
  // For now, ignore OFF and ON

  let hashCoercer = hasher({ sort: true, coerce: true });

  u.print("rigidModel::startingId", startingId);
  u.print("rigidModel::bookingsIdMap", bookingsIdMap); // empty arrays
  // u.print("rigidModel::bookings_in", bookings_in);
  // u.print("rigidModel::bookings_out", bookings_out);
  u.print("rigidModel::initialArrDelayP", initialArrDelayP);
  u.print("rigidModel::maxArrDelay", maxArrDelay);
  u.print("rigidModel::bookingsIds_in", bookingsIds_in);
  u.print("rigidModel::bookings", bookings);
  u.print("rigidModel::dFSU", dFSU);

  console.log("endpointRigidModelOnce::rigidModel");
  resetDelays(dFSU, bookings);
  const FSUm = u.createMapping(dFSU, "id");

  // End letter P refers to "Propagated" or "Predicted"

  // Edges must be initialized before nodes in order to compute minACT
  const a = true;
  if (a === true) {
    initializeEdges(bookings, FSUm);
    initializeNodes(
      FSUm,
      dTails,
      bookingsIdMap
      // bookings_in,
      // bookings_out,
      // bookingsIds_in,
      // bookingsIds_out
    );
    throw "script end";
  }

  // Initial Node. Add a delay of initialArrDelayPa
  // Rotation at STA is irrelevant. There is no PAX on this return flight.

  u.print("=> rigidModel, startingId", startingId);
  u.print("=> FSUm", FSUm);
  // throw "script end";

  // depends on arguments. Should probably be called elsewhere
  setInitialDelays(FSUm, initialArrDelayP, startingId);

  // const outs = bookings_out[startingId];

  // This is the graph to traverse
  // What are edges?
  // const { edges } = epu.getEdges(bookings);
  // const graph = createGraph(edges);

  // const graph = createGraph(edges, bookings_in, bookings_out);
  // const id = startingId;

  // Start the analysis, run through the graph, breadth-first
  // Starting with root_id leaving a Sta and flying to PTY.
  // Consider the impact of a late arrival on all outgoing flights.
  // For each outgoing flight, evaluate the minACT. Update the
  // departureP and arrivalP delays of the outgoing flights if necessary.
  // also update slackP (ACTslack, or min(ACTslack, ROTslack)
  // At PTY, there are many outgoing flights connected to single feeder.
  // At a Station, there is only a single returning flight to PTY we are
  // considering in the analysis with the same tail.

  // dFSU.forEach((f) => {
  //   if (f.arrDelayP > 0) {
  //     const outbounds = bookings_out[f.id];
  //     const inbounds = bookings_in[f.id];
  //   }
  // });

  // All Empty arrays!
  u.print("traverseGraph::startingId", startingId);
  u.print("traverseGraph::bookingsIdMap", bookingsIdMap);
  // u.print("traverseGraph::bookings_in", bookings_in);
  u.print("traverseGraph::bookingsIds_in", bookingsIds_in);
  u.print("traverseGraph::dFSU", dFSU);
  u.print("traverseGraph::FSUm", FSUm);

  // Depends on startingId, so should be done elsewhere. Every time
  // a new id is selected
  let { idsTraversed, edgesTraversed } = traverseGraph(
    startingId,
    graph,
    bookingsIdMap,
    bookingsIds_in,
    dFSU,
    FSUm
  );

  // Map to access levels and ids (using the ids traversed starting with the flight startingId)
  const { id2level, level2ids } = createId2Level(idsTraversed);

  console.log(`before, edgesTraversed.length: ${edgesTraversed.length}`);
  edgesTraversed = makeUnique(edgesTraversed); // already no duplicates.
  console.log(`after, edgesTraversed.length: ${edgesTraversed.length}`);
  console.log(`after, edgesTraversed: ${edgesTraversed}`);

  // There appears to be no undefined nodes

  // console.log("\nAfter Traverse All nodes with arrival DelayP > 0\n");
  // u.print("idsTraversed: ", idsTraversed);

  // return a dictionary that returns the level for any id
  // also return a dictionary that returns a list of ids for each level

  // idsTraversed is not used later
  // Rather, arrDelayP, and other attributes are computed in dFSU

  //const maxArrDelay = -10000; // keep al flights
  // const maxArrDelay = 15; // arrival delays > 15 min

  // The issue is that the first flight should not be removed.
  // Alternatively, if the first flight is removed, there is no need to analyze
  // maxArrDelay should be a parameter
  // const maxArrDelay = 0; // keep only delayed flights

  // filter nodes from dFSU

  console.log(`==> rigidModel::maxArrDelay: ${maxArrDelay}`);

  // subset of flights and bookings with predicted arrival delay (arrDelayP)
  // greater than maxArrDelay
  const {
    nodesWithArrDelay,
    edgesWithArrDelay,
  } = computeNodesEdgesWithArrDelay(dFSU, bookings, maxArrDelay);

  // graphEdges: all edges traversed. Traverse tree starting with selected ID.
  // The edges are formed from the inbounds to each node connected to the node.

  // I am not sure graphEdges are needed
  u.print("rigidModel::edgesTraversed (Set)", edgesTraversed);
  // Only keep unique edges

  // Remove from graphEdges all edges that do not connect two nodes
  // Note that some node were removed, so ss owill also be removed

  // id2level contains all the nodes that were traversed (whether there is delay or not)
  // newEdges only contains edges between nodes that were traversed
  // Note that the rigid model takes feeders into account that are not part of the traversed nodes.
  // The traversed nodes originate at startId, and consider the outbounds recursively.

  console.log(`restrictGraph::edges.length: ${edges.length}`);
  let hEdgesTraversed = hashCoercer.hash(edgesTraversed);
  console.log(`hash hEdgesTraversed before restrictGraph: ${hEdgesTraversed}`);
  u.print("edgesTraversed before restrictGraph", edgesTraversed); // ZERO THE SECOND TIME AROUND
  edgesTraversed = restrictGraph(edgesTraversed, id2level);
  hEdgesTraversed = hashCoercer.hash(edgesTraversed);
  console.log(`hash hEdgesTraversed after restrictGraph: ${hEdgesTraversed}`);
  // The second time around, restrictGraph returns an empty list. WHY? (2021-12-24)
  u.print("return from restrictGraph::edgesTraversed", edgesTraversed);
  u.print("return from restrictGraph::id2level", id2level);
  const hid2level = hashCoercer.hash(id2level);
  console.log(`hash id2level: ${hid2level}`);

  // console.log("Edges with In Arrival Delay");
  // console.log(u.createMapping(edgesWithInArrDelay, "id_f"));
  u.print("nodesWithArrDelay", nodesWithArrDelay);
  u.print("edgesWithArrDelay", edgesWithArrDelay);

  // I really should return all nodes, but only draw the nodes with propagation delay > 0
  return {
    // The next two lines are NOT the nodes traveresed. They are a subset of bookings
    nodes: nodesWithArrDelay, // bookings with arrDelayP > maxArrDelay
    edges: edgesWithArrDelay, // not useful
    // these are the edges between the nodes that were traversed.
    // the nodes traversed are computed elsewhere, in the vue code
    edgesTraversed, // this is the graph we wish to plot (without inbounds)
    level2ids,
    id2level,
  };
}
//-------------------------------------------------------
function initializeEdges(bookings, FSUm) {
  const nano2min = 1 / 1e9 / 60;
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
    // bookingsIdMap.forEach((m) => { // }
    //e.fsu_f = FSUm[e.id_f];
    //e.fsu_nf = FSUm[e.id_nf];
    const row_f = FSUm[e.id_f];
    const row_nf = FSUm[e.id_nf];
    // u.print("initializeEdges::bookings, row_f", row_f);
    // u.print("initializeEdges::bookings, row_nf", row_nf);
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
    e.minAvailable = 30;
    // e.ACTSlack = e.ACTAvailable - e.minAvailable;
    e.ACTSlackP = e.ACTAvailableP - e.minAvailable; // SHOULD BE DEFINED

    // e.availRot = undefined;
    e.availRotP = 10000; // Rotationa does not apply. Need a number to calculate e.availSlackP correctly
    // e.availRotMinReq = undefined;
    // e.rotSlack = undefined;
    e.availRotSlackP = 10000;
    e.slackP = Math.min(e.availRotSlackP, e.ACTSlackP);
    if (isNaN(e.slackP)) {
      console.log(
        `e.availRotSlackP (${e.availRotSlackP}) or e.ACTSlackP (${e.ACTSlackP}) not a number. SHOULD NOT HAPPEN`
      );
      console.log(`e.ACTAvailableP: ${e.ACTAvailableP}`); // UNDEFINED
    }
    // rotation only exists for fixed tails
    if (e.tail_f === e.tail_nf) {
      console.log("==> initializeEdges, single tail rotation");
      countTailTails++;
      // PTY with tail turnaround and passengers
      // Setup rotation parameters and rotation slack
      // setupEdgeProps(e, FSUm);
      // Scheduled rotation time is the same as avaiable connection time.
      e.schedRot = (row_nf.SCH_DEP_DTMZ - row_f.SCH_ARR_DTMZ) * nano2min; // same as calcAvailRot
      // Available rotation is based on best estimates for feeder arrival and outbound departure times
      e.availRotMinReq = 60;
      e.availRot = (row_nf.estDepTime - row_f.estArrTime) * milli2min;
      e.availRotP = e.availRot;
      e.ACTAvailableP = e.availRotP;
      e.ACTSlackP = e.ACTAvailableP - 30; // hardcoded for now. WILL CHANGE LATER
      // u.print("initializeEdges::availRot, e", e);
      //e.rotSlack = e.availRot - e.availRotMinReq; // slack can be negative (slack to spare)
      e.availRotSlack = e.availRot - e.availRotMinReq; // slack can be negative (slack to spare)
      e.availRotSlackP = e.availRotSlack;

      e.slackP = Math.min(e.availRotSlackP, e.ACTSlackP);
      if (isNaN(e.slackP))
        console.log(
          "e.availRotSlackP or e.ACTSlackP not a number. SHOULD NOT HAPPEN"
        );

      // TODO: availRotSlackP=1655, rotSlackP
      // Difference between rotSlackP and availRotSlackP  (NOT CLEAR)
    }
    u.print("initializeEdges, e", e);
  });
  // console.log(`countTailTails: ${countTailTails}`);
}
// Additional edge attributes
// availRotP, availRotMinReq, rotSlackP, ACTAvailableP, ACTSlackP
//------------------------------------------------------------------
// Original function before making mods on 2021-12-24
// I want to reduce the number of changes to the data structures
function initializeEdgesOrig(bookings, FSUm) {
  const nano2min = 1 / 1e9 / 60;
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
    // bookingsIdMap.forEach((m) => {
    //e.fsu_f = FSUm[e.id_f];
    //e.fsu_nf = FSUm[e.id_nf];
    const row_f = FSUm[e.id_f];
    const row_nf = FSUm[e.id_nf];
    // u.print("initializeEdges::bookings, row_f", row_f);
    // u.print("initializeEdges::bookings, row_nf", row_nf);
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
    e.ACTAvailable = (row_nf.SCH_DEP_DTMZ - row_f.SCH_ARR_DTMZ) * nano2min; // same as calcAvailRot
    // Predicted PAX connection time (initially set to available time)
    e.ACTAvailableP = e.ACTAvailable;
    // Available time slack: how much time is available beyond the minimum requirements (usually airport-dependent)
    e.minAvailable = 30;
    e.ACTSlack = e.ACTAvailable - e.minAvailable;
    e.ACTSlackP = e.ACTAvailableP - e.minAvailable;

    e.availRot = undefined;
    e.availRotP = undefined;
    e.availRotMinReq = undefined;
    e.rotSlack = undefined;
    e.availRotSlackP = undefined;

    // rotation only exists for fixed tails
    if (e.tail_f === e.tail_nf) {
      countTailTails++;
      // PTY with tail turnaround and passengers
      // Setup rotation parameters and rotation slack
      // setupEdgeProps(e, FSUm);
      // Scheduled rotation time is the same as avaiable connection time.
      // e.schedRot = (row_nf.SCH_DEP_DTMZ - row_f.SCH_ARR_DTMZ) * nano2min; // same as calcAvailRot
      // Available rotation is based on best estimates for feeder arrival and outbound departure times
      // e.availRotMinReq = 60;
      // e.availRot = (row_nf.estDepTime - row_f.estArrTime) * milli2min;
      // u.print("initializeEdges::availRot, e", e);
      // e.rotSlack = e.availRot - e.availRotMinReq; // slack can be negative (slack to spare)
      e.availRotP = e.availRot;
      e.availRotSlackP = e.availRotSlack;
    }

    // if (e.fsu_f === undefined) {
    //   fsu_undefined._f++;
    // }
    // if (e.fsu_nf === undefined) {
    //   fsu_undefined._nf++;
    // }
    // u.print("initializeEdges::availRot, completed e", e);
  });
  // console.log(`countTailTails: ${countTailTails}`);
}
//------------------------------------------------------------------
function initializeNodes(FSUm, dTails, bookingsIdMap) {
  // Initialize all records in FSUm
  Object.entries(FSUm).forEach((entry) => {
    const [k, r] = entry;
    r.level = -1;
    r.minACTP = r.minACT; // << NEEDED? r.minACT not defined
    r.ACTSlackP = r.ACTSlack;
    r.slackP = r.slack;
    // r.rotSlackP = r.rotSlack;
    r.availRotP = r.availRot;
    r.arrDelayP = r.arrDelay;
    r.depDelayP = r.depDelay;
    u.print("initializeNodes, r", r);
    if (r.inboundIds.length > 0) {
      console.log(
        `==> initializeNodes, r.inboundIds.length: ${r.inboundIds.length}, ${r.nbInbounds}`
      );
    }
    const obj = computeMinACT(r.id, bookingsIdMap, r.inboundIds);
    u.print("initializeNodes, obj", obj);
    const minACT = obj.minACT;
    const inboundMinId = obj.inboundMinId;
    if (
      r.id === "2021-12-23GYEPTY20:080272" ||
      r.id === "2021-12-24PTYMDE12:090306"
    ) {
      u.print("initializeNodes, r", r);
    }
  });
}
//------------------------------------------------------------------
// Original  version of initializeNodes (2021-12-24). I am trying to minimize
// changes to the underlying datastructures
function initializeNodesOrig(
  FSUm,
  dTails,
  bookingsIdMap,
  // bookings_in,
  // bookings_out,
  bookingsIds_in,
  bookingsIds_out
) {
  // Initialize all records in FSUm
  // console.log("inside initializeNodes");
  const tailsMapIdnf = u.createMapping(dTails, "id_nf");
  // u.print("initializeNodes::FSUm", FSUm);
  // u.print("initializeNodes::sort(FSUm)", sortBy(FSUm, "id"));
  // u.print("initializeNodes::tailsMapIdnf", sortBy(tailsMapIdnf, "id_nf"));
  let countUndefInbounds = 0;
  let countUndefOutbounds = 0;
  let countBothUndef = 0;
  let countAll = 0;

  for (let key in FSUm) {
    countAll++;
    const n = FSUm[key];
    // Remove two lines. Probably causing an infinite loop somewhere.
    const row_nf = FSUm[n.id];
    const id_nf = row_nf.id;
    const id_f = tailsMapIdnf[id_nf];
    // console.log(`n.id: ${n.id}, id_f: ${id_f}, id_nf: ${id_nf}`);
    // u.print(`id_nf`, id_nf);
    // u.print(`id_f`, id_f);
    // u.print(`FSUm[${n.id}, id_nf: ${row_nf}.id]`, row_nf);
    // Use list of id's rather than list of objects, which will avoid infinite recursion
    // simplify maintenance'

    // CHECK whether I can remove n.inbounds
    // No I cannot. Error in endointRigid*.js, line 743 (undefined property) in computeMinACT()
    //     inbounds is undefined

    //n.inbounds = bookings_in[n.id]; // could be undefined (from PTY or Sta)
    //n.outbounds = bookings_out[n.id]; // could be undefined (from PTY or Sta)
    n.inboundsIds = bookingsIds_in[n.id]; // could be empty list (from PTY or Sta)
    n.outboundsIds = bookingsIds_out[n.id]; // could be empty list (from PTY or Sta)

    if (n.inboundsIds == undefined) {
      countUndefInbounds++;
      n.nbInbounds = 0;
    } else {
      n.nbInbounds = n.inboundsIds.length;
    }
    if (n.outboundsIds == undefined) {
      countUndefOutbounds++;
      n.nbOutbounds = 0;
    } else {
      n.nbOutbounds = n.outboundsIds.length;
    }
    if (n.outboundsIds == undefined && n.inboundsIds == undefined)
      countBothUndef++;
    // const inbounds = bookings_in[n.id]; // could be undefined (from PTY or Sta)
    // const outbounds = bookings_out[n.id]; // could be undefined (from PTY or Sta)

    n.count = 0; // number of times the node has been handled

    // Flights that depart a Station too late arrive in PTY the next morning, and
    // are not included in the day's flights. So there are no outbounds.
    // The bookings object has no connections between arriving and departing flights
    // at  station

    if (id_f === undefined) {
      // u.print("initializeNodes::id_f is undefined, n", n);
      n.availRotMinReq = 60;
      //n.rotSlack = 10000; // high number so that rotation does not influence end results
      //n.rotSlackP = 10000;
      n.availRot = 10000;
      n.availRotP = 10000;
      n.availRotSlack = 10000;
      n.availRotSlackP = 10000;
      continue; // Javascript equivalent of continue
    } else {
      if (n.ROTATION_PLANNED_TM < 60) {
        // scheduled rotation
        n.availRotMinReq = n.ROTATION_PLANNED_TM;
      } else {
        n.availRotMinReq = 60;
      }
      // rotSlack should really be renamed availRotSlack for consistency
      //n.rotSlack = n.ROTATION_PLANNED_TM - n.availRotMinReq;
      //n.rotSlackP = n.rotSlack;
      n.availRotSlack = -1; // TODO, 2021-12-20
      n.availRotSlackP = -1; // TODO, 2021-12-20
    }

    if (n.id.slice(10, 13) === "PTY") {
      // outbound flights from PTY
      //if (n.inbounds !== undefined) { // }
      // I might replace undefines by empty lists []
      if (n.inboundsIds !== undefined) {
        // const obj = computeMinACT(bookings, true); // original code
        // What is n.id?
        const obj = computeMinACT(n.id, bookingsIdMap, n.inboundsIds);
        n.minId = obj.minId;
        n.minACT = obj.minACT;
        n.minACTP = n.minACT;
        n.ACTSlackP = n.minACTP - 30; // DO NOT HARDCODE 30 min
      } else {
        u.print(
          "initializeNodes::inbounds undefined, SHOULD NOT HAPPEN! id",
          n.id
        );
      }
    } else {
      // oubbound flight from station
      n.minACT = 100000; //undefined;
      n.minACTP = n.minACT;
      n.ACTSlack = 100000; //undefined;
      n.ACTSlackP = n.ACTSlack;
    }
    n.slack = Math.min(n.rotSlack, n.ACTSlack);
    n.slackP = n.slack;
    n.depDelayP = n.depDelay; // If flight to study has no delay, it will have no impact.
    n.arrDelayP = n.arrDelay; // Best guess
  }
}
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
  u.print("resetDelays::dFSU", dFSU);
  u.print("resetDelays::bookings", bookings);
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

  u.print("createId2Level, ids", ids);

  const id2level = {};
  const level2ids = {};
  const nb_tiers = 10; // set to some arbitrary maximum (could lead to errors)
  for (let i = 0; i <= nb_tiers; i++) {
    level2ids[i] = [];
  }

  let nextId = 0;
  const idStart = ids[0];
  u.print("createid2Level, ids: ", ids);
  const offsetEven = getOrig(idStart) === "PTY" ? 1 : 0;
  const offsetodd = (1 + offsetEven) % 2;
  u.print("createId2Level, ids", ids);

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
function updateInboundEdges(
  id_nf,
  FSUm,
  outboundNode,
  bookingsIdMap,
  // bookings_in,
  bookingsIds_in,
  graphEdges
) {
  // add inbounds to graphEdges
  const nano2min = 1 / 1e9 / 60;

  // Delay: ARR_DELAY_MIN and arrDelayP (not the same)
  const node = outboundNode; // feeder node

  const inboundEdgesIds = outboundNode.inboundIds; // UNDEFINED. SHOULD NOT HAPPEN. Or should it?

  const inboundEdges = [];
  inboundEdgesIds.forEach((id_f) => {
    const row = bookingsIdMap[id_f + "-" + id_nf];
    inboundEdges.push(row);
  });

  u.print(`inboundEdges, id_nf: ${id_nf}`, inboundEdges);
  // throw "updateInboundEdges::end script";

  if (inboundEdges === undefined) {
    return null;
  }

  let ecount = 0; // counter to reduce output
  inboundEdges.forEach((e) => {
    if (e !== undefined) {
      // WHY IS THIS CHECK NEEDED?
      // Checking why filter not working
      // u.print("xxxxxx e= ", e); // undefined
      graphEdges.push(e);
      const row_f = FSUm[e.id_f];
      const row_nf = FSUm[e.id_nf];
      // u.print("updateInboundEdges, inboundEdge", e);
      e.ACTAvailable = (row_nf.SCH_DEP_DTMZ - row_f.SCH_ARR_DTMZ) * nano2min; // same as calcAvailRot

      // ACTAvailable is based on scheduled departure and arrival times
      const arrDelayP = row_f.arrDelayP;
      e.ACTAvailableP = e.ACTAvailable - arrDelayP; // Based on best estimated information
      e.ACTSlackP = e.ACTAvailableP - 30; // harcoded, but really, a function of city/airport

      // update rotation
      if (e.tail_f === e.tail_nf) {
        e.availRotSlackP = e.availRotSlack - e.arrDelayP;
      }
    }
    ecount++;
    if (ecount < 1)
      u.print(`updateInboundEdges(${ecount}), id_nf: ${id_nf}, e: `, e);
  });
  return null;
}
//-------------------------------------------------------------
function updateOutboundNode(FSUm, bookingsIdMap, node) {
  // update of a single node
  const n = node;
  const id_nf = n.id;
  // console.log("=========== updateOutboundNode ====================");

  // if an ETA changes, the flight arrival delay increases or decreases.
  // This immediately affects rotSlackP according to
  // rotSlackP = rotSlack - arrDelay, where rotSlack is the initial value

  // u.print("updateOutboundNode, node", node);
  // console.log(`updateOutboundNode, node: ${node.id}`);
  // u.print("updateOutboundNode, node", node);

  // u.print(
  //   "updateOutboundNode, node.inbounds (used for computeMinAct)",
  //   n.inboundsIds
  // );

  // if (n === undefined || n.inbounds === undefined) {
  if (n === undefined || n.inboundsIds === undefined) {
    return undefined;
  }

  n.count += 1; // This number should never go beyond 1

  if (n.id.slice(10, 13) === "PTY") {
    if (n.inboundsIds.length !== 0) {
      const obj = computeMinACT(n.id, bookingsIdMap, n.inboundsIds);
      n.minId = obj.minId;
      n.minACT = obj.minACT;
      n.minACTP = n.minACT; // CHANGE FORMULA
      n.ACTSlackP = n.minACTP - 30; // DO NOT HARDCODE 30 min
    }
    // these quantities will not affect the rigidModel predictions
    n.minId = 10000;
    n.minACT = 10000;
    n.minACTP = 10000;
    n.ACTSlackP = 10000;
  } else {
    n.minACT = 100000; //undefined;
    n.minACTP = n.minACT;
    n.ACTSlack = 100000; //undefined;
    n.ACTSlackP = n.ACTSlack;
    // update Rotation rotSlackP
    const nano2min = 1 / 1e9 / 60;
    // QUESTION: why use the zeroth element of inboundsIds?
    if (n.inboundsIds.length > 0) {
      // WHY IS THIS CHECK NECESSARY?
      console.log(`n.inboundsIds[0]= ${n.inboundsIds[0]}`);
      const e = bookingsIdMap[n.inboundsIds[0] + "-" + id_nf];
      u.print("e", e); // UNDEFINED. WHY IS THIS? SHOULD NOT HAPPEN? (2021-12-23)
      // const e = n.inbounds[0]; // FIX inbounds to inboundsIds
      if (e !== undefined) {
        // SHOULD NOT BE REQUIRED (2021-12-23)
        const row_f = FSUm[e.id_f];
        n.availRot = (n.SCH_DEP_DTMZ - row_f.INP_DTMZ) * nano2min;
        n.availRotSlackP = n.availRotSlack - row_f.arrDelayP;
        n.availRotSlack = n.availRot - n.availRotMinReq;
      } else {
        n.availRot = 10000;
        n.availRotSlackP = 10000;
        n.availRotSlack = 10000;
      }
    } else {
      // this node does not participate since it has no inbounds
      n.availRot = 10000;
      n.availRotSlackP = 10000;
      n.availRotSlack = 10000;
    }
    // Each node should only be touched once.
  }
  // Not sure about rotSlackP. Must look into that.  ****** DEBUG
  n.slackP = Math.min(n.availRotSlackP, n.ACTSlackP);
  if (n.slackP < 0) {
    n.depDelayP = -n.slackP; // If flight to study has no delay, it will have no impact.
    n.arrDelayP = n.depDelayP;
    //-------------------
  } else {
    // Flights never leave early.
    n.depDelayP = 0; // If flight to study has no delay, it will have no impact.
    n.arrDelayP = 0;
  }
  // Avoid infinite loops
  // n.inbounds = undefined;
  // n.outbounds = undefined;
  return undefined;
}
//-------------------------------------------------------------------------
// Remove duplicated class to processOutboundFlightss
function propDelayNew(id, bookingsIdMap, bookingsIds_in, FSUm, graphEdges) {
  // id is an incoming flight (either to PTY or to Sta)
  // console.log(" THERE ARE SURELY ERRORS n the graph topology ");
  // console.log(
  // " Or else the errors are in the bookigns_in, FSUm, or graphEdges"
  // );
  // console.log("<<<<< INSIDE propDelayNew >>>>");

  // I do not think that graphEdges are needed for anything
  updateInboundEdges(
    id, //  outbound id
    FSUm,
    FSUm[id],
    bookingsIdMap,
    // bookings_in,
    bookingsIds_in,
    graphEdges
  );
  // the outbound node is id
  updateOutboundNode(FSUm, bookingsIdMap, FSUm[id]);

  // gcounter++; // global counter
  // // if (gcounter == 2) throw "propDelayNew, end script";

  // console.log("--------------------------------------------------------------");
  // console.log("STOP AND DEBUG CODE");
  // console.log("STOP AND DEBUG CODE");
  // console.log("STOP AND DEBUG CODE");
  // console.log("--------------------------------------------------------------");

  return 0; // not sure what I am returning
}

//--------------------------------------------------------------------------
// Minimum Available Connection Time for Pax for flight "id"
// id is an outgoing flight
// function computeMinACT(feeders, bookings_f, bookings_nf, id) {
// function assumes that inbounds is well formed.
// The function is called by a node. The function collects information  on
// all edges connected to this node to estimate the minimum ACT
function computeMinACT(
  id_nf,
  bookingsIdMap,
  inboundsIds,
  FSUm = undefined,
  verbose = false
) {
  u.print(`compMinACT, innboundsIds, id_nf: ${id_nf}`, inboundsIds);
  const nano2min = 1 / 1e9 / 60;
  // track which inbound is responsible for the minACT.
  // Create a pure object, with no additional functions
  const obj = Object.create(null);
  obj.minACT = 100000; // default
  obj.inboundMinId = undefined;

  u.print("computeMinACT::bookingsIdMap", bookingsIdMap);
  u.print("computeMinACT::inboundsIds", inboundsIds); // all empty. strange
  // loop over incoming flights
  inboundsIds.forEach((id) => {
    const r = bookingsIdMap[id + "-" + id_nf];
    u.print("loop: computeMinACT::r", r);
    if (r === undefined) {
      // FIGURE OUT WHY THIS IS HAPPENING
      u.print("(SHOULD NOT HAPPEN) computeMinACT::r ", r); // There is an undefined ROW!! THIS IS NOT POSSIBLE
      u.print("computeMinACT, bookingsIdMap: ", bookingsIdMap);
    } else {
      u.print("r ", r);
    }
    // Given r (an id), get the bookings record
    if (r.ACTAvailableP === undefined) {
      console.log(
        "computeMinACT::r.ACTAvaialableP is undefined. SHOULD NOT HAPPEN"
      );
    }
    if (r !== undefined && r.ACTAvailableP < obj.minACT) {
      obj.minACT = r.ACTAvailableP;
      obj.inboundMinId = r.id_f;
    }
  });

  return obj;
}
//---------------------------------------------------------------------
function setInitialDelays(FSUm, initialArrDelayP, startingId) {
  if (FSUm[startingId] === undefined) {
    // Should be done higher up the chain
    return null;
  }

  if (initialArrDelayP !== undefined) {
    // u.print("initialArrDelayP:", initialArrDelayP);
    // console.log(`startingId: ${startingId}`);
    // u.print(`FSUm[${startingId}]`, FSUm[startingId]);
    FSUm[startingId].arrDelayP = initialArrDelayP;
    FSUm[startingId].availRotSlackP -= initialArrDelayP;
  } else {
    // Arrival delay as given in FSU table
    // Ideally should be set to ETA, which updates every 15 min or so.
    FSUm[startingId].arrDelayP = FSUm[startingId].ARR_DELAY_MINUTES;
  }
  console.log(`FSUm[startingId].arrDelayP: ${FSUm[startingId].arrDelayP}`);
}
//--------------------------------------------------------------------
// Depends on startingId, so should be done elsewhere. Every time
// a new id is selected
function traverseGraph(
  startingId,
  graph,
  bookingsIdMap,
  bookingsIds_in,
  dFSU,
  FSUm
) {
  let countUndefined = 0;
  let countDefined = 0;

  let countUndef = 0;
  let countDef = 0;

  let count = 0;

  // return null; // REMOVE. SIMPLY THERE FOR DEBUGGING. Sept. 9, 2021

  // console.log("TRAVERSE GRAPH, endpointRigidModelOnce");
  // console.log(`id: ${id}`);
  // u.print("bookings_in", bookings_in);
  // u.print("bookings_out", bookings_out);
  // u.print("bookings", bookings);
  // u.print("FSUm", FSUm);

  // For some reason all flights have a delay. SOMETHING IS SURELY WRONG. But perhaps it is because I am
  // starting with a flight that has not yet left? But in that case, surely, the default should be no delay?
  // Check carefully starting with a flight that has not left. <<<<< TODO.

  let idsTraversed = [];
  let edgesTraversed = []; // (not clear required)

  // Go through the graph and update arrival and departure delays,
  // slack and rotatioan times
  // There is no graph created

  const dFSUids = u.createMapping(dFSU, "id");
  u.print(
    "before traverse, dFSUids[2021-12-16AUAPTY17:320349",
    dFSUids["2021-12-16AUAPTY17:320349"]
  );
  const idCount = {};
  for (let id in dFSUids) {
    let count = 0;
    graph.traverseBfs(id, (key, values) => {
      count += 1;
    });
    idCount[id] = count;
  }
  u.print("rigidModel, traversing graph, idCount", idCount);

  const ids = [];

  graph.traverseBfs(startingId, (key, values) => {
    // outgoing flight from PTY
    idsTraversed.push(key);
    count += 1;
    // console.log("-------------------------------------");
    const isUndefined = propDelayNew(
      key,
      bookingsIdMap,
      bookingsIds_in,
      FSUm,
      edgesTraversed
    );
    ids.push([key, isUndefined]);
    countUndef += isUndefined;
    countDef += 1 - isUndefined;
  });

  u.print("idsTraversed", idsTraversed);
  u.print("ids", ids);
  console.log(`nb idsTraversed: ${idsTraversed.length}`);
  return { idsTraversed, edgesTraversed };
}
//----------------------------------------------------
function computeNodesEdgesWithArrDelay(dFSU, bookings, maxArrDelay) {
  // Compute subset of flights and bookings with arrDelayP > maxArrDelay
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
  console.log(`dFSU.length: ${dFSU.length}`);
  console.log(
    `rigidModel::nodesWithArrDelay.length: ${nodesWithArrDelay.length}`
  );

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

  console.log(`restrictGraph::graphEdges.length: ${graphEdges.length}`);
  return newEdges;
}
//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------