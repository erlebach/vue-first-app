<!-- Display data from Endpoint. Use a watchEffect to check whether endpoint data is 
available for display. Perhaps add a date/nb_days as possible input to control what
is returned from the endpoint. -->

<template>
  <FlightsInAirHelp show-help="false" />

  <DataTable
    :value="flightsRef.table"
    :scrollable="true"
    resizableColumns="true"
    scrollHeight="300px"
  >
    <template #header>
      <h2>Flights (endpoint), {{ flightsRef.nbRows }} entries</h2>
      <span>Time of day (Zulu): </span>
      <!-- Only show when table is visible -->
      <!-- What is type=? -->
      <InputText type="text" v-model.trim="flightsRef.time" />
      <!-- v-on:keyup.enter="confirmEntry" -->
      <!-- Consider a set of checkboxes to turn columns on and off -->
      <span>City (for graph): </span>
      <InputText type="text" v-model.trim="flightsRef.city" />
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
    :value="allPairsRef.table"
    :scrollable="true"
    :resizableColumns="true"
    scrollHeight="300px"
  >
    <template #header>
      <h2>
        All Flight Pairs through (endpoint), {{ allPairsRef.nbRows }} entries
      </h2>
      <span>Time of day: </span>
      <!-- Only show when table is visible -->
      <!-- What is type=? -->
      <InputText type="text" v-model.trim="allPairsRef.time" />
      <!-- v-on:keyup.enter="confirmEntry" -->
      <!-- Consider a set of checkboxes to turn columns on and off -->
      <span>City (for graph): </span>
      <InputText type="text" v-model.trim="allPairsRef.city" />
      <span>Initial Id to propagate: </span>
      <InputText type="text" v-model.trim="initialId" />
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

  <!-- start with hidden graph. Show when graph created -->
  <div>
    <h2>Endpoint Graph (based on {{ allPairsRef.city }})</h2>
    <div id="GEConnectionsToolTip"></div>
    <div id="mountEndPointGraph"></div>
  </div>
</template>

<script>
import { convertCopaData } from "../Composition/graphSupport.js";
import * as l from "../Composition/loadTableClass.js";
import * as f from "../Composition/FlightsInAir.js";
import { IO_works, ensureConditionIsMet } from "../Composition/IO_works.js";
import ModalView from "./ModalView.vue";
import { findCityInCityMap, filterData } from "../Composition/graphSupport";
import { onMounted } from "vue";
import { useKeydown } from "../Composition/useKeydown.js";
import FlightsInAirHelp from "./FlightsInAirHelp.vue";
import * as u from "../Composition/utils.js";
import { ref, reactive, isReactive, computed, watch, watchEffect } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import G6 from "@antv/g6";
// I should factor all the graph routines into a single function called commonGraphImpl.js
import * as dp from "../Composition/delayPropagationGraphImpl.js";
//import { colorByCity } from "../Composition/graphImpl";
import { useStore } from "vuex";
import {
  setStatus,
  getStatus,
  saveAtIntervals,
  saveOnce,
  getEndpointFiles,
  getEndPointFilesComputed,
} from "../Composition/text-processing.js";
import { computePropagationDelays } from "../Composition/endPointLibrary.js";

