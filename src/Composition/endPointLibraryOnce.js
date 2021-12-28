/* eslint-disable no-unreachable */
/* eslint-disable no-constant-condition */
import * as r from "./Tableref.js";
import * as u from "./utils.js";
import * as dt from "./dates.js";
// might not be needed
import { computeFeeders } from "./computeFeeders.js";
import { rigidModel } from "./endpointRigidModelOnce.js";
import { sortBy } from "lodash";
import { promised } from "q";
import * as hasher from "node-object-hash";
//---------------------------------------------------------------------
export function computePropagationDelays(
  initialID,
  initialArrDelay, // imposed delay on incoming flight
  maxArrDelay, // control what is taken into account
  dBookings, // three arrays now computed in text-processing. Not clear that the other arrays are still required. Perhaps.
  dFSU,
  dTails,
  graph
) {
  // Propagation is recursive. An error might lead to infinite calls, so stack overflow
  // dFSU and dTail not found
  // Construct a list of incoming/outgoing pairs
  // dBookings includes all the flights (rotations at PTY and stations)

  // bookingsIds are part of FSU nodes. So computeFeeders is no longer required.
  // Let us check this.

  const dFSUm = u.createMapping(dFSU, "id");
  u.print("dFSU", dFSU);
  u.print("computePropagationDelays, graph", graph);

  // Analyze the impact of an initial arrival delay (using historical data)
  // Does rigidModel compute information that depends on maxArrDelay and initialArrDelay?
  const delayObj = rigidModel(
    dFSU,
    dBookings,
    dTails,
    graph,
    initialArrDelay, // applied to initialID
    maxArrDelay, // control what nodes are taken into account
    initialID
  );
  {
    const nodes = delayObj.nodesTraversed;
    const edges = delayObj.edgesTraversed;
    u.print(
      `==> Original delayObj:  nbEdges: ${edges.length}, nbNodes: ${nodes.length}`
    );
  }

  u.print("returned from rigidModel, graph: ", graph);

  // Run all flights leaving a station through rigidModel.  This requires creating a list of Ids
  // Only keep flights in the air
  const idList = [];
  sortBy(dFSU, "id").forEach((r) => {
    if (r.id.slice(10, 13) !== "PTY") {
      console.log(
        `id: ${r.id}, orig: ${r.id.slice(10, 13)}, r.out: ${r.out}, r.in: ${
          r.in
        }`
      );
    }
    if (r.id.slice(10, 13) !== "PTY" && r.out !== 0 && r.in === 0) {
      // console.log(r);
      idList.push(r.id);
    }
  });

  u.print("dFSU", dFSU);
  u.print("idList", idList);

  //---------------------

  const delays = [];
  const arrays = { dFSU, dBookings, dTails, graph };
  const initArrDelays = [0, 15, 30, 45, 60, 120];
  const maxArrDelayNew = 15;

  // dFSU has repeats. HOW IS THIS POSSIBLE?
  const dFSUIdm = u.createMapping(dFSU, "id");
  dFSU = [];
  Object.values(dFSUIdm).forEach((r) => {
    dFSU.push(r);
  });

  console.log(`length(dFSUIdm): ${Object.keys(dFSUIdm).length}`);
  console.log(`length(dFSU): ${dFSU.length}`);
  u.print("maxArrDelay: ", maxArrDelayNew);
  u.print("idList: ", idList);

  idList.forEach((id) => {
    initArrDelays.forEach((initArrDelay) => {
      processDelays(id, delays, initArrDelay, maxArrDelayNew, arrays);
    });
  });
  u.print("delays", delays);
  //---------------------

  // graphEdges are the edges traversed.

  // TODO: create graphNodes: the nodes traversed, known from the ids traversed.
  // Use id2level (get the ids, read dFSU, and extract various parameters)
  // in Vue, draw Tables of edge data and node data (traversed in table)
  // >>> These nodes are not filtered according maxArrDelay.
  // Need a slider to modify maxArrDelay to diaply without recomputing rigidModel

  if (delayObj === undefined || delayObj === null) {
    console.log("Why is delayObj undefined or null, return from rigidMdoel");
    return {};
  }
  r.setTable(delayObj); // nodes, edges
  // delayNodes: subset of bookings with arrival delay > specified value
  const { nodes: delayNodes, id2level, graphEdges } = delayObj;

  // QUESTION: How can any planes in the future graph starting from startingId have landed? IMPOSSIBLE
  // The table is NOT the nodes traversed.
  const table = [];
  delayNodes.forEach((d) => {
    table.push({
      id: d.id,
      depDelay: d.depDelay,
      arrDelay: d.arrDelay,
      depDelayP: d.depDelayP,
      arrDelayP: d.arrDelayP,
      tail: d.TAIL,
      level: id2level[d.id], // level only set for nodes traversed
    });
  });

  delayObj.table = table;

  u.print("=> delayObj", delayObj);

  // Table contains nodes from delayNodes for display.
  return delayObj;
}
//-----------------------------------------------------------------------
function checkBookingsForConsistency(dBookings, dTails) {
  // Bookings should already have pairs of flights with same tails
  // console.log("Check whether bookings have same pairs with same tails");
  // Rotations are at PTY and at stations
  let idPairs = [];
  dBookings.forEach((r) => {
    if (r.tail_f === r.tail_nf) {
      // console.log(`bookings with same tails: ${r.id_f}, ${r.id_nf}`);
      idPairs.push({ id_f: r.id_f, id_nf: r.id_nf });
    }
  });

  idPairs = sortBy(idPairs, "id_f");
  // u.print("idPairs: ", idPairs);

  // Count the number of idPairs at station to make sure the number is the same as tails
  let countPairsPTY = 0;
  let countPairsSTA = 0;
  idPairs.forEach((r) => {
    if (r.id_f.slice(10, 13) !== "PTY") {
      countPairsPTY += 1;
    } else {
      countPairsSTA += 1;
    }
  });

  let tailPairs = [];
  let countTailsPTY = 0;
  let countTailsSTA = 0;
  dTails.forEach((r) => {
    tailPairs.push({ id_f: r.id_f, id_nf: r.id_nf });
    if (r.id_f.slice(10, 13) !== "PTY") {
      countTailsPTY += 1;
    } else {
      countTailsSTA += 1;
    }
  });
  tailPairs = sortBy(tailPairs, "id_f");
  // u.print("tailPairs: ", tailPairs);
  // u.print("tailPairs.length: ", tailPairs.length); // 83
  // console.log(`(tailPairs) countTailsPTY: ${countTailsPTY}`);
  // console.log(`(tailPairs) countTailsSTA: ${countTailsSTA}`);
  // console.log(
  // `(dBookings) nb of rotations at stations (idPairsPTY): ", ${countPairsPTY}`
  // ); // 13 (124 at PTY)
  // console.log(
  // `(dBookings) nb of rotations at stations (idPairsSTA): ${countPairsSTA}`
  // ); // 13 (124 at PTY)

  // QUESTION: Why the discrepency between tailpairs and countPairs? STRANGE.

  // Verify that each pair of (id_f, id_nf) in dTails can be found in dBookings

  // The easiest way to proceed would be to construct dTails, dBookings, ... to make rigidModel work.
  // Later on I can simplify.

  // dTail are the rotations outside PTY

  // No need to add dTail in dBookings. The tails are already included
}
//------------------------------------------------------------------------
function moreBookingsChecks(
  FSU,
  bookings,
  bookingIdsMap,
  bookingIds_in,
  bookingIds_out,
  tails
) {
  let nbUndefInIds = 0;
  let nbUndefOutIds = 0;
  let nbDefInIds = 0;
  let nbDefOutIds = 0;
  FSU.forEach((r) => {
    const id = r.id;
    const inIds = bookingIds_in[r.id];
    const outIds = bookingIds_out[r.id];
    if (inIds === undefined) {
      nbUndefInIds++;
      bookingIds_in[r.id] = []; // zero outbounds
      const schDep = dt.timestampToDateTimeZ(r.SCH_DEP_DTMZ / 1000).tmz;
      const schArr = dt.timestampToDateTimeZ(r.SCH_ARR_DTMZ / 1000).tmz;
      console.log(
        `inIds undefined, r.id: ${r.id}, sched dep/arr: ${schDep}, ${schArr}`
      );
    }
    if (outIds === undefined) {
      nbUndefOutIds++;
      bookingIds_out[r.id] = []; // zero inbounds
      const schDep = dt.timestampToDateTimeZ(r.SCH_DEP_DTMZ / 1000).tmz;
      const schArr = dt.timestampToDateTimeZ(r.SCH_ARR_DTMZ / 1000).tmz;
      console.log(
        `outIds undefined, r.id: ${r.id}, sched dep/arr: ${schDep}, ${schArr}`
      );
    }
    if (inIds !== undefined) nbDefInIds++;
    if (outIds !== undefined) nbDefOutIds++;
  });
  console.log(`nb undefined in_ids: ${nbUndefInIds}`);
  console.log(`nb undefined out_ids: ${nbUndefOutIds}`);
  console.log(`nb defined in_ids: ${nbDefInIds}`);
  console.log(`nb defined out_ids: ${nbDefOutIds}`);
  console.log("FSU sorted: ", sortBy(FSU, "id"));

  // Spot checking suggests that earlier flights

  // throw "Exit script";
}
//------------------------------------------------------------------------
function processDelays(id, delays, initArrDelay, maxArrDelay, arrays) {
  console.log(`id: ${id}, maxArrDelay: ${maxArrDelay}`);
  const { dFSU, dBookings, dTails, graph } = arrays;
  const ddelayObj = rigidModel(
    dFSU,
    dBookings,
    dTails,
    graph,
    initArrDelay, // applied to initialID
    maxArrDelay, // control what nodes are taken into account
    id
  );
  u.print(`==> ddelayObj(${id})`, ddelayObj);
  const nodes = ddelayObj.nodesTraversed;

  // count nb nodes with depDelayP > maxArrDelay
  let nbDelayP = 0;
  let totDelayP = 0;
  nodes.forEach((r) => {
    if (r.depDelayP > maxArrDelay) {
      nbDelayP += 1;
      totDelayP += r.depDelayP;
    }
  });
  const ratio = nbDelayP > 0 ? totDelayP / nbDelayP : 0;
  delays.push({
    id,
    maxArrDelay,
    initArrDelay: initArrDelay,
    nbDelayP,
    totDelayP,
    ratio: Math.floor(ratio),
  });
}
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
