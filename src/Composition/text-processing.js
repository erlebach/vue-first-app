const API_URL = "http://35.223.143.175/api/dmhit";

import { saveAs } from "file-saver";
import { post } from "axios";
import moment from "moment";
import * as u from "./utils.js";
import * as dt from "./dates";
import { date } from "check-types";
import lodash from "lodash";
import { ArgumentOutOfRangeError } from "rxjs";
import { watchEffect, computed, ref } from "vue";

const PWD = "M$h`52NQV4_%N}mvc$w)-z*EuZ`_^bf3";

// arrays that will be retrieved at some point by an external program
// Not clear how to retrieve the data periodically
let flightTable = [];
let ptyPairs = [];
let stationPairs = [];

const status = ref(null);

const getStatus = computed(() => status.value);

function setStatus(post) {
  console.log(
    `****** enter setStatus, post: ${post},  status: ${status.value}`
  );
  if (post === true) {
    status.value += 1;
  } else if (post === false) {
    status.value = 0;
  }
  // value changed
  console.log(`exit setStatus, post: ${post}, status: ${status.value}`);
}

export { setStatus, getStatus };

function datetimeZ2ms(datetime) {
  let timestamp;
  if (datetime !== null && datetime !== undefined) {
    const dtz = datetime.slice(0, 10);
    const tmz = datetime.slice(11, 16);
    timestamp = dt.datetimeZToTimestamp(dtz, tmz);
  } else {
    timestamp = 0;
  }
  return timestamp;
}

//  const timestamp2 = datetimeZToTimestamp("2019-10-01", "16:30");

function getRow(e) {
  const ms2min = 1 / (1000 * 60);
  let next_tmz;
  let next_dtz;
  // console.log(`getRow: SCH_DEP_DTMZ: ${e.SCH_DEP_DTMZ}`);
  if (e.SCH_DEP_DTMZ !== null) {
    next_tmz = e.SCH_DEP_DTMZ.slice(11, 16);
  } else {
    next_tmz = "00:00";
  }
  const id_f = e.SCH_DEP_DTZ + e.ORIG_CD + e.DEST_CD + next_tmz + e.FLT_NUM;
  if (e.NEXT_STD !== null) {
    next_dtz = e.NEXT_STD.slice(0, 10);
    next_tmz = e.NEXT_STD.slice(11, 16);
  } else {
    next_dtz = "2000-01-01";
    next_tmz = "00:00";
  }
  const id_nf =
    next_dtz + e.NEXT_ORIG_CD + e.NEXT_DEST_CD + next_tmz + e.NEXT_FLT_NUM;

  // if (e.ORIG_CD.length > 3) {
  //   //console.log(`ORIG_CD : ${e.ORIG_CD}`);
  //   return undefined;
  // }
  // if (e.NEXT_ORIG_CD > 3) {
  //   // console.log(`NEXT_ORIG_CD : ${e.NEXT_ORIG_CD}`);
  //   return undefined;
  // }
  // if (e.DEST_CD.length > 3) {
  //   // console.log(`DEST_CD : ${e.DEST_CD}`);
  //   return undefined;
  // }
  // if (e.NEXT_DEST_CD > 3) {
  //   // console.log(`NEXT_DEST_CD : ${e.NEXT_DEST_CD}`);
  //   return undefined;
  // }

  // ORIG and DEST are not given when rotation times are very long. So I can probably remove these flights.

  const row = {
    id_f: id_f,
    id_nf: id_nf,
    orig_f: e.ORIG_CD,
    orig_nf: e.NEXT_ORIG_CD,
    dest_f: e.DEST_CD,
    dest_nf: e.NEXT_DEST_CD,
    eta_f: e.ETA,
    eta_nf: e.ETA_N_FLT,
    etd_f: e.ETD,
    etd_nf: e.ETD_N_FLT,
    sch_dep_f: datetimeZ2ms(e.SCH_DEP_DTMZ),
    sch_arr_f: datetimeZ2ms(e.SCH_ARR_DTMZ),
    sch_dep_nf: datetimeZ2ms(e.NEXT_STD),
    sch_arr_nf: datetimeZ2ms(e.NEXT_STA),
    sch_dep_z_f: e.SCH_DEP_DTMZ,
    sch_arr_z_f: e.SCH_ARR_DTMZ,
    sch_dep_z_nf: e.NEXT_STD,
    sch_arr_z_nf: e.NEXT_STA,
    on_f: datetimeZ2ms(e.ON_P_FLT),
    on_nf: datetimeZ2ms(e.ON_N_FLT),
    off_f: datetimeZ2ms(e.OFF_P_FLT),
    off_nf: datetimeZ2ms(e.OFF_N_FLT),
    out_f: datetimeZ2ms(e.OUT_P_FLT),
    out_nf: datetimeZ2ms(e.OUT_N_FLT),
    in_f: datetimeZ2ms(e.IN_P_FLT),
    in_nf: datetimeZ2ms(e.IN_N_FLT),
    flt_num_f: e.FLT_NUM,
    flt_num_nf: e.NEXT_FLT_NUM,
    tail: e.REG, // both flights have the same tail. (tail has always has 4 digits)
    // 0: inbound not departed
    // 1: inbound departed, not landed
    // 2: inbound landed, outbound not departed (at PTY)
    // 3: outbound departed
    // 4: outbound landed
    status: -1, // value not yet set
  };
  // if flight has not departed, rotation is estimated based on
  // scheduled times
  // Best estimate (est) rotation
  let in_time, out_time;
  if (row.out_nf === null) {
    out_time = row.sch_dep_nf;
  } else {
    out_time = row.out_nf;
  }
  if (row.in_f === null) {
    in_time = row.sch_arr_nf;
  } else {
    in_time = row.in_f;
  }
  row.est_rotation = (out_time - in_time) * ms2min;
  return row;
}

