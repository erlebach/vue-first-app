const API_URL = "http://35.223.143.175/api/dmhit";

import { saveAs } from "file-saver";
import { post } from "axios";
import moment from "moment";
import * as u from "./utils.js";
import * as dt from "./dates";
import { date } from "check-types";
import lodash, { isDate } from "lodash";
import { ArgumentOutOfRangeError } from "rxjs";
import { watchEffect, computed, ref } from "vue";
import { sortBy } from "lodash";
import * as epu from "./endpointUtils.js";
import { DirectedGraph } from "@datastructures-js/graph";

// Has no effect
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
let dBookings = []; // three arrays now computed in text-processing. Not clear that the other arrays are still required. Perhaps.
let dFSU = [];
let dTails = [];
let graph = [];
let edges = [];

// inboundsMap[id_nf] is the list of associated feeder flight Ids
// Note that there is no guarantee that there will be a feeder flight with the same tail as the outgoing tail number.
// Most of the time, there will be.
const inboundsMap = {};

// outboundsMap[id_f] is the list of associated outbound flight Ids
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
  if (e.SCH_DEP_DTMZ !== undefined) {
    next_tmz = e.SCH_DEP_DTMZ.slice(11, 16);
  } else if (e.ORIG_CD !== "ORIG") {
    // This should never happen
    next_tmz = "00:00";
    u.print("e: ", e);
    console.log("getRow::, SCH_DEP_DTMZ is undefined. That should not happen");
    console.log(
      "getRow::, Ideally, change all null to undefined. Safer programming"
    );
  }
  const id_f = e.SCH_DEP_DTZ + e.ORIG_CD + e.DEST_CD + next_tmz + e.FLT_NUM;
  if (e.NEXT_STD !== undefined) {
    // u.print("e.NEXT_STD", e.NEXT_STD);
    next_dtz = e.NEXT_STD.slice(0, 10);
    next_tmz = e.NEXT_STD.slice(11, 16);
  } else {
    // set it to the scheduled time of departure
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
    tail_f: e.REG, // Add both tail_f and tail_nf since I will be
    tail_nf: e.REG, // merging this list with bookings where tails are different
    // 0: inbound not departed
    // 1: inbound departed, not landed
    // 2: inbound landed, outbound not departed (at PTY)
    // 3: outbound departed
    // 4: outbound landed
    status: undefined,
  };
  // if flight has not departed, rotation is estimated based on
  // scheduled times
  // Best estimate (est) rotation
  let in_time, out_time;
  if (row.out_nf === undefined) {
    out_time = row.sch_dep_nf;
  } else {
    out_time = row.out_nf;
  }
  if (row.in_f === undefined) {
    in_time = row.sch_arr_nf;
  } else {
    in_time = row.in_f;
  }
  // If plane is in the air, use ETD for the out_time and the ETA for the in_time
  row.est_rotation = (out_time - in_time) * ms2min;
  return row;
}

