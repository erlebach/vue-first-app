/* eslint-disable no-unreachable */
import { DirectedGraph } from "@datastructures-js/graph";
import { max, tail, update } from "lodash";
import * as d from "./dates.js";
import * as u from "./utils.js";

//--------------------------------------------------------------------
//-------------------------------------------------------
function setupEdgeProps(e, FSUm) {
  const nano2min = 1 / 1e9 / 60;
  e.fsu_f = FSUm[e.id_f];
  e.fsu_nf = FSUm[e.id_nf];
  // rotation only exists for fixed tails

  // CONSIDER using scheduled ACT available on all flights since we do not know the future.
  //const actAvailable = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // same as calcAvailRot
  const actAvailable =
    (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // same as calcAvailRot

  e.ACTAvailable = actAvailable; // Based on best estimated information
  e.ACTAvailableP = e.ACTAvailable; // Based on best estimated information
  e.ACTSlack = e.ACTAvailable - 30; // not clear required
  e.ACTSlackP = e.ACTSlack;

  // u.print("vvvv tail_nf: ", e.fsu_nf.TAIL);
  // if (e.fsu_nf.TAIL === e.fsu_f.TAIL) {
  //   const rotPlanned =
  //     (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min;
  //   // console.log(
  //   //   `vvvv: rotPlanned: ${rotPlanned}, ${e.fsu_f.ROTATION_PLANNED_TM}`
  //   // );
  // }

  // the min required rotation time is a node property as is rotation.
  // However, edges should also have a property, called "time on the ground",
  // which can be either rotation or PAX.

  // Edges connect flights that are often not the same tails. Therefore,
  // rotation is not appropriate. It is a node property.

  // if (actAvailable < 0) {
  //   console.log(`\nsetupEdgeProps, actAvailable INSUFFICIENT: ${actAvailable}`);
  // }
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
      // const rotPlanned =
      //   (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min;
      // // Planned rotation on an edge is stored at the edge head (outgoing node, fsu_nf)
      // console.log(
      //   `wwww: rotPlanned: ${rotPlanned}, ${e.fsu_f.ROTATION_PLANNED_TM}, ${e.fsu_nf.ROTATION_PLANNED_TM}`
      // );
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
  // console.log("inside initializeNods");
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

    // console.log("*** INSIDE initializeNodes ***");

    if (n.id.slice(10, 13) === "PTY") {
      // outbound flights from PTY
      if (n.inbounds !== undefined) {
        const obj = computeMinACT(n.inbounds, true);
        n.minId = obj.minId;
        n.minACT = obj.minACT;
        // if (n.minACT < 30) {
        //   // insufficient time if < 30
        //   // All flights have scheduled sufficient time
        //   u.print("xxx obj, computeMinACT", obj);
        // }
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
      n.rotSlack = 0;
      n.rotSlackP = n.rotSlack;

      // const calcPlannedRot =
      // (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // not equal
      const calcPlannedRot = n.ROTATION_PLANNED_TM;
      if (calcPlannedRot < 60) {
        // console.log(`uuuu calcPlannedRot: ${calcPlannedRot} (< 60)`);
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

  // console.log("ssss");
  bookings.forEach((b) => {
    // console.log(b);
    b.INP_DTMZ_f = b.SCH_ARR_DTMZ_f;
    b.INP_DTMZ_nf = b.SCH_ARR_DTMZ_nf;
    b.OUTP_DTMZ_f = b.SCH_DEP_DTMZ_f;
    b.OUTP_DTMZ_nf = b.SCH_DEP_DTMZ_nf;
  });
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
  // u.print("enter rigid model");
  // consider all the edges that start at a station -> PTY -> station.
  // These edges have e.src.OD.slice(13:16) == 'PTY'

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

  if (initialArrDelayP) {
    FSUm[startingId].arrDelayP = initialArrDelayP;
    FSUm[startingId].rotSlackP -= initialArrDelayP;
  } else {
    // Arrival delay as given in FSU table
    // Ideally should be set to ETA, which updates every 15 min or so.
    FSUm[startingId].arrDelayP = FSUm[startingId].ARR_DELAY_MINUTES;
  }

  // Edge
  // u.print("bookings_in", bookings_in); // undefined
  // u.print("bookings_out", bookings_out); // undefined
  // u.print("bookings_in[startingId]", bookings_in[startingId]); // undefined
  // u.print("bookings_out[startingId]", bookings_out[startingId]);
  const outs = bookings_out[startingId];

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
  // console.log("\nBefore Traverse: all nodes with arrival DelayP\n");
  // u.print("dFSU", dFSU);
  dFSU.forEach((f) => {
    if (f.arrDelayP > 0) {
      // u.print("f", f);
      // printNodeData(f, "MIA 173 inbound");
      const outbounds = bookings_out[f.id];
      const inbounds = bookings_in[f.id];

      // outbounds.forEach((o) => {
      // printEdgeData(o, "Outbound at PTY");
      // });
    }
  });

  let countUndef = 0;
  let countDef = 0;

  const ids = [];
  let count = 0;

  // return null; // REMOVE. SIMPLY THERE FOR DEBUGGING. Sept. 9, 2021

  console.log("START GRAPH traverseBfs");
  const idsTraversed = [];

  graph.traverseBfs(id, (key, values) => {
    // outgoing flight from PTY
    idsTraversed.push(key);
    count += 1;
    // console.log("-------------------------------------");
    const isUndefined = propDelayNew(
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
  // u.print("ids traversed: ", idsTraversed);
  // console.log(`number nodes traversed: , ${count}`);
  // console.log(`nb undefined in propDelay: ${countUndef}`);
  // console.log(`nb defined in propDelay: ${countDef}`);
  // u.print("after graph traverse, bookings: ", bookings);
  // u.print("after graph traverse, FSU: ", dFSU);

  // print all nodes with arrival Delay
  console.log("\nAfter Traverse All nodes with arrival DelayP > 0\n");
  dFSU.forEach((f) => {
    const arrDelayP = f.arrDelayP;
    if (arrDelayP > 0) {
      console.log(`id: ${f.id}, arrDelayP: ${arrDelayP}`);
      // printNodeData(f, "Nodes with delayP>0");
    }
    if (f.count > 1) {
      console.log(`(${f.id}: count: ${f.count} cannot be greater than 1!`);
    }
  });

  // Outbounds of original flight
  // u.print(
  //   `Outbounds of original flight ${id}`,
  //   u.createMapping(bookings_out[id], "id_nf")
  // );
  // u.print("ids traversed by graph [key,isUndefined]: ", ids);
  return null;
}
//--------------------------------------------------------
//---------------------------------------------------------------------
function updateInEdges(outboundNode, bookings_in) {
  // console.log("ENTERED updateEdges");
  // u.print("outbound node", outboundNode);

  const nano2min = 1 / 1e9 / 60;

  // Delay: ARR_DELAY_MIN and arrDelayP (not the same)
  const node = outboundNode; // feeder node
  // console.log(`OutboundNode id: ${outboundNode.id}`);
  // console.log(
  // `arrivalDelayMINUTES: ${node.ARR_DELAY_MINUTES}, arr_delayP: ${node.arrDelayP}`
  // );

  const inboundEdges = bookings_in[outboundNode.id];
  if (inboundEdges === undefined) {
    return null;
  }

  // u.print(
  // "inside updateEdges, inbound_edges: ",
  // u.createMapping(inboundEdges, "id_f")
  // );

  inboundEdges.forEach((e) => {
    // console.log(`=> new feeder, id_f: ${e.id_f}`);
    // arrDelayP was set by the user.

    // rotation only exists for fixed tails

    // const arrDelay =
    // Not needed since future is not known
    // const calcRealRot = (e.fsu_nf.OUT_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal

    // Not needed since we are dealing with the future
    // const calcAvailRot = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal
    // e.availRotP = calcPlannedRot; // scheduled
    // e.availRotMinReq = calcPlannedRot < 60 ? calcPlannedRot : 60; // 60 min
    // e.rotSlackP = e.availRotP - e.availRotMinReq;

    // CONSIDER using scheduled ACT available on all flights since we do not know the future.
    //const actAvailable = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // same as calcAvailRot
    // Assumes no arrival delay relative to scheduled time
    // Should already be defined
    e.ACTAvailable = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // same as calcAvailRot

    // e.ACTAvailable = actAvailable; // Based on best estimated information
    // ACTAvailable is based on scheduled departure and arrival times
    const arrDelayP = e.fsu_f.arrDelayP;
    // console.log(`arrDelayP: ${arrDelayP}`);
    e.ACTAvailableP = e.ACTAvailable - arrDelayP; // Based on best estimated information
    e.ACTSlackP = e.ACTAvailableP - 30; // harcoded, but really, a function of city/airport
    // console.log(`ACTAVailable/P: ${e.ACTAvailable}, ${e.ACTAvailableP}`);

    // update rotation
    if (e.TAIL_f === e.TAIL_nf) {
      // u.print("Equal tails, edge e: ", e);
      e.rotSlackP = e.rotSlack - e.arrDelayP;
      // console.log(`e.rotSlack: ${e.rotSlack}, e.arrDelayP: ${e.arrDelayP}`);
      // console.log(`updateEdges, id_f: ${e.id_f}, id_nf: ${e.id_nf}`);
      // if (e.rotSlackP < 0) {
      //   console.log(
      //     `\nzzz, updateEdges, rotSlackP INSUFFICIENT: ${e.rotSlackP}`
      //   );
      // }
    }

    // if (e.ACTAvailableP < 0) {
    //   console.log(
    //     `\nupdateEdges, ACTAvailableP INSUFFICIENT: ${e.ACTAvailableP}`
    //   );
    // }
  });
  return null;
}
//-------------------------------------------------------------
function updateOutboundNode(node, bookings_in, bookings_out) {
  // console.log("ENTERED updateOutboundNode");
  const n = node;

  // if an ETA changes, the flight arrival delay increases or decreases.
  // This immediately affects rotSlackP according to
  // rotSlackP = rotSlack - arrDelay, where rotSlack is the initial value

  // u.print(`node (${node.id}): `, node);
  // u.print("bookings_in: ", bookings_in);
  // u.print("bookings_out: ", bookings_out);
  const feeders = bookings_in[node.id];
  // u.print("feeders: ", feeders);
  if (feeders === undefined) {
    return undefined;
  }
  // u.print("feeders: ", u.createMapping(feeders, "id_f"));

  if (n === undefined || n.inbounds === undefined) {
    // console.log("n or n.inbounds undefined");
    return undefined;
  }

  n.count += 1; // This number should never go beyond 1

  // u.print("updateNode, node n: ", n);
  // u.print("updateNode, propagation, inbounds: ", n.inbounds);
  // u.print("updateNode, inbound (node) id: ", n.id);
  if (n.id.slice(10, 13) === "PTY") {
    // outbound flights from PTY
    console.log(" . outbound flight from PTY");
    if (n.inbounds !== undefined) {
      // u.print(
      //   "before computeMinACT, n.inbounds",
      //   u.createMapping(n.inbounds, "id_f")
      // );
      const obj = computeMinACT(n.inbounds, true);
      n.minId = obj.minId;
      n.minACT = obj.minACT;
      // u.print("result from computeMinACT", obj);
      // if (n.minACT < 30) {
      //   // insufficient time if < 30
      //   // All flights have scheduled sufficient time
      //   u.print("xxx obj, computeMinACT", obj);
      // }
      n.minACTP = n.minACT; // CHANGE FORMULA
      n.ACTSlackP = n.minACTP - 30; // DO NOT HARDCODE 30 min
      // if (n.ACTSlackP < 0) {
      //   console.log(`n.ACTSlackP < 0 (${n.ACTSlackP})`);
      // }
    } else {
      // u.print("inbounds undefined, id", n.id);
    }
  } else {
    // oubbound flight from Station
    // console.log(`tttt at outbound station: (${n.id})`);
    // u.print("tttt at outbound station, n", n);
    // u.print("tttt at outbound station, inbounds", n.inbounds);
    // printNodeData(n);

    n.minACT = 100000; //undefined;
    n.minACTP = n.minACT;
    n.ACTSlack = 100000; //undefined;
    n.ACTSlackP = n.ACTSlack;
    // update Rotation rotSlackP
    const nano2min = 1 / 1e9 / 60;
    const e = n.inbounds[0];
    n.rotAvail = (n.SCH_DEP_DTMZ - e.fsu_f.INP_DTMZ) * nano2min;
    // console.log(`n.rotAvail: ${n.rotAvail}`);
    n.rotSlack = n.rotAvail - n.availRotMinReq;
    n.rotSlackP = n.rotSlack - e.fsu_f.arrDelayP;
    // Each node should only be touched once.
  }
  // Not sure about rotSlackP. Must look into that.  ****** DEBUG
  n.slackP = Math.min(n.rotSlackP, n.ACTSlackP);
  if (n.slackP < 0) {
    // console.log(`yyy: INSUFFICIENT slackP (${n.slackP})`);
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
//----------------------------------------------------
function processOutboundFlight(outbound, bookings_in, bookings_out, FSUm) {
  // bookings_in: map of array of flight pairs, indexed by id_nf
  // bookings_out: map of array of flight pairs, indexed by id_f

  // 1. adjust edge data of outbound flight
  // 2. adjust node data of outbound flight based on all feeders

  // console.log("==> ENTER processOutboundFlight");
  // outbound is an edge
  // if arrival is early, the ACTs on the edges increase (more time for the passengers)
  // the rotation time increases (strictly, the rotation is an edge property)
  // Original edge rotation should be set based on the rotation info stored in the nodes.
  updateInEdges(outbound.fsu_nf, bookings_in);
  // The feeder node id is outbound.id_f
  // The outbound node id is outbound.id_nf
  updateOutboundNode(outbound.fsu_nf, bookings_in, bookings_out);
  // printEdgeData(
  //   outbound,
  //   `processOutboundFlight (${outbound.id_f}, ${outbound.id_nf}`
  // );
  // printNodeData(outbound.fsu_nf, `outbound node (${outbound.fsu_nf})`);

  return undefined;
}

//-----------------------------------------------------------------------
// Remove duplicated class to processOutboundFlightss
function propDelayNew(id, bookings_in, bookings_out, FSUm, bookings) {
  // id is an incoming flight (either to PTY or to Sta)

  // if (!id.includes("173")) {
  //   // console.log(`MIA 173 flight: ${id}`);
  //   return null;
  // }

  // ---------------------
  // console.log("==> ENTER propDelayNew");
  updateInEdges(FSUm[id], bookings_in);
  updateOutboundNode(FSUm[id], bookings_in, bookings_out);

  return 0; // not sure what I am returning
}

//-----------------------------------------------------------------------

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
      // if (id.slice(10, 13) !== "PTY") {
      //   u.print(`handle, bookings_in, Sta-PTY, defined, id: ${id}`); // none
      // } else {
      //   u.print(`handle, bookings_in, PTY-Sta, defined, id: ${id}`); // yes, many
      // }
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
  // track which inbound is responsible for the minACT.
  let a = undefined;
  const obj = Object.create(null);
  obj.minACT = 100000;

  inbounds.forEach((i) => {
    // console.log(
    //   `.computeMinACT, i.id: ${i.id_f}, i.ACTAvailableP: ${i.ACTAvailableP}, minACT: ${obj.minACT}`
    // );
    if (i.ACTAvailableP < obj.minACT) {
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