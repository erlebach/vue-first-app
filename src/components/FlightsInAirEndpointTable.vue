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
      <h5>Advanced with Templating, Filtering and Multiple Selection</h5>
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
  <!-- ---------------------------------------------------------- -->
  <DataTable
    :value="allPairsRef.table"
    :scrollable="true"
    resizableColumns="true"
    scrollHeight="300px"
    expandedRows="expandedRows"
    columnResizeMode="expand"
    v-model:selection="selectedAllPairsRow"
    selectionMode="single"
    dataKey="id_f"
  >
    <!-- row-click="rowClick" -->
    :rowHover="true"
    <!-- stateStorage and stateKey not saving column size across invocations -->
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
      <InputText type="text" v-model.trim="initialId" style="width: 3in;" />
      <!-- ListBox gives "No available options" -->
      <span>Enter </span>
      <!-- I want the left box to the right of last span -->
      <ListBox
        v-model="selectedFlightIds"
        :options="flightIds"
        :multiple="false"
        :filter="true"
        optionLabel="name"
        listStyle="max-height:100px"
        style="width:2.0in"
        filterPlaceholder="Origin City Search"
      >
        <template #option="slotProps">
          <div class="name-item">
            <div>{{ slotProps.option.name }}</div>
          </div>
        </template>
      </ListBox>
      <h2>{{ selectedFlightIds }}</h2>
      <!-- remove when done -->
    </template>
    <Column
      field="id_f"
      header="In id (clickable)"
      :sortable="true"
      header-style="width:4in;"
      style="width:4in;"
    >
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

    <Column field="sch_dep_z_f" header="sch_dep_f (Z)" :sortable="true">
    </Column>
    <Column field="sch_arr_z_f" header="sch_arr_f (Z)" :sortable="true">
    </Column>
    <Column field="est_rotation" header="estRot(min)" :sortable="true">
    </Column>
    <Column field="sch_dep_z_nf" header="sch_dep_nf (Z)" :sortable="true">
    </Column>
    <Column field="sch_arr_z_nf" header="sch_arr_nf (Z)" :sortable="true">
    </Column>
    <Column field="level" header="level" :sortable="true"> </Column>
    <Column field="arr_delay" header="EADelay (min)" :sortable="true"> </Column>
  </DataTable>

  <!-- start with hidden graph. Show when graph created -->
  <div>
    <h2>Endpoint Graph (based on {{ allPairsRef.city }})</h2>
    <div id="GETooltipId" class="GETooltipId"></div>
    <div id="mountEndpointsGraph"></div>
  </div>
  <!-- Add a panel surrounding the radio buttons -->
  <!-- <span width="200"> -->
  <div class="p-d-flex flex-start">
    <Panel
      class="dark-panel"
      header="# Tiers"
      :toggleable="true"
      :collapsed="false"
    >
      <div>
        <div class="p-field-radiobutton">
          <RadioButton id="tier2" name="tiers" value="2" v-model="tiers" />
          <label for="tier2">2</label>
        </div>
        <div class="p-field-radiobutton">
          <RadioButton id="tier3" name="tiers" value="3" v-model="tiers" />
          <label for="tier3">3</label>
        </div>
        <div class="p-field-radiobutton">
          <RadioButton id="tier3" name="tiers" value="4" v-model="tiers" />
          <label for="tier3">4</label>
        </div>
        <div class="p-field-radiobutton">
          <RadioButton id="tier3" name="tiers" value="5" v-model="tiers" />
          <label for="tier3">5</label>
        </div>
      </div>
    </Panel>
  </div>

  <!-- ------------------------------------------------------------------------ -->

  <DataTable
    :value="flightsInAirRef.table"
    :scrollable="true"
    resizableColumns="true"
    scrollHeight="300px"
  >
    <template #header>
      <h2>
        Feeders Not Landed (endpoint),
        {{ flightsInAirRef.nbRows }} entries
      </h2>
      <span>Time of day: </span>
      <!-- Only show when table is visible -->
      <!-- What is type=? -->
      <InputText type="text" v-model.trim="flightsInAirRef.time" />
      <!-- v-on:keyup.enter="confirmEntry" -->
      <!-- Consider a set of checkboxes to turn columns on and off -->
      <span>City (for graph): </span>
      <InputText type="text" v-model.trim="flightsInAirRef.city" />
      <span>Initial Id to propagate: </span>
      <InputText type="text" v-model.trim="initialId" style="width: 3in;" />
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
    <Column field="status_f" header="Status In" :sortable="true"> </Column>
    <Column field="status_nf" header="Status Out" :sortable="true"> </Column>
    <Column field="tail" header="Tail" :sortable="true"> </Column>

    <Column field="sch_dep_z_f" header="sch_dep_f" :sortable="true"> </Column>
    <Column field="sch_arr_z_f" header="sch_arr_f" :sortable="true"> </Column>
    <Column field="est_rotation" header="estRot(min)" :sortable="true">
    </Column>
    <Column field="sch_dep_z_nf" header="sch_dep_nf" :sortable="true"> </Column>
    <Column field="sch_arr_z_nf" header="sch_arr_nf" :sortable="true"> </Column>
  </DataTable>
  <!-- ------------------------------------------------------------------------ -->

  <div>
    <h2>Connections Graph (based on {{ allPairsRef.city }})</h2>
    <div id="GEConnectionsToolTip"></div>
    <div id="mountConnectionsGraph"></div>
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
import ListBox from "primevue/listbox";
import Column from "primevue/column";
import Panel from "primevue/panel";
import RadioButton from "primevue/radiobutton";
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
import { boundingBox } from "../Composition/graphImpl.js";
import * as tier from "../Composition/RigidTierref.js";