// data has pairs of flights (similar to feeder/outgoing) at PTY.
function inboundFlightsInAir(data) {
  const keptRows = [];
  data.forEach((e) => {
    // flight not cancelled
    if (e.CANCELLED === "0") {
      if (e.IN_P_FLT === undefined && e.OUT_P_FLT !== undefined) {
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
      if (e.IN_N_FLT === undefined && e.OUT_N_FLT !== undefined) {
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
      if (e.IN_P_FLT !== undefined && e.OUT_N_FLT === undefined) {
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
      if (e.OUT_P_FLT === undefined) {
        if (e.ORIG_CD === "MIA") {
          // remove print when debugged
          // u.print("inbound not departed", e);
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
      if (e.IN_N_FLT !== undefined) {
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

//-------------------------------------------------------------
function saveData() {
  GetTableData().then((response) => {
    const data = response[0];
    // u.print("readin dataMap[fltnum]", u.createMapping(data, "FLT_NUM"));
    // u.print("readin data", data);
    // response[0] is a list of all flights registered to fly
    // only keep flights with CANCELLED === 0 (not cancelled)

    console.log("enter saveData");

    const inRows = []; // empty. BECAUSE ALL PLANES LANDED. STRANGE.
    data.forEach((r) => {
      if (
        r.CANCELLED === "0" &&
        (r.IN_P_FLT === undefined ||
          r.IN_N_FLT === undefined ||
          r.OUT_P_FLT === undefined ||
          r.OUT_N_FLT === undefined) &&
        r.ORIG_CD !== r.DEST_CD &&
        r.NEXT_ORIG_CD !== r.NEXT_DEST_CD
      ) {
        // console.log(r.IN_P_FLT);
        const in_f = r.IN_P_FLT != undefined ? datetimeZ2ms(r.IN_P_FLT) : 0;
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
    // u.print("inRows", inRows);
    // console.log(`data.length: ${data.length}`);

    // TODO: SPECIFY A TIME OF ANALYSIS
    // Remove all pairs with a feeder already landed.

    // Check for nulls and undefines in all field
    data.forEach((row) => {
      for (let attr in row) {
        if (row[attr] === null) {
          row[attr] = undefined;
        }
      }
    });

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

    // allFlightPairs connect at PTY
    const allFlightPairs = [
      // 135 flights
      ...inboundNotDeparted,
      ...inboundInFlight, // Why are all ptyPairs not include planes in flight? I DO NOT UNDERSTAND
      ...inboundAtPTY,
      ...outboundInFlight,
      ...outboundLanded, // keep if I wish to make sure all pairs are captured correctly. This is an issue end of day.
    ];

    ptyPairs = [...allFlightPairs]; // a clone (copy)

    // At the end of the day, the inbound-outbound pairs whose inbound has not departed the station (outside PTY)
    // typically has one ORIG listed. Thus the pair is not admissible.
    if (ptyPairs.length === 0) {
      flightsInAir = false;
      console.log("ptyPairs SHOULD NOT BE EMPTY! ERROR.");
    }

    // Delete allFlights
    flightTable = computeFlightList(ptyPairs);
    console.log(
      `computeFlightList::flightTable length 1: ${flightTable.length}`
    );
    // compute allPairs
    stationPairs = computeTails(ptyPairs, flightTable); // WORK ON THIS CODE
    let flightIdMap = u.createMapping(flightTable, "id");
    const stationPairsMap = u.createMapping(stationPairs, "id_f");

    // compute estimated departure and arrival delays
    setupDelays(flightTable);

    computeAllPairs(stationPairs, flightIdMap, ptyPairs);

    // update ptyPairs with arrDelay and depDelay attributes
    // allPairs.forEach((r) => {
    //   const id_f = r.id_f;
    //   const id_nf = r.id_nf;
    //   const row_f = flightIdMap[id_f];
    //   const row_nf = flightIdMap[id_nf];
    //   if (row_f === undefined || row_f === undefined) {
    //     console.log(`saveData, id_f: ${id_f}, id_nf: ${id_nf}`);
    //   }
    //   r.depDelay_f = row_f.depDelay;
    //   r.depDelay_nf = row_nf.depDelay;
    //   r.arrDelay_f = row_f.arrDelay;
    //   r.arrDelay_nf = row_nf.arrDelay;
    //   r.availRot = (row_nf.estDepTime_nf - row_f.estArrTime_nf) / 60000;
    // });

    // ERROR: undefines remain: flt_num_f, flt_num_nf (node quantities)
    // availRotSlackP (edge quantity, which is undefined!!) <<< ERROR

    // make a list of fltnum
    const flightNums = [];
    flightTable.forEach((r) => {
      flightNums.push(r.fltnum);
    });
    // THERE are no undefines

    // Create a list of feeder-outgoing pairs modeling connections
    const nbConn = 10; // max number of connections
    // global variables inboundsMap and outboundsMap are computed
    syntheticConnections(ptyPairs, flightsInAir, nbConn);

    const flightTableMap = u.createMapping(flightTable, "id");
    for (let id_f in outboundsMap) {
      const r_f = flightTableMap[id_f]; // UNDEFINED. HOW CAN THAT BE. THERE ARE FLIGHTS MISSING?
      outboundsMap[id_f].forEach((id_nf) => {
        const r_nf = flightTableMap[id_nf];
      });
    }

    const allPairsIds_nf = u.createMapping(allPairs, "id_nf");
    const allPairsIds_f = u.createMapping(allPairs, "id_f");

    // id: 2021-12-19PTYCLO15:060246  not found in allPairs. How is that possible?
    // Next line may be incorrect: plannedRot of a pair should be set on the outbound flight
    flightTable.forEach((r) => {
      const row_f = allPairsIds_f[r.id];
      const row_nf = allPairsIds_nf[r.id];
      if (row_nf !== undefined) {
        r.plannedRot = row_nf.plannedRot;
      } else {
        // pairs where one leg has ORIG for ORIG_CD are removed. So the missing id
        // in allPairs makes sense.The other leg has ORIG_CD === "ORIG"
        // u.print(`saveData::CANNOT happen!, r.id: ${r.id}, flightTable row`, r);
      }
    });
    console.log(
      `computeFlightList::flightTable length 2: ${flightTable.length}`
    );

    setStatus(true);

    flightTable = flightTable.sort((a, b) => a.sch_dep - b.sch_dep);

    // all_pairs, flight_table are finalized
    console.log(
      "========== all_pairs, flight_table are finalized ============"
    );
    u.print("saveData::flightTable", flightTable);
    u.print("saveData::allPairs", allPairs);
    //=================================================================================
    // Check inboundsMap and outboundsMap for undefined
    console.log("Check inboundsMap and outboundsMap for undefined");
    console.log(`flightTable length: ${flightTable.length}`);
    // Set nb inbounds and outbounds to an empty list if they are undefined.
    // This simplifies processing of downstream tasks
    flightTable.forEach((r) => {
      const outIds = outboundsMap[r.id];
      const inIds = inboundsMap[r.id];
      if (outIds === undefined) outboundsMap[r.id] = []; // zero outboudns to this node
      if (inIds === undefined) inboundsMap[r.id] = []; // zero inbounds to this node
      // console.log(
      //   `outIds,  inIds: in/out: ${inboundsMap[r.id].length}, ${
      //     outboundsMap[r.id].length
      //   } `
      // );
      r.nbInbounds = inboundsMap[r.id].length;
      r.nbOutbounds = outboundsMap[r.id].length;
      // if (outIds.length === 0) console.log("outIds has zero length");
      // if (inIds.length === 0) console.log("inIds has zero length");
    });
    // throw "saveData end script";
    //=================================================================================

    // console.log("call create_FSU_BOOK_TAILS");
    // dBookings, dFSU, dTails are globals.
    //const { dBookings, dFSU, dTails } = create_FSU_BOOK_TAILS( // )
    create_FSU_BOOK_TAILS(allPairs, flightTable, inboundsMap, outboundsMap);
    // { edges } = epu.getEdges(bookings);
    const obj = epu.getEdges(dBookings);
    edges = obj.edges;
    graph = createGraph(edges);
    u.print("saveData::dBookings", dBookings);
    u.print("saveData::dFSU", dFSU);
    u.print("saveData::dTails", dTails);
    u.print("saveData::edges", edges);
    u.print("saveData::graph", graph);
    u.print("saveData::inboundsMap", inboundsMap); // each element is list of ids
    u.print("saveData::outboundsMap", outboundsMap);
  });
}

//-----------------------------------------------------------------------
const getEndPointFilesComputed = computed(() => {
  return {
    // Figure out why vue module requires flightTable, ptyPairs, allPairs, stationPairs
    flightTable,
    ptyPairs,
    stationPairs,
    allPairs,
    // inboundsMap,
    // outboundsMap,
    dBookings, // three arrays now computed in text-processing. Not clear that the other arrays are still required. Perhaps.
    dFSU,
    dTails,
    graph,
    edges,
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
  u.print("synthetic::ptyPairs", sortBy(ptyPairs, "id_f"));
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

  // Final cleanup. Remove from inboundsMap and outboundsMap, all ids where id.slice(10:18) == "ORIGORIG"
  // or id.slice(10:14) == null or id.slice(10:14) == undef

  for (let ix in inboundsMap) {
    if (ix.slice(10, 14) !== "ORIG") {
      const ids = [];
      inboundsMap[ix].forEach((id) => {
        if (id.slice(10, 14) !== "ORIG") {
          ids.push(id);
        }
      });
      inboundsMap[ix] = ids;
    } else {
      delete inboundsMap[ix];
    }
  }

  for (let ix in outboundsMap) {
    // console.log(`ix: ${ix}`);
    if (ix.slice(10, 14) !== "ORIG") {
      // console.log("not ORIG");
      const ids = [];
      outboundsMap[ix].forEach((id) => {
        if (id.slice(10, 14) !== "ORIG") {
          ids.push(id);
        }
      });
      outboundsMap[ix] = ids;
    } else {
      delete outboundsMap[ix];
    }
  }

  u.print("synthetic::inboundsMap", inboundsMap);
  u.print("synthetic::outboundsMap", outboundsMap);

  return { inboundsMap, outboundsMap };
}

//-------------------------------------------------------------------------------------

// 2021-11-15 : WORK ON THIS CODE
export function computeTails(ptyPairs, flightTable) {
  const id2flights = u.createMapping(flightTable, "id");
  // For each outbound flight from either PTY or Station, determine the connecting return flight (same tail)
  // order by tail
  // order by id_f
  // order by id_nf
  const fl = lodash.orderBy(flightTable, ["tail", "sch_dep"]);
  const tails = u.createMappingOneToMany(fl, "tail");
  let nbPairs = 0;
  for (let tail in tails) {
    nbPairs += tails[tail].length - 1;
  }
  console.log(`computeTails, nbPairs: ${nbPairs}`);
  u.print("computeTails::flightTable sorted by tail and sch_dep", fl);

  // tails[tail] is a list, ordered by departure time, of all flights with the given tail

  const sameTailConnections = [];
  let count = 0;
  let countAll = 0;
  let countAll2 = 0;
  for (const tail in tails) {
    const rows = tails[tail]; // each tail has several rows
    countAll2 += rows.length - 1;
    for (let i = 0; i < rows.length - 1; i++) {
      // u.print("tail in tails, rows", rows);
      const dest = rows[i].dest;
      const orig = rows[i + 1].orig;
      // if (orig === dest && orig !== "PTY" && dest !== "ORIG") {
      countAll++;
      if (orig === dest) {
        sameTailConnections.push({ id_f: rows[i].id, id_nf: rows[i + 1].id });
        count++;
      }
    }
  }
  u.print("computeTails, flightTable: ", sortBy(flightTable, "id"));
  u.print("computeTails, tails: ", tails);
  u.print("computeTails, ptyPairs: ", ptyPairs);
  u.print("computeTails, sameTailConnections: ", sameTailConnections);
  console.log(
    `computeTails::count: ${count}, countAll: ${countAll}, countAll2: ${countAll2}`
  );
  // u.print("computeTails, connections.length: ", connections.length);
  return sameTailConnections; // id pairs   (same length as)
}

//--------------------------------------------------------------------
function computeAllPairs(stationPairs, flightIdMap, ptyPairs) {
  // Compute allPairs (includes all flight pairs, including turnarounds at PTY and at stations)
  // allPairs is a global variable (not a good practice)

  // stationPairs: turnaround at stations
  // ptyPairs: turnaround at PTY

  u.print("computeAllPairs::stationPairs: ", sortBy(stationPairs, "id_f"));
  u.print("computeAllPairs::ptyPairs: ", sortBy(ptyPairs, "id_f"));
  u.print("computeAllPairs::flightIdMap: ", sortBy(flightIdMap, "id_f"));
  u.print("computeAllPairs::allPairs: ", allPairs);

  // TODO: estArrTime must be given when computeAllPairs is called !!! <<<<<<<<<<<<<<<< ERROR (2021-12-22)
  u.print("flightIdMap", flightIdMap);

  // console.log(`computeAllPairs, stationPairs.length: ${stationPairs.length}`);
  // console.log(`computeAllPairs, ptyPairs.length: ${ptyPairs.length}`);
  // u.print(
  //   `computeAllPairs, stationPairs ${stationPairs.length}: `,
  //   sortBy(stationPairs, "orig_f")
  // );
  // u.print(
  //   `computeAllPairs, ptyPairs ${ptyPairs.length}: `,
  //   sortBy(ptyPairs, "orig_f")
  // );
  stationPairs.forEach((r) => {
    const row_f = flightIdMap[r.id_f];
    const row_nf = flightIdMap[r.id_nf];
    // u.print(
    //   `computeAllPairs::stationPairs, row_f, ${row_f.id}, ${row_f.estDepTime}, ${row_f.estArrTime}`,
    //   row_f
    // );
    // u.print(
    //   `computeAllPairs::stationPairs, row_nf, ${row_nf.id}, ${row_nf.tail}, ${row_nf.estDepTime}, ${row_nf.estArrTime}`,
    //   row_nf
    // );
    const row = {
      id_f: row_f.id,
      id_nf: row_nf.id,
      id: row_f.id + "-" + row_nf.id,
      in_f: row_f.in,
      in_nf: row_nf.in,
      eta_f: row_f.eta,
      eta_nf: row_nf.eta,
      estDepTime_f: row_f.estDepTime,
      estArrTime_f: row_f.estArrTime,
      estDepTime_nf: row_nf.estDepTime,
      estArrTime_nf: row_nf.estArrTime,
      out_f: row_f.out,
      out_nf: row_nf.out,
      orig_f: row_f.orig,
      orig_nf: row_nf.orig,
      dest_f: row_f.dest,
      dest_nf: row_nf.dest,
      flt_num_f: row_f.fltnum,
      flt_num_nf: row_nf.fltnum,
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
      arrDelay_f: row_f.arrDelay, // node var
      arrDelay_nf: row_nf.arrDelay, // node var
      depDelay_f: row_f.depDelay, // node var
      depDelay_nf: row_nf.depDelay, // node var
      tail: row_f.tail, // node var
      tail_f: row_f.tail, // node var
      tail_nf: row_nf.tail, // node var
      fltnumPair: row_f.fltnum + " - " + row_nf.fltnum, // node var
      // sch_dep_nf - sch_arr_f
      // planned_rotation: (row_nf.sch_dep - row_f.sch_arr) / 60000, // ms -> min // edge var
      plannedRot: (row_nf.sch_dep - row_f.sch_arr) / 60000, // ms -> min // edge var
      availRot: (row_nf.estDepTime - row_f.estArrTime) / 60000, // ms -> min // edge var
    };
    allPairs.push(row);
  });

  // When computing rotation for the flightTable, do I use _f or _nf rotation?
  // The correct answer (see check_rotations.py under copa/) is _nf (the outbound flight)
  // In other workds, given an id from the flightTable, find a flight in allPairs such that id is the outgoing flight.
  // Then assign the pair's planned rotation to this outgoing flight.  (this should be done so that dFSU has the correct
  // planned rotation)

  // stationPairs contains all the pairs whether turnaround is at PTY or at stations.

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
    r.inDegree = undefined;
    r.outDegree = undefined;

    r.plannedRot = r.plannedRotation; // edge var
    // console.log(
    //   `r.estArrTime_nf: ${r.estArrTime_nf}, r.estDepTime_f: ${r.estDepTime_f}`
    // ); // both undefined
    r.availRot = (r.estArrTime_nf - r.estDepTime_f) / 60000; // edge var (in min)
    r.availRotP = r.availRot; // edge var
    // console.log(
    //   // r.availRot not defined
    //   `computeAllPairs, r.availRot: ${r.availRot}, r.availRotMinReq: ${r.availRotMinReq}`
    // );
    r.availRotSlack = r.availRot - r.availRotMinReq;
    r.availRotSlackP = r.rotSlack; // edge var
    r.slack = Math.min(r.availRotSlack, r.ACTSlack); // min of slack and ACTSlack // edge var
    r.slackP = r.slack; // min of slackP and ACTSlackP // edge var

    r.minACT = "node var"; // node var (SHOULD NOT BE HERE)
    r.minACTP = "node var"; // node var
    r.hubConnections = undefined;
    //r.pax = undefined; // probably not required
  });

  u.print("computeAllPairs, allPairs", allPairs);
  console.log(`   allPairs.availRot: ${allPairs[10].availRot}`);
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
      tail: e.tail_f,
      status: e.status_f,
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
      tail: e.tail_nf,
      status: e.status_nf,
    };
    // This will automatically remove any orig or dest with ORIG
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
    // console.log(`${r.out}, ${r.in}, ${r.sch_dep}, ${r.sch_arr}`);
    if (r.id == "2021-12-17MDEPTY14:340825") {
      const out = dt.timestampToDateTimeZ(r.out);
      const inn = dt.timestampToDateTimeZ(r.in);
      u.print("id", r.id);
      u.print("out", out);
      u.print("r.out", r.out);
      u.print("inn", inn);
      u.print("sch_dep_z", r.sch_dep_z);
      u.print("sch_arr_z", r.sch_arr_z);
    }
    // r.depDelayP = (r.out - r.sch_dep) / 60000; // 60000 ms per minute
    // r.arrDelayP = (r.in - r.sch_arr) / 60000;
    r.depDelay = undefined; // node var
    r.depDelayP = undefined; // node var
    r.arrDelay = undefined; // node var
    r.arrDelayP = undefined; // node var
    r.schDepTMZ = undefined; // node var
    r.schArrTMZ = undefined; // node var
    r.plannedRot = undefined; // edge var
    r.availRot = undefined; // edge var
    r.availRotP = undefined; // edge var
    r.availRotSlack = undefined; // edge var
    r.availRotSlackP = undefined; // edge var
    r.ACTSSlack = undefined; // edge var
    r.ACTSSlackP = undefined; // edge var
    r.slack = undefined; // min of slack and ACTSlack // edge var
    r.slackP = undefined; // min of slackP and ACTSlackP // edge var
    r.minACT = undefined; // edge var
    r.minACTP = undefined; // edge var
    r.hubConnections = undefined;
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
  // Flights from PTY and flights from  STATION
  u.print(
    "text-processing::computeFlightList::flights",
    sortBy(flights, "orig")
  );
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
    // const filenm = "/data/flight_data_" + now + ".txt";
    // saveAs(new File(allUpdates, filenm, { type: "text/plain; charset=utf-8" }));
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
    // const filenm = "/data/flight_data_" + now + ".txt";
    // saveAs(new File(allUpdates, filenm, { type: "text/plain; charset=utf-8" }));
  }, nbSec * 1000); // ms
}

// compute estimated departure and arrival delays
export function setupDelays(flightTable) {
  let countUndefinedArrDelay = 0;
  let countUndefinedDepDelay = 0;
  flightTable.forEach((r) => {
    let arrDelay = 0;
    let depDelay = 0;
    // Either scheduled time of arrival (if not departed), or ETA (if in the air), or IN (if landed)
    let estArrTime = 0;
    // Either scheduled time of departure (or ETD) (if not departed), or OUT (if in the air or landed)
    let estDepTime = 0;

    if (r.status === "NOT DEP") {
      if (r.etd > 0) {
        estDepTime = r.etd;
      } else {
        estDepTime = r.sch_dep;
      }
      estArrTime = r.sch_arr;
    } else if (r.status === "AIR") {
      if (r.out > 0) {
        estDepTime = r.out;
      } else {
        estDepTime = undefined;
      }
      if (r.eta > 0) {
        estArrTime = r.eta;
      } else {
        estArrTime = undefined;
      }
    } else if (r.status === "LANDED") {
      if (r.out > 0) {
        estDepTime = r.out;
      } else {
        estDepTime = undefined;
      }
      if (r.in > 0) {
        estArrTime = r.in;
      } else {
        estArrTime = undefined;
      }
    }

    r.estDepTime = estDepTime;
    r.estArrTime = estArrTime;
    // r.depDelay = depDelay;
    // r.arrDelay = arrDelay;
    r.depDelay = (r.estDepTime - r.sch_dep) / 60000;
    r.arrDelay = (r.estArrTime - r.sch_arr) / 60000;
    r.depDelayP = r.depDelay;
    r.arrDelayP = arrDelay;

    // undefined + 3 equals NaN

    if (arrDelay === undefined || isNaN(arrDelay)) {
      countUndefinedArrDelay += 1;
    }
    if (depDelay === undefined || isNaN(depDelay)) {
      countUndefinedDepDelay += 1;
    }
    // u.print("setupDelays::flightTable, r", r);
  });
  // console.log(
  //   `text-processing::setupDelays, countUndefinedArrDelay: ${countUndefinedArrDelay}`
  // );
  // console.log(
  //   `text-processing::setupDelays, countUndefinedDepDelay: ${countUndefinedDepDelay}`
  // );
}
//-----------------------------------------------------------------
function create_FSU_BOOK_TAILS(
  allPairs,
  flightTable,
  inboundsMap,
  outboundsMap
) {
  console.log("text-processing::create_FSU_BOOK_TAILS");
  // both defined globally
  //const dFSU = [];
  //const dTails = [];

  // flightTable.forEach((r) => {
  //   console.log(`create_FSU_BOOK_TAILS::rotation: ${r.plannedRot}`); // all undef
  // });

  flightTable = sortBy(flightTable, "status");
  // u.print("create_FSU_BOOK_TAILS::flightTable", flightTable);
  // u.print("create_FSU_BOOK_TAILS::allPairs", allPairs);

  const allPairsMap_f = u.createMapping(allPairs, "id_f");
  const allPairsMap_nf = u.createMapping(allPairs, "id_nf");

  // u.print("allPairsMap_f: ", sortBy(allPairsMap_f, "orig_f"));
  // u.print("allPairsMap_nf: ", sortBy(allPairsMap_nf, "orig_nf"));

  // const dFSU_copy = [...dFSU]; // empty array
  //  flightTableRow: in/off/on/out are all 0?  (IS THAT TRUE?) WHY?
  flightTable.forEach((r) => {
    // rotation based on the departing flight (_nf) in the incoming-outgoing flight pair.
    const row_f = allPairsMap_f[r.id]; //.plannedRotation;
    const row_nf = allPairsMap_nf[r.id]; //.plannedRotation;
    // u.print(`row_f[${r.id}]`, row_f);
    // u.print(`row_nf[${r.id}]`, row_nf);
    let plannedRotation = 10000;
    if (row_nf !== undefined) {
      plannedRotation = row_nf.plannedRotation;
    }

    dFSU.push({
      id: r.id,
      estArrTime: r.estArrTime, // best guess based on endpoint data, but not propagated via modeling
      estDepTime: r.estDepTime,
      arrDelay: r.arrDelay,
      depDelay: r.depDelay,
      flt_num: r.fltnum,
      in: r.in,
      out: r.out,
      SCH_ARR_DTMZ: r.sch_arr * 1000, // ns
      SCH_DEP_DTMZ: r.sch_dep * 1000, // ns
      ROTATION_PLANNED_TM: plannedRotation, // min (get this from all_pairs array)
      ARR_DELAY_MINUTES: r.arrDelay, //arr_delay_minutes,
      TAIL: r.tail,
      status: r.status, // not in original dFSU
      nbInbounds: r.nbInbounds, // in-degree
      nbOutbounds: r.nbOutbounds, // in-degree
    });
    // if (r.id.slice(10, 13) === "PTY" && r.id.slice(13, 16) !== "PTY") {
    //   r.nbOutbounds = 1;
    // } else if (r.id.slice(10, 13) === "PTY" && r.id.slice(13, 16) !== "PTY") {
    //   r.nbInbounds = 1;
    // }
  });

  // Go through allPairs
  // Identify id_f, and set its plannedRot attribute to the plannedRot field.

  const dFSUId = u.createMapping(dFSU, "id");

  allPairs.forEach((r) => {
    dFSUId[r.id_nf].plannedRot = r.plannedRot;
  });

  dFSU.forEach((r) => {
    const p1 = r.plannedRot;
    const p2 = r.plannedRot2;
    if (p1 !== p2) console.log("rotations not equal");
  });

  // console.log("dfSU, dTail, dBookings");

  allPairs.forEach((r) => {
    dTails.push({
      id_f: r.id_f,
      id_nf: r.id_nf,
    });
  });

  const flightTableMap = u.createMapping(flightTable, "id");
  // u.print("flightTableMap", flightTableMap);

  // flightTable.forEach((r) => console.log(`r.id: ${r.id}`);

  // inboundsMap and outboundsMap are based on synthetic data

  //const dBookings = createBookings(
  // dBookings defined globally
  createBookings(inboundsMap, outboundsMap, allPairs, flightTableMap);

  // recalculate nb inbounds and outbounds (taking all nodes into account based on dBookings)
  computeDegrees(dBookings, dFSU, dTails);

  // checkBookingsForConsistency(dBookings, dTails);

  // u.print("dTails", dTails);
  // u.print("before add tails: dBookings", dBookings);

  // dTail are the rotations outside PTY
  // No need to add dTail in dBookings. The tails are already included
  return { dBookings, dFSU, dTails };
}
//--------------------------------------------------------------------
function createBookings(inboundsMap, outboundsMap, allPairs, flightTableMap) {
  // Arguments
  // inboundsMap[id_nf]: list of feeders
  console.log("text-processing::createBookings");
  //let dBookings = []; // defined globally
  for (let id_f in outboundsMap) {
    // id_f =  2021-12-18PTYPTY20:230341  // leads to undefined r_f. WHY???? (2 days worth of data. MUST DEBUG)
    const r_f = flightTableMap[id_f]; // UNDEFINED. HOW CAN THAT BE. THERE ARE FLIGHTS MISSING?
    outboundsMap[id_f].forEach((id_nf) => {
      const r_nf = flightTableMap[id_nf];
      // if (r_nf === undefined) {
      //   u.print("createBookings::r_nf", r_nf);
      //   console.log(`id_f: ${id_f}, id_nf: ${id_nf}`);
      // }
      // if (r_f && r_f.in === undefined) {
      //   console.log(
      //     `createBookings::outboundsMap,  ${r_f.id}, in_f is undefined`
      //   ); // None are undefined
      // }
      // if (r_nf && r_nf.in === undefined) {
      //   console.log(
      //     `createBookings::outboundsMap,  ${r_f.id}, in_nf is undefined`
      //   ); // None are undefined
      // }
      // WHY IS THIS CONDITIONAL NECESSARY?
      if (r_f && r_nf) {
        let plannedRot = 10000;
        if (r_f.tail !== r_nf.tail) {
          dBookings.push({
            id: r_f.id + "-" + r_nf.id,
            id_f: r_f.id,
            id_nf: r_nf.id,
            tail_f: r_f.tail,
            tail_nf: r_nf.tail,
            in_f: r_f.in,
            in_nf: r_nf.in,
            out_f: r_f.out,
            out_nf: r_nf.out,
            SCH_ARR_DTMZ_f: r_f.sch_arr * 1000, // ns
            SCH_ARR_DTMZ_nf: r_nf.sch_arr * 1000, // ns
            SCH_DEP_DTMZ_f: r_f.sch_dep * 1000, // ns
            SCH_DEP_DTMZ_nf: r_nf.sch_dep * 1000, // ns
            status_f: r_f.status,
            status_nf: r_nf.status,
          });
        }
      } else {
        console.log(
          `createBookings, outboundssMap, id_f: ${id_f}, id_nf: ${id_nf}`
        );
      }
    });
  }

  for (let id_nf in inboundsMap) {
    // console.log(`id_f: ${id_f}`);
    const r_nf = flightTableMap[id_nf];
    inboundsMap[id_nf].forEach((id_f) => {
      // console.log(`id_nf: ${id_nf}`);
      const r_f = flightTableMap[id_f];
      // WHY IS THIS CONDITIONAL NECESSARY?
      if (r_f && r_nf) {
        if (r_f.tail !== r_nf.tail) {
          dBookings.push({
            id: r_f.id + "-" + r_nf.id,
            id_f: r_f.id,
            id_nf: r_nf.id,
            tail_f: r_f.tail,
            tail_nf: r_nf.tail,
            in_f: r_f.in,
            in_nf: r_nf.in,
            out_f: r_f.out,
            out_nf: r_nf.out,
            SCH_ARR_DTMZ_f: r_f.sch_arr * 1000, // ns
            SCH_ARR_DTMZ_nf: r_nf.sch_arr * 1000, // ns
            SCH_DEP_DTMZ_f: r_f.sch_dep * 1000, // ns
            SCH_DEP_DTMZ_nf: r_nf.sch_dep * 1000, // ns
            status_f: r_f.status,
            status_nf: r_nf.status,
          });
        }
      } else {
        // All id_f listed have ORIG and DEST as PTY. Do not know what this means.
        // console.log(
        // `createBookings, inboundssMap, id_f: ${id_f}, id_nf: ${id_nf}`
        // );
      }
    });
  }

  // u.checkEdgesDirection(dBookings, "check order in dBookings");
  allPairs.forEach((r) => {
    // u.print("allPairs row", r);
    // if (r.in_f === undefined) {
    //   console.log(`createBookings::allpairs[id_f: ${r.id_f} is undefined`);
    // }
    // u.print(`allPairs, plannedRot: ${r.plannedRot}`);
    // u.print(`allPairs, availRot: ${r.availRot}`);
    // u.print("allPairs, xxx row: ", r);
    dBookings.push({
      id: r.id_f + "-" + r.id_nf,
      id_f: r.id_f,
      id_nf: r.id_nf,
      tail_f: r.tail,
      tail_nf: r.tail,
      tail: r.tail,
      in_f: r.in_f,
      in_nf: r.in_nf,
      out_f: r.out_f,
      out_nf: r.out_nf,
      SCH_DEP_DTMZ_f: r.sch_dep_f * 1000, // ns
      SCH_ARR_DTMZ_f: r.sch_arr_f * 1000, // ns
      SCH_DEP_DTMZ_nf: r.sch_dep_nf * 1000, // ns
      SCH_ARR_DTMZ_nf: r.sch_arr_nf * 1000, // ns
      status_f: r.status_f,
      status_nf: r.status_nf,
    });
  });

  // remove duplicate rows in dBookings
  const dBookingsIdMap = u.createMapping(dBookings, "id");
  dBookings.length = 0;
  Object.values(dBookingsIdMap).forEach((value) => {
    dBookings.push(value);
  });

  // u.print("exit createBookings, dBookings: ", dBookings);
  // console.log(
  //   `createBookings::dBookings.length (non-unique): ${dBookings.length}`
  // );

  // u.print("unique dBookings", dBookings);

  // console.log("before allPairs loop");
  // Remove duplicates based on "id"
  allPairs.forEach((r) => {
    // find row in dBookings
    // console.log(`r.id: ${r.id}`);
    // console.log("dBookingsIdMap", dBookingsIdMap);
    const id = r.id_f + "-" + r.id_nf;
    const row = dBookingsIdMap[id];
    // u.print("before if", row); // 2nd one is undefined. WHY?
    if (row !== "undefined") {
      // u.print("if: allPairs, r", r); // defined
      // u.print("if: allPairs, row", row); // undefined
      row.plannedRot = r.plannedRot; // error
      row.availRot = r.availRot;
      row.availRotP = r.availRotP;
      row.availRotSlack = r.availRotSlack;
      row.availRotSlackP = r.availRotSlack;
      row.availRotMinReq = r.availRotMinReq;
    }
  });

  // Check that there are no duplicate pairs
  // There were none, but now we are sure.
  const dbidf = sortBy(dBookings, "id_f");
  const dbidnf = sortBy(dBookings, "id_nf");
  // There are multiple repeats

  // u.print("dBookings sorted by id_f", dbidf);
  // u.print("dBookings sorted by id_nf", dbidnf);
  // u.print("exit createBookings, unique dBookings: ", dBookings);

  // Check whether either ORIG or DEST is PTY
  let countOD_f = 0;
  let countOD_nf = 0;
  dBookings.forEach((r) => {
    // unique id
    const row_f = flightTableMap[r.id_f];
    const row_nf = flightTableMap[r.id_nf];
    // r.id = r.id_f + "-" + r.id_nf;   // // <<<< CHECK THAT r.id is well defined (different id_f and id_nf on all rows!!!)
    const ORG_f = r.id_f.slice(10, 13);
    const DST_f = r.id_f.slice(13, 16);
    const ORG_nf = r.id_nf.slice(10, 13);
    const DST_nf = r.id_nf.slice(13, 16);
    if (ORG_f !== "PTY" && DST_f !== "PTY") {
      countOD_f += 1;
    }
    if (ORG_nf !== "PTY" && DST_nf !== "PTY") {
      countOD_nf += 1;
    }
    if (row_f.tail === row_nf.tail) {
      // u.print("createBookingss, same tails", r);
      // availRot, availRotP, availRotSlack, availRotSlackP
      // r.plannedRot: r.plannedRot,
      // r.availRot: r.availRot,
      // r.availRotP: r.availRotP,
      // r.availRotSlack: r.availRotSlack,
      // r.availRotSlackP: r.availRotSlack,
      // r.availRotMinReq: r.availRotMinReq,
    } else {
      r.plannedRot = undefined;
      r.availRot = undefined;
      r.availRotP = undefined;
      r.availRotSlack = undefined;
      r.availRotSlackP = undefined;
      r.availRotMinReq = 60;
    }
    // No cases where flight goes between two STA.
  });
  // console.log(`countOD_f: ${countOD_f}, countOD_nf: ${countOD_nf}`);
  // u.print("createBookings::bookings", sortBy(dBookings, ["id_f", "id_nf"]));

  // which bookings have in_f set to undefined?

  console.log(`dBookings.length: ${dBookings.length}`);
  dBookings = sortBy(dBookings, "status_f");
  u.print("dBookings", sortBy(dBookings, "id"));

  // dBookings.forEach((r) => {
  //   if (r.out_f > 0) {
  //     console.log(`createBookings::dBookings[idf][${r.id_f}], in_f: ${r.in_f}`);
  //   }
  // });

  // 2021-12-13: dBookings have no undefines. I added status, in, out (_f, _nf)

  // the "id" attribute looks ok
  sortBy(dBookings, "id").forEach((r) => {
    if (r.tail_f === r.tail_nf) {
      //  u.print("bookings tail row: ", r);
    } else {
      // u.print("bookings tail row: ", r);
    }
  });
  return dBookings;
}
//---------------------------------------------------------------------------
function createGraph(edges) {
  // Enter the edges into a graph
  const graph = new DirectedGraph();

  // u.print("inside createGraph, edges", edges);

  // DANGER: MODIFYING ORIGINAL ARRAY.
  // Safer to copy the array. Will this work if data is updated dynamically?

  // Generate vertices from edges. Each vertex appears only once
  const nodes = new Set();
  edges.forEach((e) => {
    nodes.add(e.src);
    nodes.add(e.dst);
    // if (e.src === e.dst) {
    //   console.log("ATTN: e.src === e.dst"); // should never occur
    // }
  });

  nodes.forEach((n) => {
    graph.addVertex(n);
  });

  edges.forEach((e) => {
    graph.addEdge(e.src, e.dst);
  });

  // What is the difference betwen sources and inbounds or outbounds?

  const sources = Object.create(null);
  const targets = Object.create(null);
  graph.sources = sources;
  graph.targets = targets;

  // these nodes are just ids
  nodes.forEach((n) => {
    // console.log("node n: ", n);
    sources[n] = new Set(); //[];
    targets[n] = new Set(); //[];
  });

  let edges_undefined = 0;

  edges.forEach((e) => {
    const src = e.src;
    const dst = e.dst;
    if (targets[src] === undefined) {
      // never entered
      edges_undefined++;
    } else {
      //targets[src].push(dst);
      targets[src].add(dst);
    }
    if (sources[dst] === undefined) {
      edges_undefined++;
    } else {
      //sources[dst].push(src);
      sources[dst].add(src);
    }
  });

  for (let e in sources) {
    e = [...e];
  }
  for (let e in targets) {
    e = [...e];
  }

  // duplicates in sources and targets were removed by using Sets
  u.print("createGraph, sources", sources);
  u.print("createGraph, targets", targets);
  u.print("createGraph, edges_undefined: ", edges_undefined); // none
  // u.print("bookings_in", bookings_in);
  // u.print("bookings_out", bookings_out);

  graph.help =
    "targets[srcid] returns all the outbounds of the srcid inbound\n" +
    " sources[srcid] returns all the inbounds of the destid outbound";

  return graph;
}
//-------------------------------------------------------------------
function computeDegrees(dBookings, dFSU, dTails) {
  console.log(`computeDegrees::dTails: ${dTails.length}`);
  console.log(`computeDegrees::dBookings: ${dBookings.length}`);
  console.log(`computeDegrees::dFSU: ${dFSU.length}`);
  // Bookings are unique (I am pretty sure)

  dFSU.forEach((r) => {
    r.nbInbounds = 0;
    r.nbOutbounds = 0;
    r.inboundIds = [];
    r.outboundIds = [];
  });

  const dFSUm = u.createMapping(dFSU, "id");

  // console.log("before dBookings loop");
  dBookings.forEach((r) => {
    // u.print("r", r);
    // console.log(`${r.id_f}, ${r.id_nf}`);
    // u.print("dFSUm[r.id_f]", dFSUm[r.id_f]);
    // u.print("dFSUm[r.id_nf]", dFSUm[r.id_nf]);
    dFSUm[r.id_f].nbOutbounds++;
    dFSUm[r.id_f].outboundIds.push(r.id_nf);
    // console.log("==> 1");
    dFSUm[r.id_nf].nbInbounds++;
    dFSUm[r.id_nf].inboundIds.push(r.id_f);
    // console.log("==> 2");
  });

  // dFSU.forEach((r) => {
  //   console.log(`FSUid: ${r.id}, in/out: ${r.nbInbounds}, ${r.nbOutbounds}`);
  // });

  //  Check that nbOutbounds is consistent with outboundIds.length for all entries
  dFSU.forEach((r) => {
    if (r.nbOutbounds !== r.outboundIds.length)
      console.log("INCONSISTENT nbOutbounds SHOULD NOT HAPPEN");
    if (r.nbInbounds !== r.inboundIds.length)
      console.log("INCONSISTENT nbInbounds SHOULD NOT HAPPEN");
  });

  // throw "computeDegrees :: end script";
}