// data has pairs of flights (similar to feeder/outgoing) at PTY.
function inboundFlightsInAir(data) {
  const keptRows = [];
  data.forEach((e) => {
    // flight not cancelled
    if (e.CANCELLED === "0") {
      if (e.IN_P_FLT === null && e.OUT_P_FLT !== null) {
        const row = getRow(e);
        keptRows.push(row);
      }
    }
  });
  keptRows.forEach((row) => {
    row.status = 1;
    row.status_f = "AIR";
    row.status_nf = "NOT DEP"; // does not mean it is at PTY
  });
  // 0: inbound not departed
  // 1: inbound departed, not landed
  // 2: inbound landed, outbound not departed (at PTY)
  // 3: outbound departed
  // 4: outbound landed
  return keptRows;
}

function outboundFlightsInAir(data) {
  const keptRows = [];
  data.forEach((e) => {
    // flight not cancelled
    if (e.CANCELLED === "0") {
      if (e.IN_N_FLT === null && e.OUT_N_FLT !== null) {
        const row = getRow(e);
        keptRows.push(row);
      }
    }
  });
  keptRows.forEach((row) => {
    row.status = 3;
    row.status_f = "LANDED";
    row.status_nf = "AIR";
  });
  // 0: inbound not departed
  // 1: inbound departed, not landed
  // 2: inbound landed, outbound not departed (at PTY)
  // 3: outbound departed, not landed
  // 4: outbound landed
  return keptRows;
}

function inboundFlightsAtPTY(data) {
  const keptRows = [];
  data.forEach((e) => {
    // e.CANCELLED === 0: flight is not cancelled
    // console.log(`cancelled: ${e.CANCELLED}`);
    if (e.CANCELLED === "0") {
      // console.log(`At PTY, ${e.IN_P_FLT}, ${e.OUT_N_FLT}`);
      if (e.IN_P_FLT !== null && e.OUT_N_FLT === null) {
        const row = getRow(e);
        // u.print("e: ", e);
        // u.print("ROW: ", row);
        keptRows.push(row);
      }
    }
  });
  keptRows.forEach((row) => {
    row.status = 2;
    row.status_f = "LANDED";
    row.status_nf = "NOT DEP";
  });
  // 0: inbound not departed
  // 1: inbound departed, not landed
  // 2: inbound landed, outbound not departed (at PTY)
  // 3: outbound departed
  // 4: outbound landed
  return keptRows;
}

function inboundFlightsNotDeparted(data) {
  const keptRows = [];
  data.forEach((e) => {
    if (e.CANCELLED === "0") {
      // flight not cancelled
      if (e.OUT_P_FLT === null) {
        const row = getRow(e);
        keptRows.push(row);
      }
    }
  });
  keptRows.forEach((row) => {
    row.status = 0;
    row.status_f = "NOT DEP";
    row.status_nf = "NOT DEP";
  });
  // 0: inbound not departed
  // 1: inbound departed, not landed
  // 2: inbound landed, outbound not departed (at PTY)
  // 3: outbound departed
  // 4: outbound landed
  return keptRows;
}