function centerGraph(graph) {
  //const layout = graph.get("layout");
  boundingBox(graph);
  // Must render in order to x,y coordinates
  // "group" not defined
  const bbox = graph.get("group").getCanvasBBox();
  graph.fitView(); // Not clear this is required
  graph.render(); // Not clear this is required
}

function listCities(flightTable, flightIds) {
  // List all cities among flights in air
  const cities_orig = u.getAttributeUnique(flightTable, "orig");
  // const cities_dest = u.getAttributeUnique(flightTable, "dest");
  // console.log(
  //   `cities, orig: ${cities_orig.length}, dest: ${cities_dest.length}`
  // );
  const names = [];
  cities_orig.forEach((r) => {
    names.push({ name: r });
  });
  flightIds.value = names;
}

// function rowClick() {
//   console.log("row-click");
// }

function propagateData(dataRef, initialId) {
  // u.print("inside propagateData, data: ", dataRef.value);
  const {
    flightTable,
    inboundsMap,
    outboundsMap,
    allPairs,
    ptyPairs,
    stationPairs,
  } = dataRef.value;

  console.log("==============================================================");
  console.log("==============================================================");

  [
    flightTable,
    inboundsMap,
    outboundsMap,
    ptyPairs,
    stationPairs,
    allPairs,
  ].forEach((e) => {
    console.log(`Length of flight arrays from data: ${e.length}`);
  });

  u.print("InitialId: ", initialId);
  console.log(`InitialId: ${initialId}`);

  const delayObj = computePropagationDelays(
    flightTable,
    inboundsMap,
    outboundsMap,
    ptyPairs,
    stationPairs,
    allPairs,
    initialId
  );

  return delayObj;
}

