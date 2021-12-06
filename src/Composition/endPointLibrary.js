/* eslint-disable no-constant-condition */
import * as r from "../Composition/Tableref.js";
import * as u from "../Composition/utils.js";
// might not be needed
import { computeFeeders } from "../Composition/computeFeeders.js";
import { propagation_new } from "../Composition/endpointPropagationNew.js";
import { rigidModel } from "../Composition/endpointRigidModel.js";

//---------------------------------------------------------------------
export function computePropagationDelays(
  flightTable,
  inboundsMap,
  outboundsMap,
  ptyPairs,
  stationPairs,
  allPairs,
  initialID
) {
  // Export function computePropagationDelays(dFSU, dTails, dBookings, initialID)
  // include tails in bookings

  // sort according to departure time
  flightTable = flightTable.sort((a, b) => a.sch_dep - b.sch_dep);

  console.log("=============================================================");
  console.log(`computePropagationDelays, initialID: ${initialID}`);
  u.print("allPairs", allPairs);
  u.print("inboundsMap", inboundsMap);
  u.print("outboundsMap", outboundsMap);
  u.print("flightTable", flightTable);

  const dFSU = [];
  const dTails = [];
  const dBookings = [];

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
  u.print(`dFSU_copy, gordon: ${dFSU_copy.gordon}`);
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

  for (let id_f in inboundsMap) {
    // console.log(`id_f: ${id_f}`);
    const r_f = flightTableMap[id_f];
    inboundsMap[id_f].forEach((id_nf) => {
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

  u.print("dTails", dTails);
  u.print("dBookings", dBookings);

  // The easiest way to proceed would be to construct dTails, dBookings, ... to make rigidModel work.
  // Later on I can simplify.

  const id = initialID;
  dTails.forEach((tail) => {
    const id_f = tail.id_f;
    const id_nf = tail.id_nf;
    if (id_f.slice(13, 16) !== "PTY" && id_nf.slice(10, 13) !== "PTY") {
      dBookings.push({ id_f, id_nf, tail });
    }
  });

  // Propagation is recursive. An error might lead to infinite calls, so stack overflow
  // dFSU and dTail not found
  // Construct a list of incoming/outgoing pairs
  // dBookings includes all the flights (rotations at PTY and stations)
  const count = [0];
  const { edges } = propagation_new(dFSU, dTails, dBookings);

  u.print("==> edges", edges);

  // Value returned is not a ref (at this time)
  // These feeders should be checked against the Graph and table displays

  // computeFeeders might not be required
  // feeders is not required (same as bookings_in)
  let { bookings_in, bookings_out, feeders } = computeFeeders(dBookings);

  const initialArrDelay = 60; // in min

  console.log(`==> id: ${id}`);

  // Analyze the impact of an arrival delay (using historical data)
  const delayObj = rigidModel(
    dFSU,
    dBookings,
    bookings_in,
    bookings_out,
    edges, // constructed from dBookings
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
