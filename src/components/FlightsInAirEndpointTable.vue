<!-- Display data from Endpoint. Use a watchEffect to check whether endpoint data is 
available for display. Perhaps add a date/nb_days as possible input to control what
is returned from the endpoint. -->

<template>
  <FlightsInAirHelp show-help="false" />

  <DataTable
    :value="flightTable"
    :scrollable="true"
    resizableColumns="true"
    scrollHeight="300px"
  >
    <template #header>
      <h2>Flights (endpoint), {{ flights_nbRows }} entries</h2>
      <span>Time of day (Zulu): </span>
      <!-- Only show when table is visible -->
      <!-- What is type=? -->
      <InputText type="text" v-model="inputTime" />
      <!-- v-on:keyup.enter="confirmEntry" -->
      <!-- Consider a set of checkboxes to turn columns on and off -->
      <span>City (for graph): </span>
      <InputText type="text" v-model="inputCity" />
    </template>
    <Column field="id" header="id" :sortable="true" style="display: none;">
    </Column>
    <Column field="orig" header="Org" :sortable="true" :style="col"> </Column>
    <Column field="dest" header="Dst" :sortable="true"> </Column>
    <Column field="fltnum" header="Flt #" :sortable="true"> </Column>
    <Column field="status0" header="statusPair" :sortable="true"> </Column>
    <Column field="status" header="status" :sortable="true"> </Column>
    <Column field="sch_dep_z" header="sch_dep" :sortable="true"> </Column>
    <Column field="sch_arr_z" header="sch_arr" :sortable="true"> </Column>
    <Column field="eta" header="ETA" :sortable="true"> </Column>
  </DataTable>

  <DataTable
    :value="ptyPairTable"
    :scrollable="true"
    :resizableColumns="true"
    scrollHeight="300px"
  >
    <template #header>
      <h2>Flight Pairs through PTY (endpoint), {{ pty_nbRows }} entries</h2>
      <span>Time of day: </span>
      <!-- Only show when table is visible -->
      <!-- What is type=? -->
      <InputText type="text" v-model="inputTime" />
      <!-- v-on:keyup.enter="confirmEntry" -->
      <!-- Consider a set of checkboxes to turn columns on and off -->
      <span>City (for graph): </span>
      <InputText type="text" v-model="inputCity" />
    </template>
    <Column field="id_f" header="In id" :sortable="true" style="display: none;">
    </Column>
    <Column
      field="id_nf"
      header="Out id"
      :sortable="true"
      style="display: none;"
    >
    </Column>
    <Column field="orig_f" header="Org" :sortable="true" :style="col"> </Column>
    <Column field="dest_f" header="Stop" :sortable="true" :style="col">
    </Column>
    <Column field="dest_nf" header="Dst" :sortable="true"> </Column>
    <Column field="fltnumPair" header="Flt#s" :sortable="true"> </Column>
    <Column field="status_f" header="StatusIn" :sortable="true"> </Column>
    <Column field="status_nf" header="Statusout" :sortable="true"> </Column>
    <Column field="tail" header="Tail" :sortable="true"> </Column>

    <Column field="sch_dep_z_f" header="sch_dep_f" :sortable="true"> </Column>
    <Column field="sch_arr_z_f" header="sch_arr_f" :sortable="true"> </Column>
    <Column field="est_rotation" header="estRot(min)" :sortable="true">
    </Column>
    <Column field="sch_dep_z_nf" header="sch_dep_nf" :sortable="true"> </Column>
    <Column field="sch_arr_z_nf" header="sch_arr_nf" :sortable="true"> </Column>
  </DataTable>

  <DataTable
    :value="stationPairTable"
    :scrollable="true"
    :resizableColumns="true"
    scrollHeight="300px"
  >
    <template #header>
      <h2>
        Flight Pairs through Station using Endpoint,
        {{ station_nbRows }} entries
      </h2>
      <span>Time of day: </span>
      <!-- Only show when table is visible -->
      <!-- What is type=? -->
      <InputText type="text" v-model="inputTime" />
      <!-- v-on:keyup.enter="confirmEntry" -->
      <!-- Consider a set of checkboxes to turn columns on and off -->
      <span>City (for graph): </span>
      <InputText type="text" v-model="inputCity" />
    </template>
    <Column field="id_f" header="In id" :sortable="true" style="display: none;">
    </Column>
    <Column
      field="id_nf"
      header="Out id"
      :sortable="true"
      style="display: none;"
    >
    </Column>
    <Column field="orig_f" header="Org" :sortable="true" :style="col"> </Column>
    <Column field="dest_f" header="Stop" :sortable="true" :style="col">
    </Column>
    <Column field="dest_nf" header="Dst" :sortable="true"> </Column>
    <Column field="fltnumPair" header="Flt#s" :sortable="true"> </Column>
    <Column field="status_f" header="StatusIn" :sortable="true"> </Column>
    <Column field="status_nf" header="Statusout" :sortable="true"> </Column>
    <Column field="tail" header="Tail" :sortable="true"> </Column>

    <Column field="sch_dep_z_f" header="sch_dep_f" :sortable="true"> </Column>
    <Column field="sch_arr_z_f" header="sch_arr_f" :sortable="true"> </Column>
    <Column field="est_rotation" header="estRot(min)" :sortable="true">
    </Column>
    <Column field="sch_dep_z_nf" header="sch_dep_nf" :sortable="true"> </Column>
    <Column field="sch_arr_z_nf" header="sch_arr_nf" :sortable="true"> </Column>
  </DataTable>
</template>

