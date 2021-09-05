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
  bookings,
  id, // root we wish to study (impact on network delays)
  stop = false,
  edges = [] // Edges of the graph with id as root
) {
  // Find all the outbounds
  //   console.log("Find all the outbounds");
  const outbounds = [];
  bookings.forEach((b) => {
    if (b.id_f === id) {
      outbounds.push(b);
      edges.push({ src: b.id_f, dst: b.id_nf });
    }
  });

  const tailsSta = u.createMapping(tails, "id_f");

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
    return { edges, tailsSta }; // Not a tail optimization
  }

  // repeat for all inbound tails
  // Cannot use continue with forEach
  for (let i = 0; i < inboundTails.length; i++) {
    if (inboundTails[i] !== undefined) {
      const id_nf = inboundTails[i].id_nf;
      //const stop = true; // do not recurse further
      const obj = propagation(fsu, tails, bookings, id_nf, stop, edges);
      edges = obj.edges; // There must be a better to combine these two lines
    }
  }

  return { edges, tailsSta };
}
