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
import { sortBy } from "lodash";

const PWD = "M$h`52NQV4_%N}mvc$w)-z*EuZ`_^bf3";

// Boolean flag: true if there are either no inbounds in-flight or inbounds at the station
// Note: I remove all pairs if one of the legs has an Orig or Dest set to ORIG
let flightsInAir = true;

// arrays that will be retrieved at some point by an external program
// Not clear how to retrieve the data periodically
let flightTable = [];
let ptyPairs = [];
let stationPairs = [];
let allPairs = []; // combine ptyPairs and stationPairs

// inboundsMap[id_nf] is the list of associated feeder flights
// Note that there is no guarantee that there will be a feeder flight with the same tail as the outgoing tail number.
// Most of the time, there will be.
const inboundsMap = {};

// outboundsMap[id_f] is the list of associated outbound flights
// Note that there is no guarantee that there will be an outgoing flight with the same tail as the incoming flight.
// Most of the time, there will be.
const outboundsMap = {};

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
    eta_f: datetimeZ2ms(e.ETA),
    eta_nf: datetimeZ2ms(e.ETA_N_FLT),
    eta_nf_z: e.ETA_N_FLT,
    eta_f_z: e.ETA,
    etd_f: datetimeZ2ms(e.ETD),
    etd_nf: datetimeZ2ms(e.ETD_N_FLT),
    etd_f_z: e.ETD,
    etd_nf_z: e.ETD_N_FLT,
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
        if (e.ORIG_CD === "MIA") {
          // remove print when debugged
          u.print("inbound not departed", e);
        }
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
  const curDate = dt.today();
  // const curDate = "2021-12-05";
  console.log(`curData: ${curDate}`);
  let data = post(
    "http://35.223.143.175/api/dmhit",
    {
      pwd: "M$h`52NQV4_%N}mvc$w)-z*EuZ`_^bf3",
      arr_DTL: curDate, //"2021-11-28",
      days: 2,
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

//-------------------------------------------------------------
function saveData() {
  GetTableData().then((response) => {
    const data = response[0];
    u.print("readin dataMap[fltnum]", u.createMapping(data, "FLT_NUM"));
    u.print("readin data", data);
    // response[0] is a list of all flights registered to fly
    // only keep flights with CANCELLED === 0 (not cancelled)

    const inRows = []; // empty. BECAUSE ALL PLANES LANDED. STRANGE.
    data.forEach((r) => {
      if (
        r.CANCELLED === "0" &&
        (r.IN_P_FLT === null ||
          r.IN_N_FLT === null ||
          r.OUT_P_FLT === null ||
          r.OUT_N_FLT === null) &&
        r.ORIG_CD !== r.DEST_CD &&
        r.NEXT_ORIG_CD !== r.NEXT_DEST_CD
      ) {
        // console.log(r.IN_P_FLT);
        const in_f = r.IN_P_FLT != null ? datetimeZ2ms(r.IN_P_FLT) : 0;
        inRows.push({
          in_f: datetimeZ2ms(r.IN_P_FLT),
          in_nf: datetimeZ2ms(r.IN_N_FLT),
          out_f: datetimeZ2ms(r.OUT_P_FLT),
          out_nf: datetimeZ2ms(r.OUT_N_FLT),
          //cancelled: r.CANCELLED,
          orig_f: r.ORIG_CD,
          dest_f: r.DEST_CD,
          orig_nf: r.NEXT_ORIG_CD,
          dest_nf: r.NEXT_DEST_CD,
        });
      }
    });
    u.print("inRows", inRows);
    console.log(`data.length: ${data.length}`);

    // TODO: SPECIFY A TIME OF ANALYSIS
    // Remove all pairs with a feeder already landed.

    const inboundNotDeparted = inboundFlightsNotDeparted(data);
    const inboundInFlight = inboundFlightsInAir(data);
    const inboundAtPTY = inboundFlightsAtPTY(data); // remove
    const outboundInFlight = outboundFlightsInAir(data); // remove
    const outboundLanded = outboundFlightsLanded(data); // remove
    // u.print(`inboundNotDeparted`, inboundNotDeparted);
    // console.log(`inboundNotDeparted.length: ${inboundNotDeparted.length}`);
    // u.print(`inboundInFlight`, inboundInFlight);
    // console.log(`inboundInFlight.length: ${inboundInFlight.length}`);
    // console.log(`inboundAtPTY.length: ${inboundAtPTY.length}`);
    // console.log(`outboundInFlight.length: ${outboundInFlight.length}`);
    // console.log(`outboundLanded.length: ${outboundLanded.length}`);
    // Only non-cancelled flights
    const allFlights = [
      // 135 flights
      ...inboundNotDeparted,
      ...inboundInFlight, // Why are all ptyPairs not include planes in flight? I DO NOT UNDERSTAND
      ...inboundAtPTY,
      ...outboundInFlight,
      //      ...outboundLanded,
    ];
    allFlights.forEach((r) => {});
    console.log(`total nb flights: ${allFlights.length}`);
    u.print("allFlights", allFlights);
    //u.print("inboundNotDeparted", inboundNotDeparted);
    //u.print("inboundInFlight", inboundInFlight);
    //u.print("inboundAtPTY", inboundAtPTY);
    //u.print("outboundInFlight", outboundInFlight);
    //u.print("outboundLanded", outboundLanded);

    // allFlights contains pairs of flights at PTY
    // u.print("saveData, before return, allFlights", allFlights);
    // console.log(`nb flight pairs (some orig==dest): ${allFlights.length}`); // 144

    // allFlights is an array of pairs. Should call it allFlightPairs

    // remove pairs if dest != orig for either _f or _nf
    // Each pair corresponds to two planes with the same tail
    ptyPairs = [];
    allFlights.forEach((r) => {
      // console.log(`${r.orig_f}, ${r.dest_f}, ${r.orig_nf}, ${r.dest_nf}`);
      if (r.orig_f !== r.dest_f && r.orig_nf !== r.dest_nf) {
        // console.log("   keep");
        ptyPairs.push(r);
      }
    });

    // ptyPairs.forEach((r) => {
    //   // u.print("row: ", r);
    //   console.log(`STATUS: ${r.status_f}, ${r.status_nf}`);
    //   console.log(r)
    // });

    // At the end of the day, the inbound-outbound pairs whose inbound has not departed the station (outside PTY)
    // typically has one ORIG listed. Thus the pair is not admissible.

    if (ptyPairs.length == 0) {
      // console.log(
      //   "========================================================================"
      // );
      // console.log(
      //   "There are no planes either at the station, or inbound flights in the air"
      // );
      // console.log(
      //   "========================================================================"
      // );
      flightsInAir = false;
    }

    // Delete allFlights
    flightTable = computeFlightList(ptyPairs);
    const ids2flights = u.createMapping(flightTable, "id");

    stationPairs = computeTails(ptyPairs, flightTable, ids2flights); // WORK ON THIS CODE
    const stationPairsMap = u.createMapping(stationPairs, "id_f");
    // console.log(
    //   `==> text-processing, stationPairs.length: ${stationPairs.length}`
    // );
    // console.log(`==> text-processing, ptyPairs.length: ${ptyPairs.length}`);

    // compute estimated departure and arrival delays
    setupDelays(flightTable);

    let flightIdMap = u.createMapping(flightTable, "id");

    // update ptyPairs with arrDelay and depDelay attributes
    ptyPairs.forEach((r) => {
      const id_f = r.id_f;
      const id_nf = r.id_nf;
      const row_f = flightIdMap[id_f];
      const row_nf = flightIdMap[id_nf];
      r.depDelay_f = row_f.depDelay;
      r.depDelay_nf = row_nf.depDelay;
      r.arrDelay_f = row_f.arrDelay;
      r.arrDelay_nf = row_nf.arrDelay;
    });

    // make a list of fltnum
    const flightNums = [];
    flightTable.forEach((r) => {
      flightNums.push(r.fltnum);
    });
    // console.log(`flightNums: ${flightNums}`);
    // THERE are no undefines

    // Create a list of feeder-outgoing pairs modeling connections
    const nbConn = 10; // max number of connections
    const { inboundsMap, outboundsMap } = syntheticConnections(
      ptyPairs,
      flightsInAir,
      nbConn
    );
    // u.print("after return from synth, inboundsMap", inboundsMap);
    // u.print("after return from synth, outboundsMap", outboundsMap);
    u.print("after return from synth, flightTable", flightTable);
    // u.print("after return from synth, stationPairs", stationPairs);
    u.print("after return from synth, ptyPairs", ptyPairs);
    // u.print("after return from synth, flightIdMap", flightIdMap);

    computeAllPairs(stationPairs, flightIdMap, ptyPairs);
    u.print("after computeAllPairs, allPairs", allPairs);

    setStatus(true);
  });
}

//-----------------------------------------------------------------------
const getEndPointFilesComputed = computed(() => {
  return {
    flightTable,
    ptyPairs,
    stationPairs,
    allPairs,
    inboundsMap,
    outboundsMap,
  };
});

export { getEndPointFilesComputed };

//------------------------------------------------------------------------
export function syntheticConnections(ptyPairs, flightsInAir, nbConn) {
  // Arguments
  // ptyPairs (array): list of flight pairs rotating at PTY
  // flightsInAir (array):  list of flights (ORIGIN-DEST pair)
  // nbConn (int): desired number of connections per inbound or outbound flight at PTY
  //
  // Returns
  // inboundsMap: inboundsMap[id_nf]: list of incoming flight ids with different tails
  // outboundsMap: outboundsMap[id_f]: list of outgoing flight ids with different tails
  // These maps corresponds to feeders and outbounds at PTY

  // console.time("Synthetic execution time");
  if (flightsInAir === false) {
    return { inboundsMap, outboundsMap }; // empty objects {}
  }
  // u.print("syntheticConnections", ptyPairs);
  const synthPairs = []; // id_f, id_nf pairs
  const dep_nf = sortBy(ptyPairs, "sch_dep_nf");
  const arr_f = sortBy(ptyPairs, "sch_arr_f");
  // u.print("ptyPairs", ptyPairs); // empty!!!

  // Establish a common frame of reference
  const earliest_dep_nf = dep_nf[0].sch_dep_nf;
  const earliest_arr_f = arr_f[0].sch_arr_f;
  const earliest = Math.min(earliest_dep_nf, earliest_arr_f);

  arr_f.forEach((r) => {
    r.delta_arr_f = (r.sch_arr_f - earliest) / 60000;
    r.delta_dep_nf = (r.sch_dep_nf - earliest) / 60000;
  });

  dep_nf.forEach((r) => {
    r.delta_arr_f = (r.sch_arr_f - earliest) / 60000;
    r.delta_dep_nf = (r.sch_dep_nf - earliest) / 60000;
  });

  const feederIds = [];
  arr_f.forEach((r) => {
    feederIds.push(r.id_f);
  });

  const outgoingIds = [];
  dep_nf.forEach((r) => {
    outgoingIds.push(r.id_nf);
  });

  // The two flights in a ptyPairs[i] have the same tails. Therefore, the two maps below are
  // well defined.
  // idMap[id_f] is the node data of the pair with the specified feeder (id_f)
  // idMap[id_nf] is the node data of the pair with the specified outbound (id_nf)
  const idfMap = u.createMapping(ptyPairs, "id_f");
  const idnfMap = u.createMapping(ptyPairs, "id_nf");
  // u.print("synthetic, idfMap", idfMap);
  // u.print("synthetic, idnfMap", idnfMap);

  // For each feeder ids, identify the 20 outgoing flights that depart closest to the time of arrival
  // For now: Brute force. Per day, about 150 flights, so 150*150 = 22,500 combinations. Still low.

  feederIds.forEach((id_f) => {
    // console.log(`feeder: ${id_f}`);
    const deltas = [];
    const keep_outgoings = [];
    const keep_deltas = [];
    outgoingIds.forEach((id_nf) => {
      // u.print("idnfMap[id_nf]", idnfMap[id_nf]);
      const delta = idnfMap[id_nf].delta_dep_nf - idfMap[id_f].delta_arr_f;
      if (delta > 45) {
        keep_outgoings.push(id_nf);
        keep_deltas.push(delta);
      }
      deltas.push(delta);
      // console.log(`delta: ${delta}`);
    });
    const nb_outgoings = keep_outgoings.length;
    // u.print(`id: ${id_f}, nb_outgoings: ${nb_outgoings}, deltas`, deltas);
    // Only keep top 20
    if (keep_outgoings.length > nbConn) {
      keep_outgoings.length = nbConn;
      keep_deltas.length = nbConn;
    }
    // u.print(`   kept outgoing ids`, keep_outgoings);
    outboundsMap[id_f] = keep_outgoings;
    // u.print(`   kept deltas`, keep_deltas);
    // Keep top 20 greater than 45 min (to give PAX time to connect)
  });

  ptyPairs.forEach((r) => {
    inboundsMap[r.id_nf] = [];
  });

  for (const id_in in outboundsMap) {
    const outbounds = outboundsMap[id_in];

    // outbound map is consistent with inbound map
    outbounds.forEach((id_out) => {
      inboundsMap[id_out].push(id_in);
    });
  }

  // remove empty elements from inboundsMap
  for (let id in inboundsMap) {
    if (inboundsMap[id].length === 0) {
      delete inboundsMap[id];
    }
  }

  // console.timeEnd("Synthetic execution time");
  // console.log("==> end of SyntheticConnections");
  // u.print("syntheticConnections, outboundsMap: ", outboundsMap);
  // u.print("syntheticConnections, inboundsMap: ", inboundsMap);

  return { inboundsMap, outboundsMap };
}

//-------------------------------------------------------------------------------------

// 2021-11-15 : WORK ON THIS CODE
export function computeTails(ptyPairs, flightTable, id2flights) {
  // For each outbound flight, determine the connecting return flight (same tail)
  // order by tail
  // order by id_f
  // order by id_nf
  const fl = lodash.orderBy(flightTable, ["tail", "sch_dep"]);
  const tails = u.createMappingOneToMany(fl, "tail");
  // u.print("fl: ", fl);
  // u.print("computeTails, tails: ", tails);
  // console.log(`computeTails1, tails.length: ${tails.length}`);
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
  // u.print("computeTails, tails: ", tails);
  // u.print("computeTails, connections: ", connections);
  // u.print("computeTails, connections.length: ", connections.length);
  return connections; // id pairs
}

function computeAllPairs(stationPairs, flightIdMap, ptyPairs) {
  // console.log(`computeAllPairs, stationPairs.length: ${stationPairs.length}`);
  // console.log(`computeAllPairs, ptyPairs.length: ${ptyPairs.length}`);
  // u.print("computeAllPairs, stationPairs: ", stationPairs);
  // u.print("computeAllPairs, ptyPairs: ", ptyPairs);
  stationPairs.forEach((r) => {
    const row_f = flightIdMap[r.id_f];
    const row_nf = flightIdMap[r.id_nf];
    // u.print("stationPairs, row_f", row_f);
    // u.print("stationPairs, row_nf", row_nf);
    const row = {
      id_f: row_f.id,
      id_nf: row_nf.id,
      in_f: row_f.in,
      in_nf: row_nf.in,
      eta_f: row_f.eta,
      eta_nf: row_nf.eta,
      out_f: row_f.out,
      out_nf: row_nf.out,
      orig_f: row_f.orig,
      orig_nf: row_nf.orig,
      dest_f: row_f.dest,
      dest_nf: row_nf.dest,
      flt_num_f: row_f.flt_num,
      flt_num_nf: row_nf.flt_num,
      sch_dep_f: row_f.sch_dep,
      sch_dep_nf: row_nf.sch_dep,
      sch_arr_f: row_f.sch_arr,
      sch_arr_nf: row_nf.sch_arr,
      sch_dep_z_f: row_f.sch_dep_z,
      sch_dep_z_nf: row_nf.sch_dep_z,
      sch_arr_z_f: row_f.sch_arr_z,
      sch_arr_z_nf: row_nf.sch_arr_z,
      status_f: row_f.status,
      status_nf: row_nf.status,
      arrDelay_f: row_f.arrDelay,
      arrDelay_nf: row_nf.arrDelay,
      depDelay_f: row_f.depDelay,
      depDelay_nf: row_nf.depDelay,
      tail: row_f.tail,
      fltnumPair: row_f.fltnum + " - " + row_nf.fltnum,
      est_rotation: -1, // MUST FIX
    };
    allPairs.push(row);
  });

  ptyPairs.forEach((e) => {
    //u.print("ptyPairs row: ", e);
    const row = {
      id_f: e.id_f,
      id_nf: e.id_nf,
      in_f: e.in_f,
      in_nf: e.in_nf,
      out_f: e.out_f,
      out_nf: e.out_nf,
      orig_f: e.orig_f,
      orig_nf: e.orig_nf,
      dest_f: e.dest_f,
      dest_nf: e.dest_nf,
      sch_dep_f: e.sch_dep_f,
      sch_dep_nf: e.sch_dep_nf,
      sch_arr_f: e.sch_arr_f,
      sch_arr_nf: e.sch_arr_nf,
      sch_dep_z_f: e.sch_dep_z_f,
      sch_dep_z_nf: e.sch_dep_z_nf,
      sch_arr_z_f: e.sch_arr_z_f,
      sch_arr_z_nf: e.sch_arr_z_nf,
      status_f: e.status_f,
      status_nf: e.status_nf,
      arrDelay_f: e.arrDelay_f,
      arrDelay_nf: e.arrDelay_nf,
      depDelay_f: e.depDelay_f,
      depDelay_nf: e.depDelay_nf,
      tail: e.tail_f,
      fltnumPair: e.flt_num_f + " - " + e.flt_num_nf,
      est_rotation: -1, // MUST FIX
    };
    allPairs.push(row);
  });

  // I am waiting on Miguel's endpoint (once a day) to provide me with the connection pattern between flights
  // - For a feeder, what are the outgoing flights
  // - For an outgoing flight, what are the feeders
  allPairs.forEach((r) => {
    // In general, the tails will be different. Here they are the same.
    r.ACTAvailable = (r.sch_dep_nf - r.sch_arr_f) / 60000;
    r.ACTAvailableP = (r.out_nf - r.in_f) / 60000; // 60000 ms per min
    r.ACTSlack = r.ACTAvailable - 30;
    r.ACTSlackP = r.ACTSlack; // initial conditions
    // only applies if tails are the same
    r.plannedRotation = (r.sch_dep_nf - r.sch_arr_f) / 60000;
    if (r.plannedRotation < 60) {
      r.availRotMinReq = r.plannedRotation;
    } else {
      r.availRotMinReq = 60; // hardcoded
    }
    // const actAvailable =
    //  20     (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; /
    r.inDegree = "undef";
    r.outDegree = "undef";

    // At this stage, all pairs have the same tail
    r.rotSlack = r.ACTAvailable - 60;
    r.rotSlackP = r.ACT;
    r.pax = "undef"; // probably not required
    //if (r.eta_f !== 0 && r.orig_f == "MIA") { // }

    // if (r.out_f !== 0) {
    //   r.arr_delay = (r.eta_f - r.sch_arr_f) / 60000;
    //   r.arr_delay_f = (r.eta_f - r.sch_arr_f) / 60000;
    //   console.log(
    //     `==> allPairs, r.out_f != 0, arr_delay: ${r.arr_delay}, id: ${r.id}`
    //   );
    //   console.log(`r.eta_f: ${r.eta_f}, r.sch_arr_f: ${r.sch_arr_f}`);
    //   if (r.status_f === "NOT DEP" && r.status_nf === "AIR") {
    //     u.print("status NOT DEP, row = ", r); // should not happen. Is eta nonzero? "What about out? "
    //     u.print("INCONSISTENT status, row = ", r); // should not happen. Is eta nonzero? "What about out? "
    //   } else {
    //     // Rarely, the arrival delay is NaN. Why?
    //     u.print("r.eta_f !== 0", r);
    //     console.log(`status_f_nf: ${r.status_f}, ${r.status_nf}`);
    //   }
    //   if (r.out_nf !== 0) {
    //     r.arr_delay_nf = (r.eta_nf - r.sch_arr_nf) / 60000;
    //   }
    // }
  });
  // u.print("computeAllPairs::allPairs", allPairs);
}

//----------------------------------------------------------------------
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
  // update with information necesary for rigid body model
  // for nodes: need: departureDelayP, arrDelayP
  // for edges: need: ACTAvailableP
  // ALL THESE FLIGHTSS APPEAR TO HAVE LANDED. Strange.
  // This must have to do with my removing certain rows
  flights.forEach((r) => {
    // console.log(`${r.on}, ${r.in}, ${r.sch_dep}, ${r.sch_arr}`);
    r.depDelayP = (r.on - r.sch_dep) / 60000; // 60000 ms per minute
    r.arrDelayP = (r.in - r.sch_arr) / 60000;
    r.schDepTMZ = "undef";
    r.schArrTMZ = "undef";
    r.depDelay = "undef";
    r.arrDelay = "undef";
    r.plannedRot = "undef";
    r.rotSlackP = "undef";
    r.slackP = "undef";
    r.ACTSSlackP = "undef";
    r.minACTP = "undef";
    r.hubConnections = "undef";
  });
  // <li>Sch inbound arr Zulu: ${edge.schArrInTMZ} UTC</li>
  // <li>Sch outbound dep Zulu: ${edge.schDepOutTMZ} UTC</li>
  // <li>ACTSlack: ${edge.ACTSlack} min</li>
  // <li>ACTSlackP: ${edge.ACTSlackP} min</li>
  // <li>ACTAvailable: ${edge.ACTAvailable} min</li>
  // <li>ACTAvailableP: ${edge.ACTAvailableP} min</li>

  // <li>Nb incoming flights connecting <br> with outbound flight: ${
  //   edge.inDegree
  // }</li>
  // <li>Nb outgoing flights connecting <br> with inbound flight: ${
  //   edge.outDegree
  // }</li>
  // <li>rotSlackP: ${edge.rotSlackP} min</li>
  // <li>PAX: ${edge.pax} </li>  <!-- equal to pax_nf -->
  // <!-- If the slack < 45 min, draw in red -->
  // <!--
  // <li style="color:${actColor};">Available Connection Time: ${actAvail} min </li>
  // <li>Minimum Connection Time: ${minConnectTime} min</li>
  // <li>Planned Connection Time (outbound.schDep-inbound.schArr): ${actSched} min </li>
  // <li>Actual Connection Time (outbound.outZ-inbound.inZ): ${actActual} min </li>
  // <li>Available Connection Time (outbound.schDep-inbound.inZ): ${actAvail} min </li>
  // <li>Tail (inbound=>oubound): ${inbound.tail} => ${outbound.tail}</li>
  // <li>Connection Time Slack: ${actAvail} - ${minConnectTime}
  //   = ${actAvail - minConnectTime} min</li>

  // console.log(`number of flights: ${flights.length}`);
  // u.print("flights", flights);
  return flights;
}

export function saveAtIntervals(nbSec) {
  const allUpdates = [];
  setInterval(() => {
    // save with repetition
    const keptRows = saveData(); // returns undefined. WHY? Asynchronous?
    // u.print("after return from saveData, keptRows", keptRows);
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
    // u.print("after return from saveData, keptRows", keptRows);
    // compute new entries to keptRows: rotation at stations
    allUpdates.push(keptRows);
    const now = moment().calendar();
    const filenm = "/data/flight_data_" + now + ".txt";
    saveAs(new File(allUpdates, filenm, { type: "text/plain; charset=utf-8" }));
  }, nbSec * 1000); // ms
}

// compute estimated departure and arrival delays
export function setupDelays(flightTable) {
  let countUndefinedArrDelay = 0;
  let countUndefinedDepDelay = 0;
  flightTable.forEach((r) => {
    let arrDelay = 0;
    let depDelay = 0;

    // u.print("=> text-processing::setupDelays::flightTable row: ", r);
    if (r.status === "NOT DEP") {
      if (r.etd > 0) {
        depDelay = (r.etd - r.sch_dep) / 60000; // min
      } else {
        depDelay = 0;
      }
      arrDelay = 0;
    } else if (r.status === "AIR") {
      if (r.out > 0) {
        depDelay = (r.out - r.sch_dep) / 60000;
      } else {
        depDelay = undefined; // should not happen
      }
      if (r.eta > 0) {
        arrDelay = (r.eta - r.sch_arr) / 60000;
      } else {
        arrDelay = undefined; // should not happen
      }
    } else if (r.status === "LANDED") {
      if (r.out > 0) {
        depDelay = (r.out - r.sch_dep) / 60000;
      } else {
        depDelay = undefined; // should not happen
      }
      if (r.in > 0) {
        arrDelay = (r.in - r.sch_arr) / 60000;
      } else {
        arrDelay = undefined; // should not happen
      }
    }

    r.arrDelay = arrDelay;
    r.depDelay = depDelay;

    if (arrDelay === undefined) {
      countUndefinedArrDelay += 1;
    }
    if (depDelay === undefined) {
      countUndefinedDepDelay += 1;
    }
  });
  // console.log(
  //   `text-processing::setupDelays, countUndefinedArrDelay: ${countUndefinedArrDelay}`
  // );
  // console.log(
  //   `text-processing::setupDelays, countUndefinedDepDelay: ${countUndefinedDepDelay}`
  // );
}
