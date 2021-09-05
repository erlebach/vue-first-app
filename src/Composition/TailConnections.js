import * as u from "./utils.js";

/**
 *
 */
export function tailConnections(nodes) {
  const ns2ms = 1e-6;
  const hr2ms = 3600 * 1000;
  const min2ms = 60 * 1000;

  const tails = [];

  u.print("tailConnections.js, nodes", nodes);

  nodes.forEach((n) => {
    // ETA and ETD are not defined
    //const n = node.getModel(); // only use model if working on a graph

    // In reality, the delay is computed from ETA and ETD, not the other way
    // around

    const obj = {
      id_f: n.id_f,
      id_nf: n.id_nf,
      od_f: n.od_f,
      od_nf: n.od_nf,
      tail_f: n.tail_f,
      tail_nf: n.tail_nf,
      dep_f: n.dep_f,
      dep_nf: n.dep_nf,
      arr_f: n.arr_f,
      arr_nf: n.arr_nf,
      rot_avail: n.rot_avail,
    };
    tails.push(obj);
  });

  const keptFlights = [];

  tails.forEach((n) => {
    keptFlights.push(n);
  });

  return { keptFlights };
}
//----------------------------------------------