<script>
import FlightsInAirHelp from "./FlightsInAirHelp.vue";
import { convertCopaData } from "../Composition/graphSupport.js";
import * as l from "../Composition/loadTableClass.js";
import * as f from "../Composition/FlightsInAir.js";
import * as u from "../Composition/utils.js";
import { IO_works, ensureConditionIsMet } from "../Composition/IO_works.js";
import { ref, reactive, isReactive, computed, watch, watchEffect } from "vue";
import ModalView from "./ModalView.vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import { findCityInCityMap, filterData } from "../Composition/graphSupport";
//import { colorByCity } from "../Composition/graphImpl";
import { useStore } from "vuex";
import { onMounted } from "vue";
import { useKeydown } from "../Composition/useKeydown.js";
import {
  setStatus,
  getStatus,
  saveAtIntervals,
  saveOnce,
  getEndpointFiles,
  getEndPointFilesComputed,
} from "../Composition/text-processing.js";

export default {
  components: { DataTable, Column, InputText, FlightsInAirHelp },
  props: {
    filePath: String,
  },
  setup(props, { emit }) {
    const store = useStore();
    const ifhelp = ref(false);
    //const overlayref = ref(); // gives access to component
    const inputTime = ref(null); // variable in component
    const listedTime = ref("");
    const flights_nbRows = ref(0);
    const pty_nbRows = ref(0);
    const station_nbRows = ref(0);
    const flightTable = ref(null);
    const ptyPairTable = ref(null);
    const stationPairTable = ref(null);

    // useKeydown([
    //   {
    //     key: "Escape",
    //     fn: (event) => {
    //       console.log(`Pressed ESC key!`);
    //     },
    //   },
    //   {
    //     key: "h",
    //     fn: (event) => (ifhelp.value = ifhelp.value === false ? true : false),
    //   },
    // ]);

    // const toggle = (event) => {
    //   // console.log("inside toggle()"); // reached
    //   // u.print("event", event);
    // };

    // const load = new l.LoadTable("./data/bookings_oneday.json");

    // const arrStatusStyle = (data) => {
    //   return data.arrStatus === "LATE" ? "color: red" : "color: green";
    // };
    // const inFlightStyle = (data) => {
    //   return data.inFlight === "AIR" ? "color: green" : "color: red";
    // };
    // const arrDelayStyle = (data) => {
    //   return `color:${data.arrDelayColor}`;
    // };
    // const depDelayStyle = (data) => {
    //   return `color:${data.depDelayColor}`;
    // };

    // const rotStyle = (rotData) => {
    //   const col = rotData < 45 ? "green" : "red";
    //   return `color:${col}`;
    // };

    // saveOnce, saveAtIntervals, should be called from a single file for it
    // to work properly in order to periodically update tables
    saveOnce(2);
    //saveAtIntervals(3); // Retrieves data at fixed intervals

    watchEffect(() => {
      // const data = 0;
      if (getStatus.value > 0) {
        const data = getEndPointFilesComputed;
        // u.print("===> data, watchEffect", data.value);
        // u.print("===> data, flightTable", data.value.flightTable);
        flightTable.value = data.value.flightTable;
        flights_nbRows.value = flightTable.value.length;

        const flightIdMap = u.createMapping(flightTable.value, "id");

        const ptyPairs = data.value.ptyPairs;
        ptyPairs.forEach((r) => {
          r.fltnumPair = r.flt_num_f + " - " + r.flt_num_nf;
        });
        ptyPairTable.value = ptyPairs;
        pty_nbRows.value = ptyPairs.length;

        const stationPairs = data.value.stationPairs;
        const stationIdPairs = [];
        stationPairs.forEach((r) => {
          const row_f = flightIdMap[r.id_f];
          const row_nf = flightIdMap[r.id_nf];
          u.print("row_f", row_f);
          u.print("row_nf", row_nf);
          const row = {
            orig_f: row_f.orig,
            dest_f: row_f.dest,
            dest_nf: row_nf.dest,
            sch_dep_z_f: row_f.sch_dep_z,
            sch_dep_z_nf: row_nf.sch_dep_z,
            sch_arr_z_f: row_f.sch_arr_z,
            sch_arr_z_nf: row_nf.sch_arr_z,
            tail: row_f.tail,
            fltnumPair: row_f.fltnum + " - " + row_nf.fltnum,
            est_rotation: -1,
          };
          stationIdPairs.push(row);
          // row.fltnumPair = r.flt_num_f + " - " + r.flt_num_nf;
        });
        stationPairTable.value = stationIdPairs;
        station_nbRows.value = stationIdPairs.length;
        u.print("==> stationPairs", stationPairs);
        u.print("==> flightIdMap", flightIdMap);
      }
    });

    // watch(load.isDataLoaded(), (curVal, old) => {
    //   flightsInAir("2019-10-01", "14:00");
    // });

    // function flightsInAir(dtz, tmz) {
    //   const timeShift = 8;
    //   const nodes = load.data()[0].nodes;
    //   // ANALYZE and FIX. Then clean.
    //   const { keptFlights } = f.flightsInAir(nodes, dtz, tmz, timeShift);
    //   flightTable.value = keptFlights;
    //   nbRows.value = keptFlights.length;
    // }

    //onMounted(() => {
    //console.log(">>>>> FlightInAir, Inside onMounted (this) <<<<<");
    //});

    // const confirmEntry = () => {
    //   flightsInAir("2019-10-01", inputTime.value);
    //   listedTime.value = inputTime.value;
    // };

    return {
      ifhelp,
      flightTable,
      ptyPairTable,
      stationPairTable,
      //nodes,
      inputTime,
      listedTime,
      flights_nbRows,
      pty_nbRows,
      station_nbRows,
      // confirmEntry,
      // arrStatusStyle,
      // inFlightStyle,
      // arrDelayStyle,
      // depDelayStyle,
      // rotStyle,
      //overlayref,
    };
  },
};
</script>
