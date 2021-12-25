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
  dBookings1, // three arrays now computed in text-processing. Not clear that the other arrays are still required. Perhaps.
  dFSU1,
  dTails,
  edges,
  graph
) {
  // dBookings1, dFSU1, dTails1, are copies to protect against overwriting elements. (Does not solve error)
  // These are arrays of Objects. The copy ([...]) copies the references (object addresses), but not the object content.
  // I need a deep copy.

  // Still does not work without the copy operation.
  const dFSU = u.arrOfObjectsCopy(dFSU1);
  const dBookings = u.arrOfObjectsCopy(dBookings1);
  // const dFSU = dFSU1;
  // const dBookings = dBookings1;

  //const dTails = [...dTails1];
  // console.log("ENTER computePropagationDelays");
  // u.print("ENTER computePropagationDelays, dBookings", dBookings);
  // u.print("ENTER computePropagationDelays, dFSU", dFSU);
  // u.print("ENTER computePropagationDelays, dFSU[0]", dFSU[0]);
  // u.print("ENTER computePropagationDelays, dFSU1[0]", dFSU1[0]);
  // throw "script end";

  // let hashCoercer = hasher({ sort: true, coerce: true });
  // const hFSU = hashCoercer.hash(dFSU);
  // const hTails = hashCoercer.hash(dTails);
  // const hBookings = hashCoercer.hash(dBookings);
  // const hedges = hashCoercer.hash(edges);
  // const hgraph = hashCoercer.hash(graph);
  // console.log(`hash hFSU: ${hFSU}`);
  // console.log(`hash hTails: ${hTails}`);
  // console.log(`hash hBookings: ${hBookings}`);
  // console.log(`hash hedges: ${hedges}`);
  // console.log(`hash hgraph: ${hgraph}`);
  // console.log(`dFSU: ${dFSU.length}`);
  // console.log(`dBookings: ${dBookings.length}`);
  // console.log(`dTails: ${dTails.length}`);
  // console.log(`initialID: ${initialID}`);

  // console.log("enter computePropagate");
  // id is a composite of id_f and id_nf separated by a '-'
  const dBookingsIdMap = u.createMapping(dBookings, "id"); // CHECK
  // u.print("dBookingsIdMap", Object.keys(dBookingsIdMap).length); // 685

  // Check that 'id' attribute is not composed of the same id twice
  // Object.values(dBookingsIdMap).forEach((r) => {
  //   const id = r.id;
  //   const idf = r.id.slice(0, 25);
  //   const idnf = r.id.slice(26, 51);
  //   console.log(`id, id_f, id_nf: ${r.id}, ${r.id_f}, ${r.id_nf}`);
  //   console.log(`idf, idfnf: ${idf}, ${idnf}`);
  //   if (idf === idnf) {
  //     console.log("idf === idnf: SHOULD NOT HAPPEN");
  //   }
  // });

  // Propagation is recursive. An error might lead to infinite calls, so stack overflow
  // dFSU and dTail not found
  // Construct a list of incoming/outgoing pairs
  // dBookings includes all the flights (rotations at PTY and stations)

  // bookingsIds are part of FSU nodes. So computeFeeders is no longer required.
  // Let us check this.

  console.log("------------------------");
  // u.print("bookingIds_in: ", bookingIds_in);
  dFSU.forEach((r) => {
    // const inIds = bookingIds_in[r.id];  // ERROR
    // const outIds = bookingIds_out[r.id];
    console.log(`id: ${r.id}`);
    u.print("FSU.inboundIds: ", r.inboundIds);
    u.print("FSU.outboundIds: ", r.outboundIds);
    // u.print("inIds", inIds);
    // u.print("outIds", outIds);
    console.log("------------------------");
  });

  const dFSUm = u.createMapping(dFSU, "id");
  u.print("dFSUm", dFSUm);

  // computeFeeders might not be required
  // feeders is not required (same as bookings_in)
  let {
    // bookings_in, // remove top two once the code works without
    // bookings_out,
    bookingIds_in,
    bookingIds_out,
  } = computeFeeders(dBookings);

  u.print("before computeFeeders::bookingIds_in", bookingIds_in);
  u.print("before computeFeeders::bookingIds_out", bookingIds_out);

  const initIDout = bookingIds_out[initialID];
  u.print(`outbound from initialID ${initialID}`, initIDout); // value does not change.

  // moreBookingsChecks(
  //   dFSU,
  //   dBookings,
  //   dBookingsIdMap,
  //   bookingIds_in,
  //   bookingIds_out,
  //   dTails
  // );
  // const hBookingsIdMap = hashCoercer.hash(dBookingsIdMap);
  // const hBookingIds_in = hashCoercer.hash(bookingIds_in);
  // const hBookingIds_out = hashCoercer.hash(bookingIds_out);
  // console.log(`hash bookingsIdMap: ${hBookingsIdMap}`);
  // console.log(`hash bookingIds_in: ${hBookingIds_in}`);
  // console.log(`hash bookingIds_out: ${hBookingIds_out}`);
  // moreBookingsChecks(
  //   dFSU,
  //   dBookings,
  //   dBookingsIdMap,
  //   bookingIds_in,
  //   bookingIds_out,
  //   dTails
  // );

  // return {}; // all hashes are unchanged

  // throw "Exit Script";

  // bookings_in[id_nf]: list of incoming flights connecting to id_nf
  // bookings_out[id_f]: list of outgoing flights connected to id_f
  // bookingsIds_in[id_nf]: list of incoming flight ids connecting to id_nf
  // bookingsIds_out[id_f]: list of outgoing flights ids connected to id_f
  // Attributes in datastructure:
  // ACTAvailable, ACTAvailableP, ACTSlack, ACTSlackP, INP_DTMPZ_(f,nf), OUTP_DTMZ_(n,nf),
  // SCH_ARR_DTMZ_(f,nf), SCH_DEP_DTMZ_(f,nf)

  // Analyze the impact of an initial arrival delay (using historical data)
  // Does rigidModel compute information that depends on maxArrDelay and initialArrDelay?
  const delayObj = rigidModel(
    // ERROR IN rigidModel!!!<<<<<
    dFSU,
    dBookings,
    dBookingsIdMap, // CHECK
    dTails,
    edges,
    graph,
    // bookingIds_in, // CHECK
    // bookingIds_out, // CHECK
    initialArrDelay, // applied to id
    maxArrDelay, // control what nodes are taken into account
    initialID
  );

  u.print("Return from rigidModel, delayObj: ", delayObj);

  // delayObj is in reality:
  // {nodes: nodesWithArrDelay,
  // edges: edgesWithInArrDelay, // not useful
  // graphEdges:
  // level2ids,
  // id2level,}

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
  // u.print("delayNodes", delayNodes);
  // u.print("graphEdges", graphEdges);

  // Probably already computed, so duplication
  const dFSUIds = u.createMapping(dFSU, "id");

  const nodesTraversed = [];
  for (let id in id2level) {
    // console.log(`id2level, id: ${id}`);
    nodesTraversed.push(dFSUIds[id]);
  }

  // Add some elements for the tool tips
  nodesTraversed.forEach((r) => {
    // divide by 1000: ns to ms
    const dep = dt.timestampToDateTimeZ(r.SCH_DEP_DTMZ / 1000);
    r.schDepTMZ = dep.dtz + ", " + dep.tmz;
    const arr = dt.timestampToDateTimeZ(r.SCH_ARR_DTMZ / 1000);
    r.schArrTMZ = arr.dtz + ", " + arr.tmz;
    r.tail = r.TAIL;
  });
  u.print("nodesTraversed: ", nodesTraversed);

  delayObj.nodesTraversed = nodesTraversed;

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

  u.print("==> computePropagationDelays::table: ", table);
  u.print("==> computePropagationDelays::table.length: ", table.length);

  // QUESTION: How can all elements of dFSU have arrDelayP and depDelayP set?
  u.printAttributes("dFSU dep/arr delays", dFSU, [
    "depDelay",
    "depDelayP",
    "arrDelay",
    "arrDelayP",
    "status",
  ]);

  console.log("id2level");
  console.log(id2level);

  // table.forEach((row) => {
  //   row.level = id2level[row.id];
  // });

  // const FSUnode = dFSUm["2021-12-24PTYMDE12:240150"];
  // u.print("FSUnode", FSUnode);
  // throw "end script";

  console.log(`table length: ${table.length}`);
  console.log(table);
  delayObj.table = table;
  u.print("computePropagationDelays::delayObj", delayObj);

  // Table contains nodes from delayNodes for display.
  return delayObj;
}
//-----------------------------------------------------------------------
function checkBookingsForConsistency(dBookings, dTails) {
  // Bookings should already have pairs of flights with same tails
  console.log("Check whether bookings have same pairs with same tails");
  // Rotations are at PTY and at stations
  let idPairs = [];
  dBookings.forEach((r) => {
    if (r.tail_f === r.tail_nf) {
      console.log(`bookings with same tails: ${r.id_f}, ${r.id_nf}`);
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
  u.print("tailPairs: ", tailPairs);
  u.print("tailPairs.length: ", tailPairs.length); // 83
  console.log(`(tailPairs) countTailsPTY: ${countTailsPTY}`);
  console.log(`(tailPairs) countTailsSTA: ${countTailsSTA}`);
  console.log(
    `(dBookings) nb of rotations at stations (idPairsPTY): ", ${countPairsPTY}`
  ); // 13 (124 at PTY)
  console.log(
    `(dBookings) nb of rotations at stations (idPairsSTA): ${countPairsSTA}`
  ); // 13 (124 at PTY)

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
  // Perform sanity checks on the arguments
  // do all flights in dFSU have inbounds and outbound flights?
  u.print("moreBookingsChecks::bookingsIds_in", bookingIds_in); // UNDEFINED  MUST FIX
  u.print("moreBookingsChecks::bookingsIds_out", bookingIds_out); // UNDEFINED MUST FIX
  console.log(`FSU length: ${FSU.length}`);
  let nbUndefInIds = 0;
  let nbUndefOutIds = 0;
  let nbDefInIds = 0;
  let nbDefOutIds = 0;
  FSU.forEach((r) => {
    const id = r.id;
    // u.print("bookingIds_in[r.id]", bookingIds_in[r.id]);
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
