/* eslint-disable no-unreachable */
import * as u from "./utils.js";

function findIndex(fsu, idStart) {
  fsu.forEach((e) => {
    if (e.id.startsWith(idStart)) {
      u.print("FOUND ID", e.id);
      return e.id;
    }
    return null;
  });
}

// Propagate initial id forward: X.PTY-PTY.Y-Y.PTY
/* tailList] = {
    id_f: "t1"
    if_nf: {id}

*/
export function propagation_new(
  fsu,
  tails,
  bookings,
  count,
  id // root we wish to study (impact on network delays)
) {
  const edges = [];

  bookings.forEach((b) => {
    edges.push({ src: b.id_f, dst: b.id_nf, b: b });
  });

  return { edges };
}