export default {
  components: { DataTable, Column, InputText, FlightsInAirHelp },
  props: {
    filePath: String,
    width: Number,
    height: Number,
  },
  setup(props, { emit }) {
    //const store = useStore();
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
    let graphCreated = false;
    let graph = null;
    const showGraph = ref(null);

    const flightsRef = reactive({
      nbRows: 0,
      table: null,
      city: null,
      cityEntered: null,
      timeEntered: null,
    });

    // const ptyPairsRef = reactive({
    //   nbRows: 0,
    //   table: null,
    //   city: null,
    //   time: null,
    //   cityEntered: null,
    //   timeEntered: null,
    // });

    // const stationPairsRef = reactive({
    //   nbRows: 0,
    //   table: null,
    //   city: null,
    //   time: null,
    //   cityEntered: null,
    //   timeEntered: null,
    // });

    const allPairsRef = reactive({
      nbRows: 0,
      table: null,
      city: "PUJ", // Initializing the city generates a bug
      time: "10:00",
      cityEntered: "",
      timeEntered: null,
    });

    const initialId = ref(null);

    const configuration = dp.setupConfiguration({
      container: "mountEndPointGraph",
      width: props.width,
      height: props.height,
      defaultNodeSize: 40,
    });

    function checkCity(city) {
      return city && city.length === 3;
    }

    function checkTime(time) {
      return time && time.length == 5 && u.checkTime(time);
    }

    function checkEntries(tableRef) {
      return checkCity(tableRef.city) && checkTime(tableRef.time);
    }

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
    saveOnce(1);
    //saveAtIntervals(3); // Retrieves data at fixed intervals

    function defineNodes(city, edges, flights, nb_tiers) {
      const nodes = [];
      const ids = [];
      edges.forEach((e) => {
        // u.print("e", e);
        ids.push(e.source);
        ids.push(e.target);
      });
      const flightIds = u.createMapping(flights, "id");
      // All nodes have degree two
      // u.print("ids", ids);
      // u.print("flightIds", flightIds);
      ids.forEach((id) => {
        // if (obj.id2level[e.id] < nb_tiers) {
        // if (city === e.orig || city === e.dest) {
        // u.print("id/e", id);
        nodes.push(flightIds[id]);
        // }
      });
      return nodes;
    }

    function defineEdges(city, obj, nb_tiers) {
      u.print("defineEdges, obj", obj);
      const edges = [];
      obj.forEach((e) => {
        // console.log(`${city}, ${e.orig_f}, ${e.dest_f}, ${e.dest_nf}`);
        if (city === e.orig_f || city === e.dest_f || city === e.dest_nf) {
          edges.push({
            source: e.id_f,
            target: e.id_nf,
            orig_f: e.orig_f,
            orig_nf: e.orig_nf,
            dest_f: e.dest_f,
            dest_nf: e.dest_nf,
            ACTSlack: e.ACTSlack,
            ACTSlackP: e.ACTSlackP,
            ACTAvailable: e.ACTAvailable,
            ACTAvailableP: e.ACTAvailableP,
            inDegree: e.inDegree,
            outDegree: e.outDegree,
            pax: e.pax,
            rotSlackP: e.rotSlackP,
          });
        }
      });
      return edges;
    }

    watchEffect(() => {
      if (getStatus.value > 0) {
        u.print("allPairsref", allPairsRef);
        if (checkEntries(allPairsRef)) {
          if (flightsRef) {
            flightsRef.city = allPairsRef.city;
            flightsRef.time = allPairsRef.time;
            console.log("===> after checkEntries allPairsRef");
            const data = getEndPointFilesComputed.value;
            const city = allPairsRef.city.toUpperCase();
            // console.log(`before drawGraph(city, data, city: ${city}`);
            // u.print("data", data);
            drawGraph(city, data);
          }
        }
      }
      // Perhaps setStatus(false)? But that would start the watchEffect again, so bad idea.
    });

    function drawGraph(city, data) {
      console.log("inside EndPoint draawGraph");
      const nb_tiers = 0; // not used
      const flights = data.flightTable;
      const allPairs = data.allPairs;

      const flightIdMap = u.createMapping(flights, "id");
      // I should combine ptyPairs with stationPairs to create allPairs array
      const edges = defineEdges(city, allPairs, nb_tiers);
      const nodes = defineNodes(city, edges, flights, nb_tiers);

      // There MUST be a way to update edges and nodes WITHOUT destroying and recreating the graph (inefficient)
      if (graphCreated) {
        graph.destroy();
      }
      graph = new G6.Graph(configuration);
      graphCreated = true;

      // This element must be mounted before creating the graph
      graph.data({ nodes, edges });
      graph.render();

      // for nodes: need: departureDelayP, arrDelayP
      // for edges: need: ACTAvailableP

      dp.colorByCity(graph);
      graph.render(); // not sure required

      dp.assignNodeLabelsNew(graph);
      graph.render();
      return;
    }

    watchEffect(() => {
      // u.print("watcheffect, getStatus", getStatus.value);
      if (getStatus.value > 0) {
        const data = getEndPointFilesComputed;
        // u.print("getStatus > 0, data: ", data.value);

        u.print("==> data", data.value);
        flightsRef.table = data.value.flightTable;
        flightsRef.nbRows = data.value.flightTable.length;

        const flightIdMap = u.createMapping(data.value.flightTable, "id");

        const ptyPairs = data.value.ptyPairs;
        ptyPairs.forEach((r) => {
          r.fltnumPair = r.flt_num_f + " - " + r.flt_num_nf;
        });

        // ptyPairsRef.table = ptyPairs;
        // ptyPairsRef.nbRows = ptyPairs.length;

        const stationPairs = data.value.stationPairs;
        const stationIdPairs = [];
        stationPairs.forEach((r) => {
          const row_f = flightIdMap[r.id_f];
          const row_nf = flightIdMap[r.id_nf];
          const row = {
            orig_f: row_f.orig,
            dest_f: row_f.dest,
            dest_nf: row_nf.dest,
            sch_dep_z_f: row_f.sch_dep_z,
            sch_dep_z_nf: row_nf.sch_dep_z,
            sch_arr_z_f: row_f.sch_arr_z,
            sch_arr_z_nf: row_nf.sch_arr_z,
            status_f: row_f.status,
            status_nf: row_nf.status,
            tail: row_f.tail,
            fltnumPair: row_f.fltnum + " - " + row_nf.fltnum,
            est_rotation: -1, // MUST FIX
          };
          stationIdPairs.push(row);
        });

        // stationPairsRef.table = stationIdPairs;
        // stationPairsRef.nbRows = stationIdPairs.length;

        const allPairs = data.value.allPairs;
        allPairsRef.table = allPairs;
        allPairsRef.nbRows = allPairs.length;

        const { flightTable, inboundsMap, outboundsMap } = data.value;

        const table = computePropagationDelays(
          flightTable,
          inboundsMap,
          outboundsMap,
          ptyPairs,
          stationPairs,
          allPairs,
          initialId.value
        );
      }
    });

    return {
      ifhelp,
      flightsRef,
      allPairsRef,
      inputTime,
      listedTime,
      initialId,
    };
  },
};
</script>
