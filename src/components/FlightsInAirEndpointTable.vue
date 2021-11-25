<!-- Display data from Endpoint. Use a watchEffect to check whether endpoint data is 
available for display. Perhaps add a date/nb_days as possible input to control what
is returned from the endpoint. -->

<template>
  <h2>Flights in Air using Endpoint</h2>
  <h3>Time of day (Zulu): {{ listedTime }}, {{ nbRows }} entries</h3>

  <FlightsInAirHelp show-help="false" />

  <DataTable :value="flightsTable" :scrollable="true" scrollHeight="500px">
    <template #header>
      <span>Time of day: </span>
      <!-- Only show when table is visible -->
      <!-- What is type=? -->
      <InputText type="text" v-model="inputTime" />
      <!-- v-on:keyup.enter="confirmEntry" -->
      <!-- Consider a set of checkboxes to turn columns on and off -->
      <span>City (for graph): </span>
      <InputText type="text" v-model="inputCity" />
    </template>
    <Column field="id" :sortable="true" style="display: none;"> </Column>
    <Column field="orig" header="Org" :sortable="true" :style="col"> </Column>
    <Column field="dest" header="Dst" :sortable="true"> </Column>
    <Column field="fltnum" header="Flt #" :sortable="true"> </Column>
    <Column field="status0" header="statusPair" :sortable="true"> </Column>
    <Column field="status" header="status" :sortable="true"> </Column>
    <Column field="sch_dep_z" header="sch_dep" :sortable="true"> </Column>
    <Column field="sch_arr_z" header="sch_arr" :sortable="true"> </Column>
    <Column field="eta" header="ETA" :sortable="true"> </Column>
  </DataTable>

  <DataTable :value="ptyPairsTable" :scrollable="true" scrollHeight="500px">
    <template #header>
      <span>Time of day: </span>
      <!-- Only show when table is visible -->
      <!-- What is type=? -->
      <InputText type="text" v-model="inputTime" />
      <!-- v-on:keyup.enter="confirmEntry" -->
      <!-- Consider a set of checkboxes to turn columns on and off -->
      <span>City (for graph): </span>
      <InputText type="text" v-model="inputCity" />
    </template>
    <Column field="id" :sortable="true" style="display: none;"> </Column>
    <Column field="orig" header="Org" :sortable="true" :style="col"> </Column>
    <Column field="dest" header="Dst" :sortable="true"> </Column>
    <Column field="fltnum" header="Flt #" :sortable="true"> </Column>
    <Column field="status0" header="statusPair" :sortable="true"> </Column>
    <Column field="status" header="status" :sortable="true"> </Column>
    <Column field="sch_dep_z" header="sch_dep" :sortable="true"> </Column>
    <Column field="sch_arr_z" header="sch_arr" :sortable="true"> </Column>
    <Column field="eta" header="ETA" :sortable="true"> </Column>
  </DataTable>

  <DataTable :value="stationPairsTable" :scrollable="true" scrollHeight="500px">
    <template #header>
      <span>Time of day: </span>
      <!-- Only show when table is visible -->
      <!-- What is type=? -->
      <InputText type="text" v-model="inputTime" />
      <!-- v-on:keyup.enter="confirmEntry" -->
      <!-- Consider a set of checkboxes to turn columns on and off -->
      <span>City (for graph): </span>
      <InputText type="text" v-model="inputCity" />
    </template>
    <Column field="id" :sortable="true" style="display: none;"> </Column>
    <Column field="orig" header="Org" :sortable="true" :style="col"> </Column>
    <Column field="dest" header="Dst" :sortable="true"> </Column>
    <Column field="fltnum" header="Flt #" :sortable="true"> </Column>
    <Column field="status0" header="statusPair" :sortable="true"> </Column>
    <Column field="status" header="status" :sortable="true"> </Column>
    <Column field="sch_dep_z" header="sch_dep" :sortable="true"> </Column>
    <Column field="sch_arr_z" header="sch_arr" :sortable="true"> </Column>
    <Column field="eta" header="ETA" :sortable="true"> </Column>
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
    const nbRows = ref(0);
    const flightsTable = ref(null);
    const ptyPairsTable = ref(null);
    const stationPairsTable = ref(null);

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
    // saveOnce(2);
    saveAtIntervals(3); // Retrieves data at fixed intervals

    watchEffect(() => {
      // const data = 0;
      if (getStatus.value > 0) {
        const data = getEndPointFilesComputed;
        // u.print("===> data, watchEffect", data.value);
        // u.print("===> data, flightsTable", data.value.flightsTable);
        flightsTable.value = data.value.flightTable;
        ptyPairsTable.value = data.value.ptyPairs;
        stationPairsTable.value = data.value.stationPairs;
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
    //   flightsTable.value = keptFlights;
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
      flightsTable,
      //nodes,
      inputTime,
      listedTime,
      nbRows,
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
