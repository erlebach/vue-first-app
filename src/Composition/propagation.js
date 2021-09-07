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
export function propagation(
  fsu,
  tails,
  tailsSta,
  bookings,
  count,
  id, // root we wish to study (impact on network delays)
  stop = false,
  edges = [] // Edges of the graph with id as root
) {
  console.log(`==> Enter propagation, count= ${count}`);
  const max_count = 50;
  if (count[0] > max_count) {
    count[0] += 1;
    console.log("Force exit of propagation after 15 calls");
    stop = true; // no effect
    return {};
  }

  count[0] += 1; // for debugging
  u.print("entered propagation, edges: ", edges);

  // Find all the outbounds
  //   console.log("Find all the outbounds");

  // propagation is called multiple times because I am adding information to bookings datastrucdure
  // Each time a reactive variable changes, watch_effect appears to be called without completing.

  const outbounds = [];
  bookings.forEach((b) => {
    if (b.id_f === id) {
      outbounds.push(b);
      edges.push({ src: b.id_f, dst: b.id_nf });
    }
  });

  const inboundTails = [];
  outbounds.forEach((o) => {
    const id_nf = o.id_nf;
    const tail = tailsSta[id_nf];
    if (tail) {
      edges.push({ src: o.id_nf, dst: tailsSta[id_nf].id_nf });
    }
    inboundTails.push(tail);
  });

  // Does not work. More precisely, the recursive function exits after the first stop === true
  // That is not what we want.
  if (stop === true) {
    u.print("edges: ", edges);
    return { edges }; // Not a tail optimization
  }

  // repeat for all inbound tails
  // Cannot use continue with forEach
  for (let i = 0; i < inboundTails.length; i++) {
    if (inboundTails[i] !== undefined) {
      const id_nf = inboundTails[i].id_nf;
      //const stop = true; // do not recurse further (Infinite if I let it go. Not possible.)
      const obj = propagation(
        fsu,
        tails,
        tailsSta,
        bookings,
        count,
        id_nf,
        stop,
        edges
      );
      edges = obj.edges; // There must be a better to combine these two lines
    }
  }

  u.print("exit propagation, edges:", edges);
  // u.print("---- propagation", tailsSta);

  return { edges };
}