export default {
  components: {
    ListBox,
    DataTable,
    Column,
    InputText,
    FlightsInAirHelp,
    RadioButton,
    Panel,
  },
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
    let endpointsGraphCreated = false;
    let graph = null;
    let endpointsGraph = null;
    const showGraph = ref(null);
    const selectedFlightIds = ref();
    const flightIds = ref(undefined);
    // rows of AllPairs table are selectable
    const selectedAllPairsRow = ref(undefined);
    const tiers = ref("3");

    const flightsRef = reactive({
      nbRows: 0,
      table: null,
      city: null,
      cityEntered: null,
      timeEntered: null,
      initialId: null,
    });

    const flightsInAirRef = reactive({
      nbRows: 0,
      table: null,
      city: null,
      cityEntered: null,
      timeEntered: null,
      initialId: null,
    });

    const allPairsRef = reactive({
      nbRows: 0,
      table: null,
      city: "PUJ", // Initializing the city generates a bug
      time: "10:00",
      cityEntered: "",
      timeEntered: null,
      initialId: null,
    });

    const initialId = ref("2021-11-28MIAPTY10:130173"); // Select automatically else date will be wrong

    const connectionConfiguration = dp.setupConfiguration({
      container: "mountConnectionsGraph",
      width: props.width,
      height: props.height,
      defaultNodeSize: 40,
    });

    const endpointConfiguration = dp.setupConfiguration({
      container: "mountEndpointsGraph",
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

    watch([selectedAllPairsRow, tier.getTier], ([row, nbTiers], o) => {
      // console.log("selected row: ", selectedAllPairsRow.value);
      // console.log("before getBEndPointFilesComputed");
      const data = getEndPointFilesComputed;
      // u.print("row", row);
      const initialId = row.id_f;
      // u.print("data", data);
      // console.log(`before propagateData, initialId: ${initialId}`);
      // u.print("before propagateData, data: ", data.valiue);
      const delayObj = propagateData(data, initialId); // args: ref, value
      // u.print("==> table: ", table);
      // From this row, construct the rigid model
      //console.log("selected row: ", row);

      // NEXT STEP: draw   graphRigidModel
      drawGraphRigidModel(delayObj, nbTiers);
    });
    // saveOnce, saveAtIntervals, should be called from a single file for it
    // to work properly in order to periodically update tables
    saveOnce(1);
    //saveAtIntervals(3); // Retrieves data at fixed intervals

    function defineNodes(city, edges, flights, nb_tiers) {
      const nodes = [];
      const ids = [];

      //    obj.nodes.forEach((e) => {
      // if (obj.id2level[e.id] < nb_tiers) {
      //   nodes.push({
      //     id: e.id,

      edges.forEach((e) => {
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
        const row = flightIds[id];
        nodes.push(row);
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

    // watchEffect(() => {
    watch(getStatus, (status) => {
      if (status > 0) {
        u.print("allPairsref", allPairsRef);
        if (checkEntries(allPairsRef)) {
          if (flightsRef) {
            flightsRef.city = allPairsRef.city;
            flightsRef.time = allPairsRef.time;
            console.log("===> after checkEntries allPairsRef");
            const data = getEndPointFilesComputed.value;
            listCities(data.flightTable, flightIds);
            const city = allPairsRef.city.toUpperCase();
            // console.log(`before drawGraph(city, data, city: ${city}`);
            // u.print("data", data);
            drawGraph(city, data);
          }
        }
      }
      // Perhaps setStatus(false)? But that would start the watchEffect again, so bad idea.
    });

    onMounted(() => {
      console.log("Component is mounted");
    });

    function drawGraph(city, data) {
      console.log("inside drawGraph");
      const nb_tiers = 0; // not used
      const flights = data.flightTable;
      const allPairs = data.allPairs;

      const flightIdMap = u.createMapping(flights, "id");
      // I should combine ptyPairs with stationPairs to create allPairs array
      const edges = defineEdges(city, allPairs, nb_tiers);
      const nodes = defineNodes(city, edges, flights, nb_tiers);
      u.print("drawGraph, nodes", nodes);
      u.print("drawGraph, edges", edges);

      // There MUST be a way to update edges and nodes WITHOUT destroying and recreating the graph (inefficient)
      if (graphCreated) {
        graph.clear(); // difference with destroy?
        // graph.destroy();
      } else {
        graph = new G6.Graph(connectionConfiguration);
        graphCreated = true;
      }

      // QUESTION: with clear(), the tooltips stay. However, the graph
      // is translated downward. WHY?

      // This element must be mounted before creating the graph
      graph.data({ nodes, edges });
      graph.render();
      u.print("drawGraph, graph", graph);

      // for nodes: need: departureDelayP, arrDelayP
      // for edges: need: ACTAvailableP

      dp.colorByCity(graph);
      graph.render(); // not sure required

      dp.assignNodeLabelsNew(graph);
      graph.render();
      return;
    }

    function drawGraphRigidModel(delayObj, nbTiers) {
      const { nodes, edges, graphEdges, id2Level, level2ids, table } = delayObj;
      u.print("==> drawGraphRigidModel, delayObj", delayObj);
      u.print("==> level2ids", level2ids);
      u.print("==> id2Level", id2Level);
      console.log(`==> nbTiers: ${nbTiers}`);
      console.log("inside drawGraphRigidModel");
      const nb_tiers = 0; // not used
      // const flights = data.flightTable;
      // const allPairs = data.allPairs;

      // Extract ids for levels 0 throught level_max
      const max_levels = 6;
      const dataPerLevel = {};

      // Extract the ids for each level
      for (let level = 0; level < max_levels; level++) {
        dataPerLevel[level] = u.getRowsWithAttribute(table, "level", level);
        u.print(`==> dataPerLevel[${level}]`, dataPerLevel[level]);
      }

      // Construct the edges of the full graph, starting with level zero node
      const gNodes = [];
      const gEdges = [];

      nodes.forEach((r) => {
        r.x = 0;
        r.y = 0;
        gNodes.push(r);
      });

      edges.forEach((r) => {
        gEdges.push(r);
        r.source = r.id_f;
        r.target = r.id_nf;
        r.id = r.id_f + r.id_nf; // perhaps temporary?
      });
      u.print("gEdges", gEdges);
      u.print("gNodes", gNodes);

      u.checkEdgesDirection(gEdges, "check wrong order");

      // edges always go from level to (level+1)

      for (let level = 0; level < max_levels; level++) {
        // comment
      }

      // The levels seem ok. Now I must graph them.
      // Once the graph is made, return to rigid model and check the delay propagation value. They do not look correct.

      // --------------------------
      // This data is a list of flights, i.e. nodes of a graph

      // const flightIdMap = u.createMapping(flights, "id");
      // // I should combine ptyPairs with stationPairs to create allPairs array
      // const edges = defineEdges(city, allPairs, nb_tiers);
      // const nodes = defineNodes(city, edges, flights, nb_tiers);

      // Create two functions: remove all nodes and edges
      // Add new nodes and edges

      // TODO (date2021-1)
      // These two functions should redraw the graph in the same canvas
      // function removeNodesEdges(graph)
      // (nodes, edges are two arrays)
      // function addNodesEdges(graph, nodes, edges)

      // There MUST be a way to update edges and nodes WITHOUT destroying and recreating the graph (inefficient)
      if (endpointsGraphCreated) {
        // removes all nodes and edges. Leaves configuration intact
        endpointsGraph.clear();
      } else {
        endpointsGraph = new G6.Graph(endpointConfiguration); // ERROR
        endpointsGraphCreated = true;
      }

      // This element must be mounted before creating the graph
      const data = { nodes: gNodes, edges: gEdges.slice(0) };
      // endpointsGraph.data(data);
      endpointsGraph.read(data); // combines data and render
      // endpointsGraph.refresh(); // not helping with tooltip problem
      endpointsGraph.render();
      endpointsGraph.fitView(); //   View and Center do not work
      endpointsGraph.fitCenter();
      centerGraph(endpointsGraph);
      endpointsGraph.render();
      // endpointsGraph.refreshLayout(true); // does not seem to work
      u.print("endpointsGraph", endpointsGraph);
      // endpointsGraph.render();

      // for nodes: need: departureDelayP, arrDelayP
      // for edges: need: ACTAvailableP

      // centerGraph(endpointsGraph);

      dp.colorByCity(endpointsGraph);
      endpointsGraph.render(); // not sure required

      dp.assignNodeLabelsNew(endpointsGraph); // Generates Maximum call stack size exceeded!!!!!
      endpointsGraph.render();
      return;
    }

    watch(selectedFlightIds, (ids) => {
      const data = getEndPointFilesComputed;
      // u.print("before listCities");
      // u.print("flightTable", data.value);
      // u.print("selectedFlightIds.value", selectedFlightIds.value);
      const flightTable = data.value.flightTable;
      const allPairs = data.value.allPairs;
      u.print("allPairs", allPairs);
      if (ids === null) {
        console.log("ids is null!!! SHOULD NOT HAPPEN");
      } else {
        u.print("ids.name", ids.name);

        const table = u.getRowsWithAttribute(allPairs, "orig_f", ids.name);

        // const table = propagateData(data, initialId); // ref, ref

        u.print("table", table);
        allPairsRef.city = ids.name;
        allPairsRef.table = table;
        // u.print("return table: ", table);
      }
    });

    watchEffect(() => {
      // u.print("watcheffect, getStatus", getStatus.value);
      if (getStatus.value > 0) {
        const data = getEndPointFilesComputed;
        u.print("==> data", data.value);
        // u.print("getStatus > 0, data: ", data.value);

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
            arr_delay: (row_f.eta - row_f.sch_arr) / 60000,
          };
          stationIdPairs.push(row);
        });

        const allPairs = data.value.allPairs;
        allPairsRef.table = allPairs;
        allPairsRef.nbRows = allPairs.length;
        console.log(`Update allPairsRef, ${allPairs.length}`);

        flightsInAirRef.table = allPairs; // Change later
        flightsInAirRef.nbRows = allPairs.length; // Change later
      }
    });

    return {
      ifhelp,
      flightsRef,
      allPairsRef,
      flightsInAirRef,
      inputTime,
      listedTime,
      initialId,
      selectedFlightIds,
      flightIds,
      selectedAllPairsRow,
      tiers,
    };
  },
};
</script>

<style scoped>
#initialId {
  width: 200rem;
}
</style>
