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
  // Export function computePropagationDelays(dFSU, dTails, dBookings, initialID) {
  // include tails in bookings

  console.log(`computePropagationDelays, initialID: ${initialID}`);

  const dFSU = [];
  const dTails = [];
  const dBookings = [];

  flightTable.forEach((r) => {
    dFSU.push({
      id: r.id,
      SCH_ARR_DTMZ: 0, // ns
      SCH_DEP_DTMZ: 0, // ns
      ROTATION_PLANNED: 0, // min
    });
  });

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

  for (let id_f in outboundsMap) {
    // console.log(`id_f: ${id_f}`);
    outboundsMap[id_f].forEach((id_nf) => {
      // console.log(`id_nf: ${id_nf}`);
      const r = flightTableMap[id_nf];
      // u.print("outbounds row", r);
      dBookings.push({
        id_f: r.id,
        id_nf: r.id,
        tail_f: r.tail,
        tail_nf: r.tail,
        SCH_ARR_DTMZ: 0, // ns
        SCH_DEP_DTMZ: 0, // ns
      });
    });
  }

  u.print("dFSU", dFSU);
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
  const count = [0];
  const { edges } = propagation_new(dFSU, dTails, dBookings);

  // Value returned is not a ref (at this time)
  // These feeders should be checked against the Graph and table displays

  // computeFeeders might not be required
  let { bookings_in, bookings_out, feeders } = computeFeeders(dFSU, dBookings);

  const initialArrDelay = 60; // in min

  // Analyze the impact of an arrival delay (using historical data)
  const delayObj = rigidModel(
    dFSU,
    dBookings,
    bookings_in,
    bookings_out,
    edges,
    initialArrDelay, // applied to id
    id
  );
  r.setTable(delayObj); // nodes, edges
  const delayNodes = delayObj.nodes;
  // const level2ids = delayNodes.level2ids;
  const id2level = delayObj.id2level;
  console.log("delayNodes");
  console.log(delayNodes);

  const table = [];
  delayNodes.forEach((d) => {
    table.push({
      id: d.id,
      depDelay: d.depDelayP,
      arrDelay: d.arrDelayP,
      tail: d.TAIL,
    });
  });

  console.log("id2level");
  console.log(id2level);

  table.forEach((row) => {
    row.level = id2level[row.id];
  });
  console.log(`table length: ${table.length}`);
  console.log(table);
  return table;
}

//-----------------------------------------------------------------------