function outboundFlightsLanded(data) {
  const keptRows = [];
  data.forEach((e) => {
    if (e.CANCELLED === "0") {
      // flight not cancelled
      if (e.IN_N_FLT !== null) {
        const row = getRow(e);
        keptRows.push(row);
      }
    }
  });
  keptRows.forEach((row) => {
    row.status = 4;
    row.status_f = "LANDED";
    row.status_nf = "LANDED";
  });
  // 0: inbound not departed
  // 1: inbound departed, not landed
  // 2: inbound landed, outbound not departed (at PTY)
  // 3: outbound departed
  // 4: outbound landed
  return keptRows;
}

// I removed asynch () . No progress. Still 400 Bad request
const GetTableData = () => {
  let data = post(
    "http://35.223.143.175/api/dmhit",
    {
      pwd: "M$h`52NQV4_%N}mvc$w)-z*EuZ`_^bf3",
      arr_DTL: "2021-11-15",
      days: 1,
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  )
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log(error);
      return undefined;
    });
  return data;
};

function saveData() {
  GetTableData().then((response) => {
    const data = response[0];
    // response[0] is a list of all flights registered to fly
    // only keep flights with CANCELLED === 0 (not cancelled)

    const inboundNotDeparted = inboundFlightsNotDeparted(data);
    const inboundInFlight = inboundFlightsInAir(data);
    const inboundAtPTY = inboundFlightsAtPTY(data);
    const outboundInFlight = outboundFlightsInAir(data);
    const outboundLanded = outboundFlightsLanded(data);
    // Only non-cancelled flights
    const allFlights = [
      // 135 flights
      ...inboundNotDeparted,
      ...inboundInFlight,
      ...inboundAtPTY,
      ...outboundInFlight,
      ...outboundLanded,
    ];
    console.log(`total nb flights: ${allFlights.length}`);
    //u.print("inboundNotDeparted", inboundNotDeparted);
    //u.print("inboundInFlight", inboundInFlight);
    //u.print("inboundAtPTY", inboundAtPTY);
    //u.print("outboundInFlight", outboundInFlight);
    //u.print("outboundLanded", outboundLanded);

    // allFlights contains pairs of flights at PTY
    u.print("saveData, before return, allFlights", allFlights);
    console.log(`nb flight pairs (some orig==dest): ${allFlights.length}`); // 144

    // remove pairs if dest != orig for either _f or _nf
    ptyPairs = [];
    allFlights.forEach((r) => {
      // console.log(`${r.orig_f}, ${r.dest_f}, ${r.orig_nf}, ${r.dest_nf}`);
      if (r.orig_f !== r.dest_f && r.orig_nf !== r.dest_nf) {
        // console.log("   keep");
        ptyPairs.push(r);
      }
    });
    // console.log(`newFlightsllength: ${newFlights.length}`);
    // Delete allFlights
    flightTable = computeFlightList(ptyPairs);
    const ids2flights = u.createMapping(flightTable, "id");

    u.print("flight list (singles): ", ids2flights);
    console.log(`nb flights: ${flightTable.length}`); // 240

    u.print("==> ptyPairs", ptyPairs);
    u.print("==> flightTable", flightTable);

    stationPairs = computeTails(ptyPairs, flightTable, ids2flights); // WORK ON THIS CODE
    const stationPairsMap = u.createMapping(stationPairs, "id_f");
    u.print("stationPairsMap", stationPairsMap);
    console.log(`==> stationPairs count: ${stationPairs.length}`);

    console.log(`==> ptyPairs (pairs): ${ptyPairs.length}`); // 144

    // set a completion ref
    setStatus(true);

    //return { flightTable, ptyPairs, stationPairs };
    // return flightTable, ids2flights, stationPairss, stationPairsMap
  });
}

const getEndPointFilesComputed = computed(() => {
  return { flightTable, ptyPairs, stationPairs };
});

export { getEndPointFilesComputed };

// export function getEndpointFiles() {
//   console.log(`====> inside getEndpointFiles, status: ${getStatus.value}`);
//   // Do not return anything from watchEffect. Use it to set refs when other
//   // refs change
//   watchEffect(() => {
//     console.log(`watchEffect: getStatus.value: ${getStatus.value}`);
//     if (getStatus.value) {
//       console.log("======> status changed, data is retrieved");
//       //return { flightTable, ptyPairs, stationPairs };
//       // console.log(flightTable);
//       // console.log(ptyPairs);
//       // console.log(stationPairs);
//       const obj = { a: flightTable, b: ptyPairs, c: stationPairs };
//       // u.print("inside getEndpointFiles, obj: ", obj);
//       // u.print("getEndPointComputed: ", getEndPointFilesComputed.value);
//       return getEndPointFilesComputed.value;
//       //return obj;
//       //return { a: flightTable, b: ptyPairs, c: stationPairs };
//     }
//     return "not found";
//   });
//   return "NOT FOUND";
// }

