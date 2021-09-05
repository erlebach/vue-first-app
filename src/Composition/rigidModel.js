import { DirectedGraph } from "@datastructures-js/graph";
import { max, tail, update } from "lodash";
import * as d from "./dates.js";
import * as u from "./utils.js";

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

export function rigidModel(
  dFSU, // values
  dTails,
  tailsSta,
  bookings,
  bookings_in,
  bookings_out,
  feeders,
  edges,
  startingId
) {
  // consider all the edges that start at a station -> PTY -> station.
  // These edges have e.src.OD.slice(13:16) == 'PTY'

  // checkEdgeSta(); // Debugging
  // checkEdgePTY(); // Debugging

  // Store minAvail Connection time and connection time slack with the outgoing flight

  // End letter P refers to "Propagated" or "Predicted"
  const FSUm = u.createMapping(dFSU, "id");
  // One should only update   the values in the future.  FOR A LATER IMPLEMENTATION

  const fsu_undefined = Object.create(null);
  fsu_undefined._f = 0;
  fsu_undefined._nf = 0;

  const nano2min = 1 / 1e9 / 60;

  //checkRotations(FSUm, bookings, dTails); // debug

  function setupBookingProps(e, FSUm) {
    e.fsu_f = FSUm[e.id_f];
    e.fsu_nf = FSUm[e.id_nf];
    // rotation only exists for fixed tails
    const calcRealRot = (e.fsu_nf.OUT_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal
    const calcAvailRot = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal
    const calcPlannedRot =
      (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // not equal
    const actAvailable = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // same as calcAvailRot

    e.availRotP = calcPlannedRot; // scheduled
    e.availRotMinReq = calcPlannedRot < 60 ? calcPlannedRot : 60; // 60 min
    e.rotSlackP = e.availRotP - e.availRotMinReq;
    e.ACTAvailableP = actAvailable; // Based on best estimated information
    e.ACTSlackP = e.ACTAvailableP - 30; // not clear required
  }

  bookings.forEach((e) => {
    e.fsu_f = FSUm[e.id_f];
    e.fsu_nf = FSUm[e.id_nf];
    // u.print("e", e);
    // rotation only exists for fixed tails
    if (e.tail) {
      // Sta
      setupBookingProps(e, FSUm);
    } else if (e.TAIL_f === e.TAIL_nf) {
      // PTY with tail turnaround and passengers
      setupBookingProps(e, FSUm);
    } else {
      const actAvailable = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // same as calcAvailRot
      e.availRotP = 100000;
      e.availRotMinReq = 100000;
      e.rotSlackP = 100000;
      e.ACTAvailableP = actAvailable; // Based on best estimated information
      e.ACTSlackP = e.ACTAvailableP - 30; // not clear required
    }
    if (e.fsu_f === undefined) {
      fsu_undefined._f++;
    }
    if (e.fsu_nf === undefined) {
      fsu_undefined._nf++;
    }
  });

  // Tails at stations will be missing. They should be added to bookings.
  // This should be easy but some attributs will have to be changed to match
  // what in in bookings

  u.print("fsu_f_undefined", fsu_undefined._f); // no undefines
  u.print("fsu_nf_undefined", fsu_undefined._nf); // no undefines

  // Initialize additional fields
  u.print("FSUm", FSUm);

  // NODE METADATA

  Object.values(FSUm).forEach((n) => {
    const inbounds = bookings_in[n.id]; // all feeders of flight id_nf
    const outbounds = bookings_out[n.id]; // all outbounds linked to feeder id_f
    n.inbounds = inbounds; // could be undefined (from PTY or Sta)
    n.outbounds = outbounds; // could be undefined (from PTY or Sta)

    // Flights that depart a Station too late arrive in PTY the next morning, and
    // are not included in the day's flights. So there are no outbounds.
    // The bookings object has no connections between arriving and departing flights
    // at  station
    /*
    if (inbounds === undefined && outbounds === undefined) {
      u.print("FSUm id (undefined inbounds and outbounds", n.id);
    }
    */

    if (n.ROTATION_PLANNED_TM < 60) {
      n.availRotMinReq = n.ROTATION_PLANNED_TM;
    } else {
      n.availRotMinReq = 60;
    }
    n.rotSlackP = n.ROTATION_PLANNED_TM - n.availRotMinReq;

    if (n.id.slice(10, 13) === "PTY") {
      // outbound flights from PTY
      if (inbounds !== undefined) {
        n.minACT = computeMinACT(inbounds, FSUm);
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
      n.ACTSlackP = 100000; //undefined;
    }
    n.slackP = Math.min(n.slackP, n.ACTSlackP);
    n.depDelayP = 0; // If flight to study has no delay, it will have no impact.
    n.arrDelayP = 0;
  });

  /*
  e.availRotP;
  e.rotSlackP;
  e.ACTAvailableP = e.ACTAvailable; // Based on best estimated information
  n.slackP;
  n.depDelayP;
  n.arrDelayP;
  n.availRotP;
  n.rotSlackP;
  */

  /*
  Object.values(bookings).forEach((e) => {
    const tail_f = e.tail_f;
    const tail_nf = e.tail_nf;
    if (tail_f === tail_nf) {
      e.availRotP = e.ROTATION_PLANNED_TM; // Is this the correct variable?
      e.rotSlackP = e.availRotP - 60;
    } else {
      e.availRotP = 1000000;
      e.rotSlackP = 1000000;
    }
    // u.print("bookings e", e);
  });
  */

  /*
  u.print("bookings", bookings);
  u.print("inbounds ", bookings_in);

  u.print("enter rigidModel, dFSU", dFSU);
  u.print("bookings_in", bookings_in);
  u.print("bookings_out", bookings_out);

  // Check tailSta
  u.print("tailsSta", tailsSta);
  */

  // initializePredictedDelaysAndSlacks(dFSU, tailsSta);
  u.print("before createGraph, bookings: ", bookings);

  //const tailm = u.createMapping(dTails, "id_f");
  const graph = createGraph(edges, bookings_in, bookings_out);

  // edges: src, dst  (PTY-Sta or Sta-PTY). Sta refers to "Station"
  // nodes: list of ids. Number edges == nb vertices. Why? If a tree, nb vertices should
  // equal nb edgs + 1.
  u.print("graph", graph);

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

  let countUndef = 0;
  let countDef = 0;

  const ids = [];

  graph.traverseBfs(id, (key, values) => {
    // outgoing flight from PTY
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
    console.log("returned from propDelay");
  });
  console.log(`nb undefined in propDelay: ${countUndef}`);
  console.log(`nb defined in propDelay: ${countDef}`);
  u.print("ids traversed by graph [key,isUndefined]: ", ids);
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

function processOutboundFlight(outbound, bookings_in, bookings_out) {
  // bookings_in: map of array of flight pairs, indexed by id_nf
  // bookings_out: map of array of flight pairs, indexed by id_f

  const feeders = bookings_in[outbound.id_nf];
  let minACT = 10000;

  if (feeders === undefined) {
    u.print("feeders are undefined"); // never happens
  } else {
    minACT = computeMinACT(feeders);
  }

  const ACTSlack = minACT - 30;
  outbound.ACTSlackP = ACTSlack;
  outbound.fsu_nf.minACTP = minACT;
  outbound.fsu_nf.slackP = ACTSlack; // if there is no rotation issue. Ignore Rotation for now.

  if (ACTSlack < 0) {
    // console.log(
    //   `==> outbound id_nf: ${outbound.id_nf}, depDelayP: ${outbound.fsu_nf.depDelayP}`
    // );
    // u.print("outbound.fsu_nf", outbound.fsu_nf);
    outbound.fsu_nf.depDelayP -= outbound.fsu_nf.slackP;
    outbound.fsu_nf.arrDelayP = outbound.fsu_nf.depDelayP;
    // console.log(
    //   `==> outbound id_nf: ${outbound.id_nf}, depDelayP: ${outbound.fsu_nf.depDelayP}`
    // );
    // console.log(
    //   `==> outbound id_nf: ${outbound.id_nf}, slackP: ${outbound.fsu_nf.slackP}`
    // );
  } else if (ACTSlack > 0) {
    // the dep and arrival delays get reduced.
    // console.log(
    //   `==> outbound id_nf: ${outbound.id_nf}, depDelayP: ${outbound.fsu_nf.depDelayP}`
    // );
    // console.log("==> decrease the delay");
    outbound.fsu_nf.depDelayP -= outbound.fsu_nf.slackP;
    outbound.fsu_nf.depDelayP = Math.max(outbound.fsu_nf.depDelayP, 0);
    outbound.fsu_nf.arrDelayP = outbound.fsu_nf.depDelayP;
    // console.log(
    //   `==> outbound id_nf: ${outbound.id_nf}, depDelayP: ${outbound.fsu_nf.depDelayP}`
    // );
    // console.log(
    //   `==> outbound id_nf: ${outbound.id_nf}, slackP: ${outbound.fsu_nf.slackP}`
    // );
  }
  return;
}

function propDelay(id, bookings_in, bookings_out, FSUm, bookings) {
  // id is an incoming flight (either to PTY or to Sta)
  const outbounds = bookings_out[id];

  // u.print("propDelay, FSUm", FSUm);
  console.log(`Enter propDelay, incoming flight id: ${id}`);
  u.print("bookings_out", bookings_out);
  u.print("bookings", bookings);

  if (true && outbounds === undefined) {
    // true is not necessar
    console.log("outbounds is undefined");
    const fsu_idnf = FSUm[id];
    // id arrives the next day, so its outbounds are not in the database
    console.log(
      `outbound arrives at: ${fsu_idnf.SCH_ARR_DTZ}, ${fsu_idnf.SCH_ARR_TMZ}`
    );
    return 1;
  }
  outbounds.forEach((outbound) => {
    console.log(`Outbound id: ${outbound.id_nf}`);
    processOutboundFlight(outbound, bookings_in, bookings_out);
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
      print("len_bookings_out and len_targets do not match!!");
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
  u.print("number of undefined edges: ", edges_undefined); // should be zero (correct)
  u.print("bookings_in", bookings_in);
  u.print("bookings_out", bookings_out);

  // Since the graph is defined in terms of ids, it is easy to access either Tails
  // or bookings as required.

  let count = 0;

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

  u.print("graph.sources", graph.sources);
  u.print("graph.targets", graph.targets);

  u.print(
    "inside graph, graph.sources['2019/...16203']",
    graph.sources["2019/10/01PAPPTY17:16203"] // 1 el
  );
  u.print(
    "inside graph, graph.targets['2019/...16203']",
    graph.targets["2019/10/01PAPPTY17:16203"] // 12 el
  );
  u.print(
    "inside graph, graph.targets['2019/...16203']['2019/10/01PTYBSB20:42205']",
    graph.targets["2019/10/01PAPPTY17:16203"]["2019/10/01PTYBSB20:42205"] // 12 el
  );

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
function computeMinACT(inbounds, FSUm = undefined) {
  const nano2min = 1 / 1e9 / 60;
  let minACT = 100000;
  inbounds.forEach((i) => {
    minACT = Math.min(minACT, i.ACTAvailableP);
  });

  return minACT;
}
