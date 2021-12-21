<!-- Display data from Endpoint. Use a watchEffect to check whether endpoint data is 
available for display. Perhaps add a date/nb_days as possible input to control what
is returned from the endpoint. -->

<template>
  <FlightsInAirHelp show-help="false" />

  <!-- change display to visible to show the datatable -->
  <DataTable
    style="display:none;"
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
        (table obtained from text-processing.js)
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
    <!--
      Distinguish EADelay (Estimated arrival delays), based on ETA versus
    actual arrival delay (based on IN for plans that landed).
    Before performing any rigid model analysis, the arrival delays should
    either be based on IN/OUT/ETA, or undefined (if the plane is on the
        ground or there is no ETA (in the air) or IN (plane landed)
    This calculation is performed in text-processing.js
    -->
    <Column field="arrDelay_f" header="EADelay_f (min)" :sortable="true">
    </Column>
    <Column field="arrDelay_nf" header="EADelay_nf (min)" :sortable="true">
    </Column>
    <Column field="eta_f" header="eta_f" :sortable="true"> </Column>
    <Column field="eta_nf" header="eta_nf" :sortable="true"> </Column>
  </DataTable>

  <!-- start with hidden graph. Show when graph created -->
  <!-- Add a panel surrounding the radio buttons -->
  <!-- <span width="200"> -->
  <div>
    <h2>Endpoint Graph (based on {{ allPairsRef.city }})</h2>
    <!-- style propagated to text box, but not to panel -->
    <!-- <div class="p-d-flex flex-start" style="font-size:8ex;color:red"> -->
    <div class="p-d-flex start">
      <!-- style below acts on header style. I do not fully understand how this works. -->
      <div>
        <!-- <div> needed so that the border is not determined by the flex-style -->
        <Panel
          class="dark-panel p-panel-title"
          :toggleable="true"
          :collapsed="false"
          style="font-size:1em;"
        >
          <!-- <template #header style="font-size: 0.2em"> # tiers</template> -->
          <template #header><h2># tiers</h2></template>
          <!-- <h3># Tiers</h3> -->
          <div style="{height:5em}">
            <div class="p-field-radiobutton">
              <!-- Tier label correspondss to edges in maximum route length. -->
              <!-- Tier value corresponds to the number of nodes in a route (edge tier + 1) -->
              <RadioButton id="tier2" name="tiers" value="2" v-model="tiers" />
              <label for="tier2">1</label>
            </div>
            <div class="p-field-radiobutton">
              <RadioButton id="tier3" name="tiers" value="3" v-model="tiers" />
              <label for="tier3">2</label>
            </div>
            <div class="p-field-radiobutton">
              <RadioButton id="tier4" name="tiers" value="4" v-model="tiers" />
              <label for="tier4">3</label>
            </div>
            <div class="p-field-radiobutton">
              <RadioButton id="tier5" name="tiers" value="5" v-model="tiers" />
              <label for="tier5">4</label>
            </div>
            <div class="p-field-radiobutton">
              <RadioButton id="tier6" name="tiers" value="6" v-model="tiers" />
              <label for="tier6">5</label>
            </div>
          </div>
        </Panel>
      </div>
      <div class="p-field p-col-12 p-md-1" style="color:green">
        <span style="font-size:1em">
          <label for="integeronly"><h2>Arrival Delay (min)</h2></label>
        </span>
        <InputNumber
          id="integeronly"
          v-model="inputArrDelay"
          inputStyle="color:red; width:4em"
        />
        <span style="font-size:1em">
          <label for="integeronly"
            ><h2>Max Arrival Delay to keep(min)</h2></label
          >
        </span>
        <InputNumber
          id="integeronly"
          v-model="maxArrDelayRef"
          inputStyle="color:red; width:4em"
        />
        <div>Nb nodes: {{ infoRef.nbNodes }}</div>
        <div>Nb edges: {{ infoRef.nbEdges }}</div>
        <div>Nb graph edges: {{ infoRef.nbGraphEdges }}</div>
        <div>level2ids: {{ infoRef.level2ids }}</div>
        <div>nbId2level: {{ infoRef.nbId2level }}</div>
      </div>
      <div>
        <div id="GETooltipId" class="GETooltipId"></div>
        <div id="mountEndpointsGraph"></div>
      </div>
    </div>
  </div>

  <!-- ------------------------------------------------------------------------ -->
  <!-- DataTable of results returned from rigidBody -->
  <DataTable
    :value="rigidBodyRef.table"
    :scrollable="true"
    resizableColumns="true"
    scrollHeight="300px"
    expandedRows="expandedRows"
    columnResizeMode="expand"
    v-model:selection="selectedAllPairsRow"
    selectionMode="single"
    dataKey="id_f"
  >
    <template #header>
      <h2>Data from rigid body model</h2>
    </template>
    <Column field="id" header="id" :sortable="true" :style="col"> </Column>
    <Column field="depDelay" header="dep delay" :sortable="true" :style="col">
    </Column>
    <Column field="depDelayP" header="dep delayP" :sortable="true" :style="col">
    </Column>
    <Column field="arrDelay" header="arrDelay" :sortable="true"> </Column>
    <Column field="arrDelayP" header="arrDelayP" :sortable="true"> </Column>
    <Column field="tail" header="Tail" :sortable="true"> </Column>
    <Column field="level" header="Level" :sortable="true"> </Column>

    id: d.id, depDelay: d.depDelay, arrDelay: d.arrDelay, depDelayP:
    d.depDelayP, arrDelayP: d.arrDelayP, tail: d.TAIL, level: id2level[d.id],
  </DataTable>
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
import InputNumber from "primevue/inputnumber";
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
// refactored to no recompute unnecessary data
import { computePropagationDelays } from "../Composition/endPointLibraryOnce.js";
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

function propagateData(dataRef, initialId, inputArrDelay, maxArrDelay) {
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
    initialId,
    inputArrDelay,
    maxArrDelay
  );
  return delayObj;
}

