import * as io from "../Composition/IO_works.js";
import * as l from "../Composition/loadTableClass.js";
import * as f from "../Composition/FlightsInAir.js";
import * as u from "../Composition/utils.js";
import { tail } from "lodash";

export function analyzeData3(fsu, bookings, tails) {
  //

  //u.print("bookings", bookings);
  //u.print("tails", tails);
  //u.print("fsu", fsu);
  //u.print("fsu.value", fsu.value);
  //u.print("tails.value", tails.value);
  //u.print("bookings.value", bookings.value);

  const fsu_m = {};

  fsu.value.forEach((b) => {
    fsu_m[b.id] = b;
  });

  // There might be issues if the tails and bookings file are inconsistent
  // and have a different date or date range. This can happen during debugging
  tails.value.forEach((t) => {
    if (t.b_f) {
      t.b_f = fsu_m[t.id_f];
    }
    if (t.b_nf) {
      t.b_nf = fsu_m[t.id_nf];
    }
  });

  // Count number of undefined
  let undef_f = 0;
  let undef_nf = 0;

  tails.value.forEach((t) => {
    if (t.b_f === undefined) {
      undef_f++;
    } else if (t.b_nf === undefined) {
      undef_nf++;
    }
  });

  //u.print("undef_f", undef_f); // Zero values
  //u.print("undef_nf", undef_nf); // Zero values
  //u.print("extended tails", tails.value);

  // Compute rotations
  const nano2min = 1 / 1e9 / 60;

  tails.value.forEach((t) => {
    if (t.b_nf && t.b_f) {
      t.rot_avail = (t.b_nf.SCH_DEP_DTMZ - t.b_f.IN_DTMZ) * nano2min;
    } else {
      t.rot_avail = 100000;
    }
  });
  //u.print("tails with rotation", tails);
  return tails;
}
