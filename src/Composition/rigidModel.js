/* eslint-disable no-unreachable */
import { DirectedGraph } from "@datastructures-js/graph";
import { max, tail, update } from "lodash";
import * as d from "./dates.js";
import * as u from "./utils.js";

//--------------------------------------------------------------------
// Function for debugging different types of rotations
function checkRotations(FSUm, bookings, tails) {
  const nano2min = 1 / 1e9 / 60;
  bookings.forEach((e) => {
    e.fsu_f = FSUm[e.id_f];
    e.fsu_nf = FSUm[e.id_nf];
    // u.print("e", e);
    // rotation only exists for fixed tails
    if (e.fsu_f !== undefined && e.fsu_nf !== undefined) {
      const plannedRot_f = e.fsu_f.ROTATION_PLANNED_TM; // not equal
      const plannedRot_nf = e.fsu_nf.ROTATION_PLANNED_TM; // not equal
      const realRot_f = e.fsu_f.ROTATION_REAL_TM; // not equal
      const realRot_nf = e.fsu_nf.ROTATION_REAL_TM; // not equal
      const availRot_f = e.fsu_f.ROTATION_AVAILABLE_TM; // not equal
      const availRot_nf = e.fsu_nf.ROTATION_AVAILABLE_TM; // not equal
      const calcRealRot = (e.fsu_nf.OUT_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal
      const calcAvailRot = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal
      const calcPlannedRot =
        (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // not equal
      // const calcPlannedRot1 =
      // (e.b_nf.SCH_DEP_DTMZ - e.b_f.SCH_ARR_DTMZ) * nano2min; // not equal
      // const calcRot_f = e.b_f
      // Compute rotation manually to check.
      // planned rotation is sched_dep_nf - sched_arr_f
      if (e.TAIL_f === e.TAIL_nf) {
        // u.print("e", e);
        u.print("plannedRot_f", plannedRot_f); // different values for _f and _nf
        u.print("plannedRot_nf", plannedRot_nf);
        u.print("realRot_f", realRot_f); // different values for _f and _nf
        u.print("realRot_nf", realRot_nf);
        u.print("availRot_f", availRot_f); // different values for _f and _nf
        u.print("availRot_nf", availRot_nf);
        u.print("calcPlannedRot", calcPlannedRot);
        u.print("calcRealRot", calcRealRot);
        u.print("calcAvailRot", calcAvailRot);
      }
    }
  });

  u.print("tails", tails);
  // Tail pairs at station are not in te bookings database since there are no passengers
  // tails contains rotations at PTY and at stations
  tails.forEach((e) => {
    e.fsu_f = e.b_f;
    e.fsu_nf = e.b_nf;
    const plannedRot_f = e.fsu_f.ROTATION_PLANNED_TM; // not equal
    const plannedRot_nf = e.fsu_nf.ROTATION_PLANNED_TM; // not equal
    const realRot_f = e.fsu_f.ROTATION_REAL_TM; // not equal
    const realRot_nf = e.fsu_nf.ROTATION_REAL_TM; // not equal
    const availRot_f = e.fsu_f.ROTATION_AVAILABLE_TM; // not equal
    const availRot_nf = e.fsu_nf.ROTATION_AVAILABLE_TM; // not equal
    const calcRealRot = (e.fsu_nf.OUT_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal
    const calcAvailRot = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal
    const calcPlannedRot =
      (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // not equal

    u.print("Tail, id_f, id_nf: ", `${e.id_f}, ${e.id_nf}`);
    //u.print("tail plannedRot_f", plannedRot_f); // different values for _f and _nf
    u.print("tail plannedRot_nf", plannedRot_nf);
    //u.print("tail realRot_f", realRot_f); // different values for _f and _nf
    u.print("tail realRot_nf", realRot_nf);
    //u.print("tail availRot_f", availRot_f); // different values for _f and _nf
    u.print("tail availRot_nf", availRot_nf);
    u.print("tail calcPlannedRot", calcPlannedRot);
    u.print("tail calcRealRot", calcRealRot);
    u.print("tail calcAvailRot", calcAvailRot);
  });
}
//-------------------------------------------------------
function setupEdgeProps(e, FSUm) {
  const nano2min = 1 / 1e9 / 60;
  e.fsu_f = FSUm[e.id_f];
  e.fsu_nf = FSUm[e.id_nf];
  // rotation only exists for fixed tails

  // Not needed since future is not known
  const calcRealRot = (e.fsu_nf.OUT_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal

  // Not needed since we are dealing with the future
  const calcAvailRot = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal

  const calcPlannedRot =
    (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // not equal

  // CONSIDER using scheduled ACT available on all flights since we do not know the future.
  //const actAvailable = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // same as calcAvailRot
  const actAvailable =
    (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // same as calcAvailRot

  e.availRotP = calcPlannedRot; // scheduled
  e.availRotMinReq = calcPlannedRot < 60 ? calcPlannedRot : 60; // 60 min
  e.rotSlackP = e.availRotP - e.availRotMinReq;
  e.ACTAvailable = actAvailable; // Based on best estimated information
  e.ACTAvailableP = e.ACTAvailable; // Based on best estimated information
  e.ACTSlack = e.ACTAvailable - 30; // not clear required
  e.ACTSlackP = e.ACTSlack;

  if (actAvailable < 0) {
    // if (actAvailable === -932) {
    // There is none with -932
    console.log(`\nsetupEdgeProps, actAvailable INSUFFICIENT: ${actAvailable}`);
    // u.print("e.fsu_f: ", e.fsu_f);
    // u.print("e.fsu_nf: ", e.fsu_nf);
    // console.log("\n");
  }
}
//----------------------------------------------------------------
function initializeEdges(bookings, FSUm) {
  const nano2min = 1 / 1e9 / 60;

  const fsu_undefined = Object.create(null);
  fsu_undefined._f = 0;
  fsu_undefined._nf = 0;

  bookings.forEach((e) => {
    e.fsu_f = FSUm[e.id_f];
    e.fsu_nf = FSUm[e.id_nf];

    // rotation only exists for fixed tails
    if (e.tail) {
      // Station
      setupEdgeProps(e, FSUm);
    } else if (e.TAIL_f === e.TAIL_nf) {
      // PTY with tail turnaround and passengers
      setupEdgeProps(e, FSUm);
    } else {
      // CONSIDER using scheduled ACT available on all flights since we do not know the future.
      // const actAvailable = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // same as calcAvailRot
      e.availRotP = 100000;
      e.availRotMinReq = 100000;
      e.rotSlackP = 100000;
      // e.ACTAvailableP = actAvailable; // Based on best estimated information
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

  // DEBUG
  // bookings.forEach((e) => {
  //   const actAvailableP = e.actAvailableP;
  //   console.log(
  //     `id_f: ${e.id_f}, id_nf: ${e.id_nf}, ACTAvailableP: ${e.ACTAvailableP}`
  //   );
  // });
}
//------------------------------------------------------------------
//------------------------------------------------------------------
function initializeNodes(FSUm, bookings_in, bookings_out) {
  console.log("inside initializeNodes");
  Object.values(FSUm).forEach((n) => {
    n.inbounds = bookings_in[n.id]; // could be undefined (from PTY or Sta)
    n.outbounds = bookings_out[n.id]; // could be undefined (from PTY or Sta)

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

    console.log("*** INSIDE initializeNodes ***");

    if (n.id.slice(10, 13) === "PTY") {
      // outbound flights from PTY
      if (n.inbounds !== undefined) {
        const obj = computeMinACT(n.inbounds, true);
        n.minId = obj.minId;
        n.minACT = obj.minACT;
        if (n.minACT < 30) {
          // insufficient time if < 30
          // All flights have scheduled sufficient time
          u.print("xxx obj, computeMinACT", obj);
        }
        n.minACTP = n.minACT;
        n.ACTSlackP = n.minACTP - 30; // DO NOT HARDCODE 30 min
        // u.print("inbounds defined, id", n.id);
      } else {
        // u.print("inbounds undefined, id", n.id);
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
    n.depDelayP = 0; // If flight to study has no delay, it will have no impact.
    n.arrDelayP = 0;
  });
}

// Additional node attributes
// minACTP, ACTSlackP, slackP, depDelayP, arrDelayP, minId, minAct, minACTP

// Additional edge attributes
// availRotP, availRotMinReq, rotSlackP, ACTAvailableP, ACTSlackP

//-----------------------------------------------------------------
function printEdgeData(f, msg) {
  console.log(`-----  Edge: ${msg}   ----------------------------`);
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
function printNodeData(f, msg) {
  console.log(`-----   Node: ${msg}   ----------------------------`);
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
  console.log(`      minACTP: ${f.rotSlackP}`);
  console.log("");
  // minACTP, ACTSlackP, slackP, depDelayP, arrDelayP, minId, minACT
}
//---------------------------------------------------------------
export function rigidModel(
  dFSU, // values
  dTails,
  tailsSta,
  bookings,
  bookings_in,
  bookings_out,
  feeders,
  edges,
  initialArrDelayP, // delay applied to startingid
  startingId
) {
  u.print("enter rigid model");
  // consider all the edges that start at a station -> PTY -> station.
  // These edges have e.src.OD.slice(13:16) == 'PTY'

  // checkEdgeSta(); // Debugging
  // checkEdgePTY(); // Debugging

  // Store minAvail Connection time and connection time slack with the outgoing flight

  // End letter P refers to "Propagated" or "Predicted"
  const FSUm = u.createMapping(dFSU, "id");

  // Edges must be initialized before nodes in order to compute minACT
  initializeEdges(bookings, FSUm);
  initializeNodes(FSUm, bookings_in, bookings_out);

  // Initial Node. Add a delay of initialArrDelayPa
  // Rotation at STA is irrelevant. There is no PAX on this return flight.
  FSUm[startingId].arrDelayP = initialArrDelayP;

  // Edge
  u.print("bookings_in", bookings_in); // undefined
  u.print("bookings_out", bookings_out); // undefined
  u.print("bookings_in[startingId]", bookings_in[startingId]); // undefined
  u.print("bookings_out[startingId]", bookings_out[startingId]);
  const outs = bookings_out[startingId];

  // initializePredictedDelaysAndSlacks(dFSU, tailsSta);
  // u.print("before createGraph, bookings: ", bookings);

  //const tailm = u.createMapping(dTails, "id_f");
  const graph = createGraph(edges, bookings_in, bookings_out);

  // edges: src, dst  (PTY-Sta or Sta-PTY). Sta refers to "Station"
  // nodes: list of ids. Number edges == nb vertices. Why? If a tree, nb vertices should
  // equal nb edgs + 1.
  // u.print("graph", graph);

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

  // print all nodes with arrival Delay
  console.log("\nBefore Traverse: all nodes with arrival DelayP\n");
  // u.print("dFSU", dFSU);
  dFSU.forEach((f) => {
    if (f.arrDelayP > 0) {
      u.print("f", f);
      printNodeData(f, "MIA 173 inbound");
      const outbounds = bookings_out[f.id];
      const inbounds = bookings_in[f.id];
      // u.print("bookings_in: ", bookings_in);
      // u.print("bookings_out: ", bookings_out);
      // u.print("outbounds: ", outbounds);
      // u.print("inbounds: ", inbounds);
      outbounds.forEach((o) => {
        printEdgeData(o, "Outbound at PTY");
      });
    }
  });

  let countUndef = 0;
  let countDef = 0;

  const ids = [];
  let count = 0;

  // return null; // REMOVE. SIMPLY THERE FOR DEBUGGING. Sept. 9, 2021

  console.log("START GRAPH traverseBfs");

  graph.traverseBfs(id, (key, values) => {
    // outgoing flight from PTY
    count += 1;
    console.log("-------------------------------------");
    const isUndefined = propDelay(
      key,
      bookings_in,
      bookings_out,
      FSUm,
      bookings
    );
    ids.push([key, isUndefined]);
    countUndef += isUndefined;
    countDef += 1 - isUndefined;
    // console.log("returned from propDelay");
  });
  console.log(`number nodes traversed: , ${count}`);
  console.log(`nb undefined in propDelay: ${countUndef}`);
  console.log(`nb defined in propDelay: ${countDef}`);
  u.print("after graph traverse, bookings: ", bookings);
  u.print("after graph traverse, FSU: ", dFSU);

  // print all nodes with arrival Delay
  console.log("\nAfter Traverse All nodes with arrival DelayP > 0\n");
  dFSU.forEach((f) => {
    const arrDelayP = f.arrDelayP;
    if (arrDelayP > 0) {
      console.log(`id: ${f.id}, arrDelayP: ${arrDelayP}`);
    }
  });
  // u.print("ids traversed by graph [key,isUndefined]: ", ids);
  return null;
}
//--------------------------------------------------------
/*
  Starting with id, which is an incoming flight that departed late:
      Estimate its arrival delay via the rigid model (same as depature delay)
  outflights.forEach(out => {
             processOutgoingFlight(out)
        })
    function processOutgoingFlight(outFlight)
       - compute their feeders and the minimum ACT, and the ACT slack = minimum ACT - 30 min
       - use the scheduled arrival for all the feeders. (In reality, should use ETAs of all the feeders)
    1) compute min ACT - 30 = ACT slack
    2) If the tails are the same, compute available rotation (based on sched departure of outbound 
       and late arrival of feeder). RotSlack is   availRot - minConnectionRequirement
       Compute the minimum between (ACT slack) and (RotSlack)  ==>  and store in SlackP
    3) If the tails are different,  compute ACT slack and store it in SlackP
    4) If SlackP < 0, the departure delay is increased by (-SlackP), and the arrival delay is also 
       inreased by (-SlackP)
    5) ATTENTION: ACT_P is updated on edges and not on nodes.   (P means Predict)
  */

//---------------------------------------------------------------------
function updateEdge(outbound, FSUm) {
  const nano2min = 1 / 1e9 / 60;
  const e = outbound;
  e.fsu_f = FSUm[e.id_f];
  e.fsu_nf = FSUm[e.id_nf];
  // rotation only exists for fixed tails

  // Not needed since future is not known
  const calcRealRot = (e.fsu_nf.OUT_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal

  // Not needed since we are dealing with the future
  const calcAvailRot = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal

  const calcPlannedRot =
    (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // not equal

  // CONSIDER using scheduled ACT available on all flights since we do not know the future.
  //const actAvailable = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // same as calcAvailRot
  const actAvailable =
    (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // same as calcAvailRot

  e.availRotP = calcPlannedRot; // scheduled
  e.availRotMinReq = calcPlannedRot < 60 ? calcPlannedRot : 60; // 60 min
  e.rotSlackP = e.availRotP - e.availRotMinReq;
  e.ACTAvailable = actAvailable; // Based on best estimated information
  e.ACTAvailableP = e.ACTAvailable; // Based on best estimated information
  e.ACTSlack = e.ACTAvailable - 30; // not clear required
  e.ACTSlackP = e.ACTSlack;

  if (actAvailable < 0) {
    console.log(`\nsetupEdgeProps, actAvailable INSUFFICIENT: ${actAvailable}`);
  }
  return null;
}
//-------------------------------------------------------------
function updateNode(node, bookings_in, bookings_out) {
  console.log("inside updateNode");
  const n = node;

  u.print("updateNode, propagation, inbounds: ", n.inbounds);
  if (n.id.slice(10, 13) === "PTY") {
    // outbound flights from PTY
    if (n.inbounds !== undefined) {
      const obj = computeMinACT(n.inbounds, true);
      n.minId = obj.minId;
      n.minACT = obj.minACT;
      if (n.minACT < 30) {
        // insufficient time if < 30
        // All flights have scheduled sufficient time
        u.print("xxx obj, computeMinACT", obj);
      }
      n.rotSlackP = n.rotSlack; // CHANGE FORMULA
      n.minACTP = n.minACT; // CHANGE FORMULA
      n.ACTSlackP = n.minACTP - 30; // DO NOT HARDCODE 30 min
      // u.print("inbounds defined, id", n.id);
    } else {
      // u.print("inbounds undefined, id", n.id);
    }
  } else {
    // oubbound flight from Station
    n.minACT = 100000; //undefined;
    n.minACTP = n.minACT;
    n.ACTSlack = 100000; //undefined;
    n.ACTSlackP = n.ACTSlack;
    // update Rotation rotSlackP
  }
  n.slack = Math.min(n.rotSlack, n.ACTSlack);
  n.slackP = n.slack;
  n.depDelayP = 0; // If flight to study has no delay, it will have no impact.
  n.arrDelayP = 0;
}
//-------------------------------------------------------------------------
function processOutboundFlight(outbound, bookings_in, bookings_out, FSUm) {
  // bookings_in: map of array of flight pairs, indexed by id_nf
  // bookings_out: map of array of flight pairs, indexed by id_f

  // 1. adjust edge data of outbound flight
  // 2. adjust node data of outbound flight based on all feeders

  console.log("inside processOutboundFlight");
  updateEdge(outbound, FSUm);
  printEdgeData(outbound, "processOutboundFlight");

  const feeders = bookings_in[outbound.id_nf];
  let count = 0;
  feeders.forEach((f) => {
    count += 1;
    const node_nf = f.fsu_nf;
    console.log(`id_f: ${f.id_f}, id_nf: ${f.id_nf}`);
    console.log(`node_nf.id: ${node_nf.id}, count: ${count}`);
  });

  updateNode(outbound.fsu_nf, bookings_in, bookings_out);
  printNodeData(outbound, "processOutboundFlight");

  console.log("------------------------------------------------------");
  u.print("===> processOutboundFlight, outbound:", outbound); // an edge
  // \n  ACTAvailable: ${outbound.ACTAvailable},   // not defined initialy
  console.log(`
    \n  outbound.id_f: ${outbound.id_f}, 
    \n  outbound.id_nf: ${outbound.id_nf}, 
    \n  ACTAVailableP: ${outbound.ACTAvailableP}`); // an edge
  u.print("processOutboundFlight,feeders", u.createMapping(feeders, "id_f"));
  let minACT = 10000;
  let minId = undefined;

  if (feeders === undefined) {
    u.print("feeders are undefined"); // never happens
  } else {
    const obj = computeMinACT(feeders, true);
    minACT = obj.minACT;
    minId = obj.minId;
    u.print(`processOutboundFlight, minACT: ${minACT}, minId: ${minId}`);
  }

  const ACTSlack = minACT - 30;
  outbound.ACTSlackP = ACTSlack;
  outbound.fsu_nf.minACTP = minACT;
  outbound.fsu_nf.slackP = ACTSlack; // if there is no rotation issue. Ignore Rotation for now.

  if (ACTSlack < 0) {
    // if (ACTSlack < -900) {
    // if (ACTSlack == -932) {
    // for debugging. This should not happen.
    // CODE PRINTS THIS!!
    // console.log("-------------------------------------------------");
    console.log(
      `processOutboundFlight (traverse graph): ACTSlack: ${ACTSlack}, outbound id_nf: ${outbound.id_nf}`
    );
    // u.print(".... outbound", outbound);
    // computeMinACT(feeders,  false);
    // u.print(`.... computeMinAct: ${minACT}`); // -902
    // console.log("-------------------------------------------------");

    outbound.fsu_nf.depDelayP -= outbound.fsu_nf.slackP;
    outbound.fsu_nf.arrDelayP = outbound.fsu_nf.depDelayP;
  } else if (ACTSlack > 0) {
    outbound.fsu_nf.depDelayP = Math.max(
      outbound.fsu_nf.depDelayP - outbound.fsu_nf.slackP,
      0
    );
    outbound.fsu_nf.arrDelayP = outbound.fsu_nf.depDelayP;
  }
  return;
}

//-----------------------------------------------------------------------
function propDelay(id, bookings_in, bookings_out, FSUm, bookings) {
  // id is an incoming flight (either to PTY or to Sta)

  // ONLY consider the MIA flight to figure out why delays are not propagating
  // REMOVE the next 3 lines once code is debugged.
  /* */
  if (!id.includes("173")) {
    // console.log(`MIA 173 flight: ${id}`);
    return null;
  }
  /* */

  const outbounds = bookings_out[id];
  console.log(
    "==============================================================="
  );

  console.log(`propDelay, id= ${id}`);
  u.print("outbounds", outbounds);

  if (outbounds === undefined) {
    const fsu_idnf = FSUm[id];
    return 1;
  }
  outbounds.forEach((outbound) => {
    processOutboundFlight(outbound, bookings_in, bookings_out, FSUm);
  });
  return 0;
}

// update edge and node parameters (For Sunday Work)
//--------------------------------------------------------------------------
function initializePredictedDelaysAndSlacks(dFSU, dTailsSta) {
  const day = "2019/10/01";
  Object.values(dTailsSta).forEach((v) => {
    const milli2min = 1 / 1e3 / 60;
    const arr_f_ts = d.datetimeZToTimestamp(day, v.arr_f); // scheduled
    const dep_nf_ts = d.datetimeZToTimestamp(day, v.dep_nf); // scheduled
    // Rotation slack (i.e., rotation to spare)
    v.rotSlackPlanned = (dep_nf_ts - arr_f_ts) * milli2min - 60; // planned initial
    v.rotSlackP = v.rotSlackPlanned; // correct
  });

  return; // dTailsSta is mutable  (it is the value of a ref)
}

// CHECKS
// For each edge of the graph (constructed from an initial id), check whether the
// extremities can be found in the tailsSta list.
function checkEdgePTY(edges, tailsSta) {
  // edge represents PAX at PTY
  let undefined_src = 0;
  let undefined_dst = 0;
  let undefined_src_edges = [];
  let undefined_dst_edges = [];

  edges.forEach((e) => {
    if (e.src.slice(13, 16) === "PTY") {
      // rotation at station
      const id_src = e.src;
      const id_dst = e.dst;
      const tail_id_src = tailsSta[id_src];
      const tail_id_dst = tailsSta[id_dst];
      if (tail_id_src === undefined) {
        undefined_src++;
        undefined_src_edges.push(id_src);
      }
      if (tail_id_dst === undefined) {
        undefined_dst++;
        undefined_dst_edges.push(id_dst);
      }
    }
  });
}
//----------------------------------------------------------------------------
function handleBookingsIn(bookings_in, sources, id) {
  let ids = [];
  // Analyze bookings_in versus sources[id] <<<<< TODO
  if (bookings_in !== undefined && bookings_in[id] !== undefined) {
    // u.print("=> bookings_in", bookings_in);
    bookings_in[id].forEach((b) => {
      // ids.push(`in: id_f, id_nf, ${b.id_f}, ${b.id_nf}`);
      ids.push([b.id_f, b.id_nf]);
      // console.log(`inxx: id_f, id_nf: ${b.id_f}, ${b.id_nf}`);
      // console.log(b);
      if (id.slice(10, 13) !== "PTY") {
        u.print(`handle, bookings_in, Sta-PTY, defined, id: ${id}`); // none
      } else {
        u.print(`handle, bookings_in, PTY-Sta, defined, id: ${id}`); // yes, many
      }
    });
    u.print("=> bookings_in (id_f,id_nf): ", ids);
  } else {
    if (id.slice(10, 13) !== "PTY") {
      u.print(`handle, bookings_in, Sta-PTY, undefined, id: ${id}`); // yes
    } else {
      u.print(`handle, bookings_in, PTY-Sta, undefined, id: ${id}`); // none
    }
  }
}
//------------------------------------------------------------
function handleBookingsOut(bookings_out, targets, id) {
  let ids = [];
  if (bookings_out !== undefined && bookings_out[id] !== undefined) {
    // u.print("=> bookings_out", bookings_out);
    bookings_out[id].forEach((b) => {
      ids.push([b.id_f, b.id_nf]);
      // console.log(`outxx: id_f, id_nf: ${b.id_f}, ${b.id_nf}`);
      // console.log(b);
    });
    u.print("=> bookings_out (id_f,id_nf): ", ids);
    const len_bookings_out = ids.length;
    const len_targets = targets[id].length;
    if (len_bookings_out !== len_targets) {
      // LENGTHS ALWAYS MATCH!!
      u.print("len_bookings_out and len_targets do not match!!");
    }
    if (len_bookings_out === 1) {
      console.log("len_bookings_out is unity (1)");
    }
    console.log(`bookings_out length: ${id} ==> ${len_bookings_out}`);
  } else {
    if (id.slice(10, 13) !== "PTY") {
      console.log(`Undefined flight not from PTY. IMPOSSIBLE, id: ${id}`);
      // I found some impossible cases.
    }
    console.log(`bookings_out undefined, id: ${id}`);
  }
}
//--------------------------------------------------------------------------
function createGraph(edges, bookings_in, bookings_out) {
  // Enter the edges into a graph
  const graph = new DirectedGraph();

  u.print("inside createGraph, edges", edges);

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

  /*
  u.print("inside graph, barebones graph", graph);
  u.print("inside graph, barebones graph._vertices", graph._vertices);
  const ids = graph._vertices[16]; //"2019/10/01PAPPTY17:16203"];
  u.print("inside graph, ids=_vertices[22] ", ids); // undefined
  const ids1 = graph._vertices["2019/10/01PAPPTY17:16203"];
  u.print("inside graph, ids= _vertices['2019/....']", ids1); // undefine
  */

  // Upgrade graph
  // Given srcId, find all the destinations
  // given dstId, find all the sources

  //   graph.findDst(idSrc);
  //   graph.findSrc(idDst);

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
    // src: MIAPTY,    dst: PTYMDE  (correct)
    // src: PTYGYE,    dst: GYEPTY  (correct)
    // console.log(`src, dst: ${src}, ${dst}`);
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
  // u.print("number of undefined edges: ", edges_undefined); // should be zero (correct)
  // u.print("bookings_in", bookings_in);
  // u.print("bookings_out", bookings_out);

  // Since the graph is defined in terms of ids, it is easy to access either Tails
  // or bookings as required.

  // let count = 0;
  // Object.keys(targets).forEach((id) => {
  //   count++;
  //   console.log(`count: ${count}`);
  //   if (count < 1000) {
  //     // limit the output
  //     u.print("==> id: ", id);
  //     u.print("sources: ", sources[id]);
  //     u.print("targets: ", targets[id]);
  //     // for debugging
  //     handleBookingsIn(bookings_in, sources, id);
  //     //handleBookingsOut(bookings_out, targets, id);
  //   }
  // });

  graph.help =
    "targets[srcid] returns all the outbounds of the srcid inbound\n" +
    " sources[srcid] returns all the inbounds of the destid outbound";

  // u.print("graph.sources", graph.sources);
  // u.print("graph.targets", graph.targets);

  // u.print(
  // "inside graph, graph.sources['2019/...16203']",
  // graph.sources["2019/10/01PAPPTY17:16203"] // 1 el
  // );
  // u.print(
  // "inside graph, graph.targets['2019/...16203']",
  // graph.targets["2019/10/01PAPPTY17:16203"] // 12 el
  // );
  // u.print(
  // "inside graph, graph.targets['2019/...16203']['2019/10/01PTYBSB20:42205']",
  // graph.targets["2019/10/01PAPPTY17:16203"]["2019/10/01PTYBSB20:42205"] // 12 el
  // );

  return graph;
}
//--------------------------------------------------------------------------
function checkEdgeSta(edges, tailsSta) {
  // Rotation at station
  let undefined_src = 0;
  let undefined_dst = 0;
  let undefined_src_edges = [];
  let undefined_dst_edges = [];

  edges.forEach((e) => {
    if (e.src.slice(10, 13) === "PTY") {
      // rotation at station
      const id_src = e.src;
      const id_dst = e.dst;
      const tail_id_src = tailsSta[id_src];
      const tail_id_dst = tailsSta[id_dst];
      if (tail_id_src === undefined) {
        undefined_src++;
        undefined_src_edges.push(id_src);
      }
      if (tail_id_dst === undefined) {
        undefined_dst++;
        undefined_dst_edges.push(id_dst);
      }
    }
  });
}
//----------------------------------------------------
// Minimum Available Connection Time for Pax for flight "id"
// id is an outgoing flight
// function computeMinACT(feeders, bookings_f, bookings_nf, id) {
// function assumes that inbounds is well formed.
// The function is called by a node. The function collects information  on
// all edges connected to this node to estimate the minimum ACT
function computeMinACT(inbounds, FSUm = undefined, verbose = false) {
  const nano2min = 1 / 1e9 / 60;
  let minACT = 100000;
  // track which inbound is responsible for the minACT.
  let a = undefined;
  const obj = Object.create(null);

  inbounds.forEach((i) => {
    if (i.ACTAvailableP < minACT) {
      const inboundMinId = i.id_f;
      obj.minACT = i.ACTAvailableP;
      obj.inboundMinId = inboundMinId;

      /*
      if (verbose === true) {
        console.log(`+++ ===> computeMinACT, verbose: ${verbose} <=======`);
        console.log(`size of inbounds: ${inbounds.length}, minACT: ${minACT}`);
        console.log(`+++ ${obj.inboundMinId}, ${minACT} ...... ++++++`);
        u.print(`+++ computeMinAct: inbound.id_f: ${i.id_f}`);
        u.print("+++ inbound:", i); // at a STA
        u.print("+++ obj", obj);
        console.log(".....");
      }
      */
    }
  });

  /*
  if (verbose === true) {
    console.log("exit loop");
    u.print("obj", obj);
  }
  */

  // Does not work
  // return { minACT: minACT, inboundMinId: inboundMinId };
  return obj;
}
