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
  initialArrDelay
) {
  // Arguments
  // inboundsMap[id_nf]: inbounds associated with id_f (the pair have different tails)
  // outboundsMap[id_nf]: outbounds associated with id_nf (the pair have different tails)

  // Export function computePropagationDelays(dFSU, dTails, dBookings, initialID)
  // include tails in bookings

  // sort according to departure time
  flightTable = flightTable.sort((a, b) => a.sch_dep - b.sch_dep);

  console.log("=============================================================");
  console.log(
    `endPointLibrary::computePropagationDelays, initialID: ${initialID}`
  );
  u.print("propagationDelays::allPairs", allPairs);
  u.print("propagationDelays::inboundsMap", inboundsMap);
  u.print("propagationDelays::outboundsMap", outboundsMap);
  u.print("propagationDelays::flightTable", flightTable);

  const dFSU = [];
  const dTails = [];

  const allPairsMap_f = u.createMapping(allPairs, "id_f");
  const allPairsMap_nf = u.createMapping(allPairs, "id_nf");

  // const dFSU_copy = [...dFSU]; // empty array
  //  flightTableRow: in/off/on/out are all 0?  (IS THAT TRUE?) WHY?
  flightTable.forEach((r) => {
    //u.print("flightTable row: ", r);
    //
    let arr_delay_minutes = -1;
    if (r.in > 0) {
      arr_delay_minutes = (r.in - r.sch_arr) / 60000; // ms to min
    } else if (r.eta > 0) {
      arr_delay_minutes = (r.eta - r.sch_arr) / 60000;
    } else {
      arr_delay_minutes = 0;
    }
    // console.log(`arr_delay_minutes: ${arr_delay_minutes}`);
    //u.print("allPairsMap_f[r.id]", allPairsMap_f[r.id]);

    // rotation based on the departing flight in the incoming-outgoing flight pair.
    const pairRow = allPairsMap_nf[r.id];
    let plannedRotation = 10000;
    if (pairRow !== undefined) {
      // console.log(pairRow);
      plannedRotation = pairRow.plannedRotation;
      // console.log(`allPairsMap_f, rotation_planned: ${plannedRotation}`);
    }

    // Initial values for departure and arrival delays
    // If plane has not departed, set delays to zero
    // If plane is in the air, set depDelay based on (OUT-sch_dep), arrDelay to ETA - sch_dep (or 0 if no ETA)
    // If plane has landed, set depDelay to (OUT-sch_dep), arrDelay to (IN-sch_arr)
    let depDelay = 0;
    let arrDelay = 0;
    if (r.out !== 0) {
      depDelay = (r.out - r.sch_dep) / 60000; // min
    } else if (r.etd !== 0) {
      depDelay = (r.etd - r.sch_dep) / 60000; // min
    } else {
      depDelay = 0;
    }
    if (r.in !== 0) {
      arrDelay = (r.in - r.sch_arr) / 60000; // min
    } else if (r.eta !== 0) {
      arrDelay = (r.eta - r.sch_arr) / 60000; // min
    } else {
      arrDelay = 0;
    }

    dFSU.push({
      id: r.id,
      arrDelay: arrDelay,
      depDelay: depDelay,
      SCH_ARR_DTMZ: r.sch_arr * 1000, // ns
      SCH_DEP_DTMZ: r.sch_dep * 1000, // ns
      ROTATION_PLANNED_TM: plannedRotation, // min (get this from all_pairs array)
      ARR_DELAY_MINUTES: arr_delay_minutes,
      TAIL: r.tail,
      status: r.status, // not in original dFSU
    });
  });

  const dFSU_copy = [...dFSU];
  u.print("dFSU_copy", dFSU_copy); // contains values of FSU defined later. HOW IS THAT POSSIBLE (inside chrome dev)

  // const dFSU_copy = [];
  // dFSU.forEach((r) => {
  //   u.print("dFSU row", r);
  //   dFSU_copy.push({
  //     id: r.id,
  //     SCH_ARR_DTMZ: r.SCH_ARR_DTMZ,
  //     SCH_DEP_DTMZ: r.SCH_DEP_DTMZ,
  //     ROTATION_PLANNED: r.ROTATION_PLANNED,
  //     ARR_DELAY_MINUTES: r.ARR_DELAY_MINUTES,
  //     TAIL: r.TAIL,
  //   });
  // });
  // u.print(`dFSU_copy, gordon: ${dFSU_copy.gordon}`);
  u.printAttributes("dFSU_copy.ARR_DELAY_MINUTES", dFSU_copy, [
    "ARR_DELAY_MINUTES",
  ]);
  console.log("dfSU, dTail, dBookings");
  u.print("dFSU", dFSU);

  allPairs.forEach((r) => {
    dTails.push({
      id_f: r.id_f,
      id_nf: r.id_nf,
    });
  });

  u.print("flightTable", flightTable);
  const flightTableMap = u.createMapping(flightTable, "id");
  u.print("flightTableMap", flightTableMap);

  // flightTable.forEach((r) => console.log(`r.id: ${r.id}`);

  // inboundsMap and outboundsMap are based on synthetic data

  const dBookings = createBookings(
    inboundsMap,
    outboundsMap,
    allPairs,
    flightTableMap
  );

  u.print("dTails", dTails);
  u.print("before add tails: dBookings", dBookings);

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
  u.print("idPairs: ", idPairs);

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

  const id = initialID;

  // dTails.forEach((tail) => {
  //   const id_f = tail.id_f;
  //   const id_nf = tail.id_nf;
  //   if (id_f.slice(13, 16) !== "PTY" && id_nf.slice(10, 13) !== "PTY") {
  //     dBookings.push({ id_f, id_nf, tail });
  //   }
  // });

  // Propagation is recursive. An error might lead to infinite calls, so stack overflow
  // dFSU and dTail not found
  // Construct a list of incoming/outgoing pairs
  // dBookings includes all the flights (rotations at PTY and stations)
  const count = [0];

  // Value returned is not a ref (at this time)
  // These feeders should be checked against the Graph and table displays

  // computeFeeders might not be required
  // feeders is not required (same as bookings_in)
  let { bookings_in, bookings_out } = computeFeeders(dBookings);

  console.log(`==> id: ${id}`);

  // Analyze the impact of an arrival delay (using historical data)
  const delayObj = rigidModel(
    dFSU,
    dBookings,
    bookings_in,
    bookings_out,
    // edges, // constructed from dBookings. Create edtes in rigidModel?
    initialArrDelay, // applied to id
    id
  );

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
  u.print("delayObj", delayObj);
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
      level: id2level[d.id],
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
      dBookings.push({
        id_f: r_f.id,
        id_nf: r_nf.id,
        tail_f: r_f.tail,
        tail_nf: r_nf.tail,
        SCH_ARR_DTMZ_f: r_f.sch_arr * 1000, // ns
        SCH_ARR_DTMZ_nf: r_nf.sch_arr * 1000, // ns
        SCH_DEP_DTMZ_f: r_f.sch_dep * 1000, // ns
        SCH_DEP_DTMZ_nf: r_nf.sch_dep * 1000, // ns
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
        id_f: r_f.id,
        id_nf: r_nf.id,
        tail_f: r_f.tail,
        tail_nf: r_nf.tail,
        SCH_ARR_DTMZ_f: r_f.sch_arr * 1000, // ns
        SCH_ARR_DTMZ_nf: r_nf.sch_arr * 1000, // ns
        SCH_DEP_DTMZ_f: r_f.sch_dep * 1000, // ns
        SCH_DEP_DTMZ_nf: r_nf.sch_dep * 1000, // ns
      });
    });
  }

  u.checkEdgesDirection(dBookings, "check order in dBookings");
  allPairs.forEach((r) => {
    //u.print("allPairs row", r);
    dBookings.push({
      id_f: r.id_f,
      id_nf: r.id_nf,
      tail_f: r.tail,
      tail_nf: r.tail,
      tail: r.tail,
      SCH_DEP_DTMZ_f: r.sch_dep_f * 1000, // ns
      SCH_ARR_DTMZ_f: r.sch_arr_f * 1000, // ns
      SCH_DEP_DTMZ_nf: r.sch_dep_nf * 1000, // ns
      SCH_ARR_DTMZ_nf: r.sch_arr_nf * 1000, // ns
    });
  });
  u.print("exit createBookings, dBookings: ", dBookings);

  // Remove duplicates (id_f, id_nf) pairs in dBookings
  const bookingsS = new Set();
  dBookings.forEach((r) => {
    bookingsS.add(r);
  });
  dBookings = [...bookingsS];

  // Check that there are no duplicate pairs
  // There were none, but now we are sure.
  const dbidf = sortBy(dBookings, "id_f");
  const dbidnf = sortBy(dBookings, "id_nf");
  // There are multiple repeats
  u.print("dBookings sorted by id_f", dbidf);
  u.print("dBookings sorted by id_nf", dbidnf);
  u.print("exit createBookings, unique dBookings: ", dBookings);

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
  return dBookings;
}
//---------------------------------------------------------------------------
