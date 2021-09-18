<template>
  <div v-if="isPending">loading...</div>
  <div v-else-if="data">{{ data }}</div>
  <div v-else-if="error">Something is wrong</div>
</template>

<script>
import * as u from "../../Composition/utils.js";
import io from "../../Composition/IO_works";
import { createApp, ref, watchEffect } from "vue";
import { useFetch } from "../../Composition/IO_works.js";

function get3files(url1, url2, url3) {
  // file1, ..., file3, are refs
  const { data: dBookings, error: e1, isPending: pend1 } = useFetch(() => url1);
  const { data: dTails, error: e2, isPending: pend2 } = useFetch(() => url2);
  const { data: dFSU, error: e3, isPending: pend3 } = useFetch(() => url3);
  watchEffect(() => {
    if (dBookings.value && dTails.value && dFSU.value) {
      analyzeData3(dBookings.value, dTails.value, dFSU.value);
    }
  });
  return { dBookings, dTails, e1, e2, pend1, pend2 };
}

function get2files(url1, url2) {
  const { data: dBookings, error: e1, isPending: pend1 } = useFetch(() => url1);
  const { data: dTails, error: e2, isPending: pend2 } = useFetch(() => url2);

  watchEffect(() => {
    if (dBookings.value && dTails.value) {
      analyzeData(dBookings.value, dTails.value);
    }
  });
  return { dBookings, dTails, e1, e2, pend1, pend2 };
}

function analyzeData3(bookings, tails, fsu) {
  // fsu are nodes from the FSU table, so no _f/_nf pairs
  //u.print("bookings", bookings);
  //u.print("tails", tails);
  //u.print("fsu", fsu);
  return null;
}

function analyzeData(bookings, tails) {
  const book0 = bookings[0];
  const tails0 = tails[0];
  u.print("tails0", tails0);
  u.print("bookings0", book0);
  u.print("tails", tails);
  u.print("tails length: ", Array.from(tails).length);
  u.print("bookings", bookings);
  const tails_f = {};
  const tails_nf = {};
  const books_f = {};
  const books_nf = {};

  bookings.forEach((n) => {
    books_f[n.id_f] = n;
    books_nf[n.id_nf] = n;
  });

  // Divide the tails into two groups. Rotation at PTY and rotation at stations
  // Some passengers remain on the same tail at PTY, and sometimes at SJO. But otherwise,
  // they change planes when taking a connecting flight.
  const tails_misc = [];
  const tails_pty = {};
  const tails_sta = {};
  tails.forEach((t) => {
    const obj = {
      tail: t,
      booksf: books_f[t.id_f],
      booksnf: books_nf[t.id_nf], // should be null
    };
    if (t.od_f.slice(0, 3) !== "PTY") {
      // ==> t.od_nf.slice(3,6) !== "PTY" (rotation is at PTY)
      tails_pty[t.id_f] = obj;
      tails_pty[t.id_nf] = obj;
    } else {
      // ==> t.od_nf.slice(3,6) === "PTY" (rotation is at station)
      tails_sta[t.id_f] = obj;
      tails_sta[t.id_nf] = obj;
    }
  });
  // u.print("tails_misc: ", tails_misc);
  u.print("tails: ", tails);
  u.print("tails_pty: ", tails_pty);
  u.print("tails_sta: ", tails_sta);
  u.print("tails_pty length: ", Object.keys(tails_pty).length);
  u.print("tails_sta length: ", Object.keys(tails_sta).length);

  // Stations (these do not appear in the FSU database. Only in the tails)
  // PTY:  e.g. PTYMIA ==> MIAPTY  (od_f.slice(0,3) === PTY) && (od_nf.slice(3,6) === PTY)
  tails.forEach((t) => {
    if (t.od_f.slice[(0, 3)] === "PTY") {
      tails_sta[t.id_f] = t;
    }
    if (t.od_nf.slice[(3, 6)] === "PTY") {
      tails_sta[t.id_nf] = t;
    }
  });

  // For each tail, identify the corresonding two nodes in bookings
  console.log("before For each tail STA");
  let nb_b_f = 0;
  let nb_b_nf = 0;
  for (const t in tails_sta) {
    // tails_sta has size ZERO. WHY? Because a customer would never be on such a flight
    const id_f = t.id_f;
    const id_nf = t.id_nf;
    const b_f = bookings[id_f];
    const b_nf = bookings[id_nf];
    if (b_f === undefined) {
      nb_b_f++;
    }
    if (b_nf === undefined) {
      nb_b_nf++;
    }
  }

  u.print("tails length: ", Array.from(tails).length); // Size 285
  u.print("tails_sta length: ", Array.from(tails_sta).length); //
  u.print("tails_pty length: ", Array.from(tails_pty).length); // 0
  // What are the other tails then?

  // NEED TO EXPLAIN THIS RESULT
  u.print("tails_sta size: ", Object.keys(tails_sta).length); // size 0
  u.print("tails_pty size: ", Object.keys(tails_pty).length); // size 267

  console.log(`nb_f_f= ${nb_b_f}`); // zero undefined
  console.log(`nb_f_nf= ${nb_b_nf}`); // zero undefined
  console.log("after For each tail");

  console.log("before For each tail PTY");
  nb_b_f = 0;
  nb_b_nf = 0;
  for (const t in tails_pty) {
    const id_f = t.id_f;
    const id_nf = t.id_nf;
    const b_f = bookings[id_f];
    const b_nf = bookings[id_nf];
    if (b_f === undefined) {
      nb_b_f++;
    }
    if (b_nf === undefined) {
      nb_b_nf++;
    }
  }
  console.log(`nb_f_f= ${nb_b_f}`); // 167 undefined
  console.log(`nb_f_nf= ${nb_b_nf}`); // 167 undefined
  console.log("after For each tail");

  // Dictionary of id_f ==> tail record
  // Dictionary of id_nf ==> tail record
  tails.forEach((n) => {
    tails_f[n.id_f] = n;
    tails_nf[n.id_nf] = n;
  });

  for (const id in tails_f) {
    const n = books_f[id];
    if (n == undefined) {
      console.log("id_f in tails not found in books_f");
    }
  }
  for (const id in tails_f) {
    const n = books_nf[id];
    if (n == undefined) {
      console.log("id_f in tails not found in books_nf");
    }
  }
  for (const id in tails_nf) {
    const n = books_f[id];
    if (n == undefined) {
      console.log("id_nf in tails not found in books_f");
    }
  }
  for (const id in tails_nf) {
    const n = books_nf[id];
    if (n == undefined) {
      console.log("id_nf in tails not found in books_nf");
    }
  }

  // Objective: calculate the rotations of the tails at the stations
  // Add _f and _nf (nodes from Bookings)
}

export default {
  props: { id: Number },
  setup(props) {
    const { d1, d2, e1, e2, pend1, pend2 } = get2files(
      "./data/bookings_oneday.json",
      "./data/tail_pairs.json"
    );
    const data = d1; // ref
    const error = e1; // ref
    const isPending = pend1; // ref

    return {
      data,
      error,
      isPending,
    };
  },
};
</script>