export default {
  components: {
    ListBox,
    DataTable,
    Column,
    InputText,
    InputNumber,
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
    const inputArrDelay = ref(0); // imposed on original flight = arrDelayP (predicted)
    // Make the id of the first flight is kept, otherwise errors occur.
    const maxArrDelayRef = ref(-300); // keep nodes with > maxArrDelayRef.value
    const delayObjRef = ref(null);
    const maxLevels = 6;

    const infoRef = reactive({
      nbEdges: 0,
      nbNodes: 0,
      nbGraphEdges: 0,
      level2ids: 0,
      nbId2level: 0, // max number of levels
    });

    const flightsRef = reactive({
      nbRows: 0,
      table: null,
      city: null,
      cityEntered: null,
      timeEntered: null,
      initialId: null,
    });

    const rigidBodyRef = reactive({
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

    watch(
      [selectedAllPairsRow, inputArrDelay, maxArrDelayRef],
      ([row, arrDelay, maxArrDelay], o) => {
        console.log("===== watch selectedAllPairsRow, etc =======");
        // console.log("selected row: ", selectedAllPairsRow.value);
        // console.log("before getBEndPointFilesComputed");
        const data = getEndPointFilesComputed;
        u.print("selected row", row);
        const initialId = row.id_f;
        // u.print("data", data);
        // console.log(`before propagateData, initialId: ${initialId}`);
        // u.print("before propagateData, data: ", data.valiue);
        const delayObj = propagateData(data, initialId, arrDelay, maxArrDelay); // args: ref, value
        rigidBodyRef.table = delayObj.table;
        // u.print("==> table: ", table);
        // From this row, construct the rigid model
        //console.log("selected row: ", row);

        // NEXT STEP: draw   graphRigidModel
        delayObjRef.value = delayObj;
        console.log(`Select new row, new graph, tiers: ${tiers.value}`);
        drawGraphRigidModel(delayObj, tiers.value);
      }
    );

    // Update graph according to the number of tiers
    watch(tiers, (nbTiers) => {
      console.log("===== watch(tiers) =======");
      // console.log(`watch tier: ${nbTiers}`);
      // u.print("delayObjRef.value", delayObjRef.value);
      drawGraphRigidModel(delayObjRef.value, nbTiers);
    });

    // saveOnce, saveAtIntervals, should be called from a single file for it
    // to work properly in order to periodically update tables
    saveOnce(0);
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

    watch(getStatus, (status) => {
      if (status > 0) {
        // u.print("allPairsref", allPairsRef);
        if (checkEntries(allPairsRef)) {
          if (flightsRef) {
            flightsRef.city = allPairsRef.city;
            flightsRef.time = allPairsRef.time;
            // console.log("===> after checkEntries allPairsRef");
            const data = getEndPointFilesComputed.value;
            listCities(data.flightTable, flightIds);
            const city = allPairsRef.city.toUpperCase();
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
      // console.log("inside drawGraph");
      const nb_tiers = 0; // not used
      const flights = data.flightTable;
      const allPairs = data.allPairs;

      const flightIdMap = u.createMapping(flights, "id");
      // I should combine ptyPairs with stationPairs to create allPairs array
      const edges = defineEdges(city, allPairs, nb_tiers);
      //const nodes = defineNodes(city, edges, flights, nb_tiers);
      const nodes = data.nodesTraversed;
      // u.print("drawGraph, nodes", nodes);
      // u.print("drawGraph, edges", edges);

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
      // u.print("drawGraph, graph", graph);

      // for nodes: need: departureDelayP, arrDelayP
      // for edges: need: ACTAvailableP

      dp.colorByCity(graph);
      graph.render(); // not sure required

      dp.assignNodeLabelsNew(graph);
      graph.render();
      return;
    }

    function drawGraphRigidModel(delayObj, nbTiers) {
      // u.print("delayObj: ", delayObj);
      const {
        nodes,
        edges,
        edgesTraversed,
        nodesTraversed,
        id2level,
        level2ids,
        table,
      } = delayObj;

      // Implement change of tiersss.
      // Change the nodes, and remove all edges connected to those nodes.
      // Draw the nodes/edges but simply make them invisible.
      // Start from full list of nodes each time.

      infoRef.nbNodes = nodes.length;
      infoRef.nbEdges = nodes.length;
      infoRef.nbGraphEdges = edgesTraversed.length;
      infoRef.level2ids = [];
      for (let i = 0; i < maxLevels; i++) {
        infoRef.level2ids.push(level2ids[i].length);
      }
      infoRef.nbId2level = maxLevels;
      // for (let id in id2level) {
      // infoRef.nbId2level++;
      // }

      const nb_tiers = 0; // not used
      // const flights = data.flightTable;
      // const allPairs = data.allPairs;

      // table: all nodes (why only 96)

      // Extract ids for levels 0 throught level_max
      // const max_levels = 6;
      const max_levels = 2;
      const dataPerLevel = {};

      // Why is nbTiers null?  <<<<<<<<<<< *************** ERROR

      // Extract the ids for each level
      for (let level = 0; level < nbTiers; level++) {
        dataPerLevel[level] = u.getRowsWithAttribute(table, "level", level);
        // u.print(`==> dataPerLevel[${level}]`, dataPerLevel[level]);
      }

      // Construct the edges of the full graph, starting with level zero node
      const gNodes = [];
      // let gEdges = [];
      const tableIds = u.createMapping(table, "id");
      u.print("tableIds", tableIds);

      // gNodes: all ids from all levels

      Object.entries(id2level).forEach((entry) => {
        const id = entry[0];
        const level = entry[1];
        console.log(`level: ${level}, nbTiers: ${nbTiers}`);
        if (level < nbTiers) {
          console.log("  level < nbTiers");
          gNodes.push(tableIds[id]);
        }
      });
      console.log(`nb gNodes: ${gNodes.length}`);

      // for (let id in id2level) {
      //   // console.log(`id: ${id}`);
      //   gNodes.push(tableIds[id]);
      // }

      // gNodes are the nodes traversed in rigidBody

      u.print("drawGraphRigidModel::gNodes", gNodes);
      u.print("drawGraphRigidModel::gNodes[0]", gNodes[0]);

      // nodes.forEach((r) => {
      //   r.x = 0;
      //   r.y = 0;
      //   gNodes.push(r);
      // });

      edgesTraversed.forEach((r) => {
        r.source = r.id_f;
        r.target = r.id_nf;
        r.id = r.id_f + r.id_nf; // perhaps temporary?
      });

      const gEdges = edgesTraversed;

      u.print(
        "drawRigidBody",
        `gEdges: ${gEdges.length}, edgesTraversed: ${edgesTraversed.length}`
      );

      // gEdges has duplicate (id_f, id_nf) pairs. How to remove these duplicates.

      // u.checkEdgesDirection(gEdges, "check wrong order");

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
      // const data = { nodes: nodesTraversed, edges: gEdges };
      const data = { nodes: gNodes, edges: gEdges };
      u.print("data", data);
      endpointsGraph.data(data);
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
      dp.followTails(endpointsGraph);
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
          if (r.flt_num_f === undefined) {
            r.fltnumPair = r.flt_num_f + " - " + r.flt_num_nf;
          }
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
        u.print("before allPairsRef.table = allPairs", allPairs);
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
      rigidBodyRef,
      flightsInAirRef,
      inputTime,
      listedTime,
      initialId,
      selectedFlightIds,
      flightIds,
      selectedAllPairsRow,
      tiers,
      inputArrDelay,
      maxArrDelayRef,
      infoRef,
    };
  },
};
</script>

<style scoped>
#initialId {
  width: 200rem;
}

/* class */
.p-panel-title {
  font-size: 8em;
  color: blue;
}
.p-panel-header {
  font-size: 8em;
  color: blue;
}
</style>