// 2021-11-15 : WORK ON THIS CODE
export function computeTails(ptyPairs, flightTable, id2flights) {
  // For each outbound flight, determine the connecting return flight (same tail)
  // order by tail
  // order by id_f
  // order by id_nf
  const fl = lodash.orderBy(flightTable, ["tail", "sch_dep"]);
  const tails = u.createMappingOneToMany(fl, "tail");
  u.print("fl: ", fl);
  u.print("computeTails, tails: ", tails);
  console.log(`computeTails1, tails.length: ${tails.length}`);
  const connections = [];
  let count = 0;
  for (const tail in tails) {
    const row = tails[tail];
    for (let i = 0; i < row.length - 1; i++) {
      const dest = row[i].dest;
      const orig = row[i + 1].orig;
      if (orig === dest && orig !== "PTY" && dest !== "ORIG") {
        connections.push({ id_f: row[i].id, id_nf: row[i + 1].id });
        count++;
      }
    }
  }
  u.print("computeTails, tails: ", tails);
  u.print("computeTails, connections: ", connections);
  u.print("computeTails, connections.length: ", connections.length);
  return connections; // id pairs
}

function computeFlightList(ptyPairs) {
  // Starting from flight pairs, create a table of single flights
  // From this, create dictionaries using id_f and id_nf as keys (provisional)
  let flights = [];
  ptyPairs.forEach((e) => {
    const row_f = {
      id: e.id_f,
      orig: e.orig_f,
      dest: e.dest_f,
      eta: e.eta_f,
      etd: e.etd_f,
      sch_dep: e.sch_dep_f,
      sch_arr: e.sch_arr_f,
      sch_dep_z: e.sch_dep_z_f,
      sch_arr_z: e.sch_arr_z_f,
      on: e.on_f,
      off: e.off_f,
      out: e.out_f,
      in: e.in_f,
      fltnum: e.flt_num_f,
      tail: e.tail,
      status: e.status_f,
      status0: e.status,
    };
    const row_nf = {
      id: e.id_nf,
      orig: e.orig_nf,
      dest: e.dest_nf,
      eta: e.eta_nf,
      etd: e.etd_nf,
      sch_dep: e.sch_dep_nf,
      sch_arr: e.sch_arr_nf,
      sch_dep_z: e.sch_dep_z_nf,
      sch_arr_z: e.sch_arr_z_nf,
      on: e.on_nf,
      off: e.off_nf,
      out: e.out_nf,
      in: e.in_nf,
      fltnum: e.flt_num_nf,
      tail: e.tail,
      status: e.status_nf,
      status0: e.status,
    };
    if (row_f.orig !== row_f.dest) {
      flights.push(row_f);
    }
    if (row_nf.orig !== row_nf.dest) {
      flights.push(row_nf);
    }
  });
  console.log(`number of flights: ${flights.length}`);
  return flights;
}

export function saveAtIntervals(nbSec) {
  const allUpdates = [];
  setInterval(() => {
    // save with repetition
    const keptRows = saveData(); // returns undefined. WHY? Asynchronous?
    u.print("after return from saveData, keptRows", keptRows);
    // compute new entries to keptRows: rotation at stations
    allUpdates.push(keptRows);
    const now = moment().calendar();
    const filenm = "/data/flight_data_" + now + ".txt";
    saveAs(new File(allUpdates, filenm, { type: "text/plain; charset=utf-8" }));
  }, nbSec * 1000); // ms
}

export function saveOnce(nbSec) {
  const allUpdates = [];
  setTimeout(() => {
    const keptRows = saveData(); // returns undefined. WHY? Asynchronous?
    u.print("after return from saveData, keptRows", keptRows);
    // compute new entries to keptRows: rotation at stations
    allUpdates.push(keptRows);
    const now = moment().calendar();
    const filenm = "/data/flight_data_" + now + ".txt";
    saveAs(new File(allUpdates, filenm, { type: "text/plain; charset=utf-8" }));
  }, nbSec * 1000); // ms
}
