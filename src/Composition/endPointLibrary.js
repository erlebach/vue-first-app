/* eslint-disable no-constant-condition */
import * as r from "../Composition/Tableref.js";
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

  // The easiest way to proceed would be to construct dTails, dBookings, ... to make rigidModel work.
  // Later on I can simplify.

  const id = initialID;
  dTails.value.forEach((tail) => {
    const id_f = tail.id_f;
    const id_nf = tail.id_nf;
    if (id_f.slice(13, 16) !== "PTY" && id_nf.slice(10, 13) !== "PTY") {
      dBookings.value.push({ id_f, id_nf, tail });
    }
  });

  // Propagation is recursive. An error might lead to infinite calls, so stack overflow
  const count = [0];
  const { edges } = propagation_new(
    flightTable, // dFSU
    inboundsMap,
    outboundsMap,
    ptyPairs,
    allPairs, // dTails
    stationPairs,
    id
  );

  // Value returned is not a ref (at this time)
  // These feeders should be checked against the Graph and table displays

  // computeFeeders might not be required
  let { bookings_in, bookings_out, feeders } = computeFeeders(
    dFSU.value,
    dBookings.value
  );

  const initialArrDelay = 60; // in min

  // Analyze the impact of an arrival delay (using historical data)
  const delayObj = rigidModel(
    dFSU.value,
    dBookings.value,
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
