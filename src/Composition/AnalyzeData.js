import * as io from "../Composition/IO_works.js";
import * as l from "../Composition/loadTableClass.js";
import * as f from "../Composition/FlightsInAir.js";
import * as u from "../Composition/utils.js";

export function analyzeData(bookings, tails) {
  //u.print("bookings", bookings);
  //u.print("tails", tails);

  const book_f = {};
  const book_nf = {};

  // Create id_f and id_nf keys for bookigns (a map/dictionary)
  bookings.forEach((b) => {
    book_f[b.id_f] = b;
    book_nf[b.id_nf] = b;
  });

  // Separate tail at the PTY Hub at external Stations
  const tailsHubWm = new WeakMap();
  const tailsStaWm = new WeakMap();
  const tailsHub = [];
  const tailsSta = [];

  tails.forEach((t) => {
    if (t.od_f.slice(0, 3) !== "PTY") {
      tailsHub[t.id_f] = t;
      tailsHub[t.id_nf] = t;
      tailsHubWm.set({ id_f: t.id_f, id_nf: t.id_nf }, t);
    } else {
      tailsSta[t.id_f] = t;
      tailsSta[t.id_nf] = t;
      tailsStaWm.set({ id_f: t.id_f, id_nf: t.id_nf }, t);
    }
  });
  u.print("nb tailsSta: ", Object.keys(tailsSta).length);
  u.print("nb tailsHub: ", Object.keys(tailsHub).length);
  u.print("tailsSat: ", tailsSta);
  u.print("nb tails: ", tails.length);
  u.print("tailsStaWm", tailsStaWm);
  u.print("tailsHubWm", tailsHubWm);

  // for each tail record, add book_f and book_nf, which will provide additional information
}
