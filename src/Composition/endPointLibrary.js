/* eslint-disable no-constant-condition */
import * as r from "../Composition/Tableref.js";
import * as u from "../Composition/utils.js";
// might not be needed
import { computeFeeders } from "../Composition/computeFeeders.js";
import { rigidModel } from "../Composition/endpointRigidModel.js";
import { sortBy } from "lodash";
import { promised } from "q";

//---------------------------------------------------------------------
export function computePropagationDelays(
  flightTable,
  inboundsMap,
  outboundsMap,
  ptyPairs,
  stationPairs,
  allPairs,
  initialID,
  initialArrDelay, // imposed delay on incoming flight
  maxArrDelay // control what is taken into account
) {
  // Arguments
  // inboundsMap[id_nf]: inbounds associated with id_f (the pair have different tails)
  // outboundsMap[id_nf]: outbounds associated with id_nf (the pair have different tails)
  // flightTable: list of all flights during the specified period (on the ground and in the air)
  //       One flight per row. Calculated in text-processing. arrDelay and depDelay attributes have
  //       been computed and represent best guess arrivals and delays.

  // Export function computePropagationDelays(dFSU, dTails, dBookings, initialID)
  // include tails in bookings

  flightTable = flightTable.sort((a, b) => a.sch_dep - b.sch_dep);

  const { dBookings, dFSU, dTails } = create_FSU_BOOK_TAILS(
    allPairs,
    flightTable,
    inboundsMap,
    outboundsMap
  );

  const id = initialID;

  // Propagation is recursive. An error might lead to infinite calls, so stack overflow
  // dFSU and dTail not found
  // Construct a list of incoming/outgoing pairs
  // dBookings includes all the flights (rotations at PTY and stations)

  // computeFeeders might not be required
  // feeders is not required (same as bookings_in)
  let { bookings_in, bookings_out } = computeFeeders(dBookings);

  // bookings_in[id_nf]: list of incoming flights connecting to id_nf
  // bookings_out[id_f]: list of outgoing flights connected to id_f
  // Attributes in datastructure:
  // ACTAvailable, ACTAvailableP, ACTSlack, ACTSlackP, INP_DTMPZ_(f,nf), OUTP_DTMZ_(n,nf),
  // SCH_ARR_DTMZ_(f,nf), SCH_DEP_DTMZ_(f,nf)
  console.log(`==> id: ${id}`);

  // Analyze the impact of an initial arrival delay (using historical data)
  // Does rigidModel compute information that depends on maxArrDelay and initialArrDelay?
  const delayObj = rigidModel(
    dFSU,
    dBookings,
    bookings_in,
    bookings_out,
    // edges, // constructed from dBookings. Create edtes in rigidModel?
    initialArrDelay, // applied to id
    maxArrDelay, // control what nodes are taken into account
    id
  );

  console.log(`initialArrDelay: ${initialArrDelay}`);

  //
  // delayObj is in reality:
  // {nodes: nodesWithArrDelay,
  // edges: edgesWithInArrDelay, // not useful
  // graphEdges: newEdges,
  // level2ids,
  // id2level,}

  if (delayObj === undefined || delayObj === null) {
    return undefined;
  }
  r.setTable(delayObj); // nodes, edges
  const delayNodes = delayObj.nodes;
  // const level2ids = delayNodes.level2ids;
  const id2level = delayObj.id2level;
  u.print("delayNodes", delayNodes);
  const graphEdges = delayObj.graphEdges;
  u.print("graphEdges", graphEdges);

  // QUESTION: How can any planes in the future graph starting from startingId have landed? IMPOSSIBLE

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
  console.log(`table length: ${table.length}`);
  console.log(table);
  delayObj.table = table;
  u.print("computePropagationDelays::delayObj", delayObj);
  return delayObj;
}
//-----------------------------------------------------------------------
function createBookings(inboundsMap, outboundsMap, allPairs, flightTableMap) {
  // Arguments
  // inboundsMap[id_nf]: list of feeders
  console.log("-----  enter createBookings ------");
  let dBookings = [];
  for (let id_f in outboundsMap) {
    // console.log(`id_f: ${id_f}`);
    const r_f = flightTableMap[id_f];
    outboundsMap[id_f].forEach((id_nf) => {
      // console.log(`id_nf: ${id_nf}`);
      const r_nf = flightTableMap[id_nf];
      if (r_f.in === undefined) {
        console.log(
          `createBookings::outboundsMap,  ${r_f.id}, in_f is undefined`
        ); // None are undefined
      }
      if (r_nf.in === undefined) {
        console.log(
          `createBookings::outboundsMap,  ${r_f.id}, in_nf is undefined`
        ); // None are undefined
      }
      dBookings.push({
        id: r_f.id + "-" + r_nf.id,
        id_f: r_f.id,
        id_nf: r_nf.id,
        tail_f: r_f.tail,
        tail_nf: r_nf.tail,
        in_f: r_f.in,
        in_nf: r_nf.in,
        out_f: r_f.out,
        out_nf: r_nf.out,
        SCH_ARR_DTMZ_f: r_f.sch_arr * 1000, // ns
        SCH_ARR_DTMZ_nf: r_nf.sch_arr * 1000, // ns
        SCH_DEP_DTMZ_f: r_f.sch_dep * 1000, // ns
        SCH_DEP_DTMZ_nf: r_nf.sch_dep * 1000, // ns
        status_f: r_f.status,
        status_nf: r_nf.status,
      });
    });
  }

  for (let id_nf in inboundsMap) {
    // console.log(`id_f: ${id_f}`);
    const r_nf = flightTableMap[id_nf];
    inboundsMap[id_nf].forEach((id_f) => {
      // console.log(`id_nf: ${id_nf}`);
      const r_f = flightTableMap[id_f];
      dBookings.push({
        id: r_f.id + "-" + r_nf.id,
        id_f: r_f.id,
        id_nf: r_nf.id,
        tail_f: r_f.tail,
        tail_nf: r_nf.tail,
        in_f: r_f.in,
        in_nf: r_nf.in,
        out_f: r_f.out,
        out_nf: r_nf.out,
        SCH_ARR_DTMZ_f: r_f.sch_arr * 1000, // ns
        SCH_ARR_DTMZ_nf: r_nf.sch_arr * 1000, // ns
        SCH_DEP_DTMZ_f: r_f.sch_dep * 1000, // ns
        SCH_DEP_DTMZ_nf: r_nf.sch_dep * 1000, // ns
        status_f: r_f.status,
        status_nf: r_nf.status,
      });
    });
  }

  // u.checkEdgesDirection(dBookings, "check order in dBookings");
  allPairs.forEach((r) => {
    // u.print("allPairs row", r);
    if (r.in_f === undefined) {
      console.log(`createBookings::allpairs[id_f: ${r.id_f} is undefined`);
    }
    dBookings.push({
      id: r.id_f + "-" + r.id_nf,
      id_f: r.id_f,
      id_nf: r.id_nf,
      tail_f: r.tail,
      tail_nf: r.tail,
      tail: r.tail,
      in_f: r.in_f,
      in_nf: r.in_nf,
      out_f: r.out_f,
      out_nf: r.out_nf,
      SCH_DEP_DTMZ_f: r.sch_dep_f * 1000, // ns
      SCH_ARR_DTMZ_f: r.sch_arr_f * 1000, // ns
      SCH_DEP_DTMZ_nf: r.sch_dep_nf * 1000, // ns
      SCH_ARR_DTMZ_nf: r.sch_arr_nf * 1000, // ns
      status_f: r.status_f,
      status_nf: r.status_nf,
    });
  });
  // u.print("exit createBookings, dBookings: ", dBookings);
  console.log(
    `createBookings::dBookings.length (non-unique): ${dBookings.length}`
  );

  // Remove duplicates (id_f, id_nf) pairs in dBookings
  const bookingsId = u.createMapping(dBookings, "id");
  dBookings = [];
  for (let id in bookingsId) {
    dBookings.push(bookingsId[id]);
  }
  console.log(`createBookings::dBookings.length (unique): ${dBookings.length}`);

  // Check that there are no duplicate pairs
  // There were none, but now we are sure.
  const dbidf = sortBy(dBookings, "id_f");
  const dbidnf = sortBy(dBookings, "id_nf");
  // There are multiple repeats

  // u.print("dBookings sorted by id_f", dbidf);
  // u.print("dBookings sorted by id_nf", dbidnf);
  // u.print("exit createBookings, unique dBookings: ", dBookings);

  // Check whether either ORIG or DEST is PTY
  let countOD_f = 0;
  let countOD_nf = 0;
  dBookings.forEach((r) => {
    const ORG_f = r.id_f.slice(10, 13);
    const DST_f = r.id_f.slice(13, 16);
    const ORG_nf = r.id_nf.slice(10, 13);
    const DST_nf = r.id_nf.slice(13, 16);
    if (ORG_f !== "PTY" && DST_f !== "PTY") {
      countOD_f += 1;
    }
    if (ORG_nf !== "PTY" && DST_nf !== "PTY") {
      countOD_nf += 1;
    }
    // No cases where flight goes between two STA.
  });
  console.log(`countOD_f: ${countOD_f}, countOD_nf: ${countOD_nf}`);
  u.print("createBookings::bookings", dBookings);

  // which bookings have in_f set to undefined?

  dBookings = sortBy(dBookings, "status_f");

  // dBookings.forEach((r) => {
  //   if (r.out_f > 0) {
  //     console.log(`createBookings::dBookings[idf][${r.id_f}], in_f: ${r.in_f}`);
  //   }
  // });

  // 2021-12-13: dBookings have no undefines. I added status, in, out (_f, _nf)
  return dBookings;
}
//---------------------------------------------------------------------------
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
function create_FSU_BOOK_TAILS(
  allPairs,
  flightTable,
  inboundsMap,
  outboundsMap
) {
  const dFSU = [];
  const dTails = [];

  const allPairsMap_f = u.createMapping(allPairs, "id_f");
  const allPairsMap_nf = u.createMapping(allPairs, "id_nf");

  flightTable = sortBy(flightTable, "status");
  u.print("resetDelays::flightTable", flightTable);

  // const dFSU_copy = [...dFSU]; // empty array
  //  flightTableRow: in/off/on/out are all 0?  (IS THAT TRUE?) WHY?
  flightTable.forEach((r) => {
    // rotation based on the departing flight (_nf) in the incoming-outgoing flight pair.
    const pairRow = allPairsMap_nf[r.id];
    let plannedRotation = 10000;
    if (pairRow !== undefined) {
      plannedRotation = pairRow.plannedRotation;
    }

    dFSU.push({
      id: r.id,
      arrDelay: r.arrDelay,
      depDelay: r.depDelay,
      in: r.in,
      out: r.out,
      SCH_ARR_DTMZ: r.sch_arr * 1000, // ns
      SCH_DEP_DTMZ: r.sch_dep * 1000, // ns
      ROTATION_PLANNED_TM: plannedRotation, // min (get this from all_pairs array)
      ARR_DELAY_MINUTES: r.arrDelay, //arr_delay_minutes,
      TAIL: r.tail,
      status: r.status, // not in original dFSU
    });
  });

  console.log("dfSU, dTail, dBookings");
  // u.print("dFSU", dFSU);

  allPairs.forEach((r) => {
    dTails.push({
      id_f: r.id_f,
      id_nf: r.id_nf,
    });
  });

  const flightTableMap = u.createMapping(flightTable, "id");
  // u.print("flightTableMap", flightTableMap);

  // flightTable.forEach((r) => console.log(`r.id: ${r.id}`);

  // inboundsMap and outboundsMap are based on synthetic data

  const dBookings = createBookings(
    inboundsMap,
    outboundsMap,
    allPairs,
    flightTableMap
  );

  // checkBookingsForConsistency(dBookings, dTails);

  // u.print("dTails", dTails);
  // u.print("before add tails: dBookings", dBookings);

  // dTail are the rotations outside PTY
  // No need to add dTail in dBookings. The tails are already included
  return { dBookings, dFSU, dTails };
}
//------------------------------------------------------------------------
