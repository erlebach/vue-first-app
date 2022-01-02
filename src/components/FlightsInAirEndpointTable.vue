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
  <!-- ----------------------------------------------------------------------------- -->
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
      <!-- selectedFlightIds.value.name is the chosen city -->
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
      <h2>Selected Flight Ids: {{ selectedFlightIds }}</h2>
      <!-- remove when done -->
    </template>
    <!-- Select rows from table (selectedFlightIds) -->
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
  <div class="p-d-flex p-flex-column">
    <h2>Endpoint Graph</h2>
    <!-- style propagated to text box, but not to panel -->
    <!-- <div class="p-d-flex flex-start" style="font-size:8ex;color:red"> -->
    <div class="p-d-flex p-flex-row start">
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
      <!-- ------ SLIDER ----------, turn visibility on/off -->
      <div class="p-field p-col-12 p-md-1" style="color:green">
        <Button label="Toggle Orientation" @click="toggleOrientation" />
        <div :style="sliderDisplay()">
          <span style="font-size:1em">
            <label for="integeronly"><h2>Arrival Delay (min)</h2></label>
          </span>
          <!-- Slider with buttons -->
          <SliderWithButtons
            val="0"
            min="-30"
            max="300"
            step="15"
            @sendValue="getArrDelay"
          />
        </div>
        <!-- <div class="p-d-flex p-ai-center">
          <Button icon="pi pi-angle-left" @click="arrDelaySlider.dec" />
          <Slider
            v-model="arrDelaySlider.value"
            :step="arrDelaySlider.step"
            :min="arrDelaySlider.min"
            :max="arrDelaySlider.max"
          />
          <Button icon="pi pi-angle-right" @click="arrDelaySlider.inc" />
        </div> -->
        <!-- inputArrDelay -->
        <!-- <InputNumber
          id="integeronly"
          v-model="inputArrDelay"
          inputStyle="color:red; width:4em"
        /> -->
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
      <div id="GETooltipId" class="GETooltipId"></div>
      <div id="mountEndpointsGraph"></div>
    </div>
    <!-- ---------- -->
    <div class="p-d-flex">
      <div class="flex p-flex-row">
        <Button label="Toggle Orientation" @click="toggleChartOrientation" />
        <div class="flex p-flex-column">
          <h2>Delay Propagation: global view (@antv/G2plot)</h2>
          <h3>
            Imposed [30, 45, 60] min arrival delay on all airborne flights
          </h3>
          <div id="mountEndpointsChart"></div>
        </div>
      </div>
    </div>
    <!-- ------------------------------ -->
    <div class="p-d-flex">
      <div class="flex p-flex-row">
        <Button label="Toggle Orientation" @click="toggleG2ChartOrientation" />
        <div class="flex p-flex-column">
          <h2>Delay Propagation: global view (@antv/G2)</h2>
          <h3>
            Imposed [30, 45, 60] min arrival delay on all airborne flights
          </h3>
          <div id="mountEndpointsG2Chart"></div>
        </div>
      </div>
    </div>
    <!-- ---------------------------------- -->
  </div>

  <!-- ------------------------------------------------------------------------ -->
  <!-- Nodes of displayed Endpoint graph -->
  <!-- Only the nodes displayed in theg raph are shown -->
  <DataTable
    :value="endpointRef.nodeTable"
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
      <h2>Displayed Flight Data</h2>
    </template>
    <Column
      field="id"
      style="width=30em;"
      header="id"
      :sortable="true"
      :style="col"
    >
    </Column>
    <Column field="orig" header="ORG" :sortable="true" :style="col"> </Column>
    <Column field="dest" header="DST" :sortable="true" :style="col"> </Column>
    <Column field="flt_num" header="Fltnum" :sortable="true" :style="col">
    </Column>
    <Column field="tail" header="Tail" :sortable="true" :style="col"> </Column>
    <Column field="schDepTMZ" header="SchDep" :sortable="true" :style="col">
    </Column>
    <Column field="schArrTMZ" header="SchArr" :sortable="true" :style="col">
    </Column>
    <Column field="depDelay" header="depDelay" :sortable="true" :style="col">
      <template #body="slotProps">
        <div :style="depDelayStyle(slotProps.data)" class="bold">
          {{ slotProps.data.depDelay }}
        </div></template
      >
    </Column>
    <Column
      field="depDelayP"
      header="PredDepDelay"
      :sortable="true"
      :style="col"
    >
      <template #body="slotProps">
        <div :style="depDelayPStyle(slotProps.data)" class="bold">
          {{ slotProps.data.depDelayP }}
        </div></template
      >
    </Column>
    <Column field="arrDelay" header="ArrDelay" :sortable="true" :style="col">
      <template #body="slotProps">
        <div :style="arrDelayStyle(slotProps.data)" class="bold">
          {{ slotProps.data.arrDelay }}
        </div></template
      >
    </Column>
    <Column
      field="arrDelayP"
      header="PredArrDelay"
      :sortable="true"
      :style="col"
    >
      <template #body="slotProps">
        <div :style="arrDelayPStyle(slotProps.data)" class="bold">
          {{ slotProps.data.arrDelayP }}
        </div></template
      >
    </Column>
    <Column field="minACTP" header="MinACTP" :sortable="true" :style="col">
    </Column>
    <Column field="level" header="Level" :sortable="true" :style="col">
    </Column>
  </DataTable>

  <!-- --------------------------------------------------------------------------- -->
  <!-- Edges of displayed Endpoint graph -->
  <!-- All edges of shown, irrespective of tier -->
  <DataTable
    style="display:none;"
    :value="endpointRef.edgeTable"
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
      <h2>Displayed Connection Data</h2>
    </template>
    <Column field="id_f" header="In Id" :sortable="true" :style="col"> </Column>
    <Column field="id_nf" header="Out Id" :sortable="true" :style="col">
    </Column>
    <Column field="status_f" header="In Status" :sortable="true" :style="col">
    </Column>
    <Column field="status_nf" header="Out Status" :sortable="true" :style="col">
    </Column>
    <Column field="tail_f" header="In Tail" :sortable="true" :style="col">
    </Column>
    <Column field="tail_nf" header="Out Tail" :sortable="true" :style="col">
    </Column>
    <Column field="slackP" header="Pred Slack" :sortable="true" :style="col">
    </Column>
  </DataTable>

  <!-- ------------------------------------------------------------------------ -->
  <!-- DataTable of results returned from rigidBody -->
  <DataTable
    style="display:none;"
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
    style="display:none;"
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

  <div style="display:none;">
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
import Button from "primevue/button";
import Column from "primevue/column";
import Panel from "primevue/panel";
// import Slider from "primevue/slider";
// import SliderPlus from "./SliderPlus.vue";
import InputNumber from "primevue/inputnumber";
import RadioButton from "primevue/radiobutton";
import InputText from "primevue/inputtext";
import SliderWithButtons from "./SliderWithButtons.vue";
import "primeicons/primeicons.css";
import G6 from "@antv/g6";
import * as dc from "../Composition/DelayChart_g2plot.js";
import * as dcg2 from "../Composition/DelayChart_g2.js";
import G2 from "@antv/g2";
import * as g2p from "@antv/g2plot";
import { GroupedBar } from "@antv/g2plot";
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
import { boundingBox } from "../Composition/graphImpl.js";
import * as tier from "../Composition/RigidTierref.js";
import * as ep from "./Endpoint/endpointUtils.js";

export default {
  components: {
    ListBox,
    DataTable,
    Column,
    InputText,
    InputNumber,
    FlightsInAirHelp,
    RadioButton,
    Button,
    Panel,
    // Slider,
    SliderWithButtons,
  },
  props: {
    filePath: String,
    width: Number,
    height: Number,
  },
  setup(props, { emit }) {
    const ifhelp = ref(false);
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
    let delayObj = null;
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
    //
    const delayObjRef = ref(null);
    const dataRef = ref(null);
    const maxLevels = 6;
    // Endpoint graph orientation
    const portrait = ref(true);

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

    const endpointRef = reactive({
      nbRows: 0,
      nodeTable: null,
      edgeTable: null,
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

    const initialId = ref(undefined);

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

    function toggleChartOrientation() {
      dc.toggleChartOrientation(delayObj);
    }
    function toggleG2ChartOrientation() {
      console.log("call dcg2.toggleChartOrientation");
      dcg2.toggleChartOrientation(delayObj);
    }
    //------------------------------------
    // retrieve from slider
    function getArrDelay(delay) {
      // retrieve the slider value (single scalar)
      inputArrDelay.value = delay; // redundant variable
    }
    //------------------------------------
    function toggleOrientation() {
      portrait.value = portrait.value === true ? false : true;

      if (portrait.value === true) {
        endpointsGraph.updateLayout({
          rankdir: "LR",
        });
      } else {
        endpointsGraph.updateLayout({
          rankdir: "TD",
        });
      }
      endpointsGraph.fitView();
      endpointsGraph.render();
    }

    //------------------------------------
    // Save data from the endpoint URL, either once or at fixed intervals (in sec)
    // saveOnce, saveAtIntervals, should be called from a single file for it
    // to work properly in order to periodically update tables
    saveOnce(0);
    //saveAtIntervals(3); // Retrieves data at fixed intervals

    //----------------
    // Select City to filter out the rows in the endpoint data table
    watch(selectedFlightIds, (ids) => {
      console.log("watch selectedFlightIds");
      const dataRef = getEndPointFilesComputed;
      const flightTable = dataRef.value.flightTable;
      if (ids === null) {
        console.log("ids is null!!! SHOULD NOT HAPPEN");
      } else {
        u.print("ids.name", ids.name);

        const allPairs = dataRef.value.allPairs;
        const table = u.getRowsWithAttribute(allPairs, "orig_f", ids.name);

        allPairsRef.city = ids.name;
        allPairsRef.table = table;
      }
    });

    //----------------
    watch(
      // inputArrDelay.value should not have any effect since not a ref
      // User interface elements
      [selectedAllPairsRow, inputArrDelay, maxArrDelayRef],
      ([row, arrDelay, maxArrDelay], o) => {
        console.log("watch selectedAllPairsRow, inputArrDelay, maxArrDelayRef");
        console.log(`inputArrDelay: ${arrDelay}`);
        const initialId = row.id_f;

        // check whether calling propagateData twice still produces a graph
        // let delayObj;
        [0].forEach((i) => {
          delayObjRef.value = ep.propagateData(
            dataRef,
            initialId,
            arrDelay,
            maxArrDelay
          );
        });

        // Go through all flights in air and compute effect of initial arrival delays

        rigidBodyRef.table = delayObjRef.value.table;
        drawGraphRigidModel(delayObjRef.value, tiers.value);
      }
    );

    // Update graph according to the number of tiers
    //----------------
    // Redraw the network if the number tiers is changed
    watch(tiers, (nbTiers) => {
      const recreate = false;
      drawGraphRigidModel(delayObjRef.value, nbTiers);
    });

    // once data is read in from the Endpoint URL
    watch(getStatus, (status) => {
      if (status > 0) {
        dataRef.value = getEndPointFilesComputed.value; // Why not use computed value?
        u.print("==> before propagateNetwork::dataRef.value: ", dataRef.value);

        delayObj = ep.propagateNetwork(dataRef);
        u.print("... delayObj", delayObj);
        dc.drawDelayChart(delayObj); // <<<< Use dc module

        // WHAT DOES THIS SECTION DO? Prepares to graph
        if (ep.checkEntries(allPairsRef)) {
          if (flightsRef) {
            flightsRef.city = allPairsRef.city;
            flightsRef.time = allPairsRef.time;
            const data = getEndPointFilesComputed.value;
            ep.listCities(data.flightTable, flightIds);
            const city = allPairsRef.city.toUpperCase();
            drawGraph(city, data);
          }
        }
      }
      // Perhaps setStatus(false)? But that would start the watchEffect again, so bad idea.
    });

    onMounted(() => {
      dc.initializeChart();
      dcg2.initializeChart();
    });

    function drawGraph(city, data) {
      const nb_tiers = 0; // not used
      const flights = data.flightTable;
      const allPairs = data.allPairs;

      const flightIdMap = u.createMapping(flights, "id");
      // I should combine ptyPairs with stationPairs to create allPairs array
      const edges = ep.defineEdges(city, allPairs, nb_tiers);
      const nodes = data.nodesTraversed;

      // There MUST be a way to update edges and nodes WITHOUT destroying and recreating the graph (inefficient)
      if (graphCreated) {
        graph.clear(); // difference wit
      } else {
        graph = new G6.Graph(connectionConfiguration);
        graphCreated = true;
      }

      // QUESTION: with clear(), the tooltips stay. However, the graph
      // is translated downward. WHY?

      // This element must be mounted before creating the graph
      graph.data({ nodes, edges });
      graph.render();

      // for nodes: need: departureDelayP, arrDelayP
      // for edges: need: ACTAvailableP

      dp.colorByCity(graph);
      graph.render(); // not sure required

      dp.assignNodeLabels(graph);
      graph.render();
      return;
    }

    //-----------------------------------
    function drawGraphRigidModel(delayObj, nbTiers) {
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

      const nb_tiers = 0; // not used

      // table: all nodes (why only 96)

      // Extract ids for levels 0 throught level_max
      // const max_levels = 6;
      const max_levels = 2;
      const dataPerLevel = {};

      // Extract the ids for each level
      for (let level = 0; level < nbTiers; level++) {
        dataPerLevel[level] = u.getRowsWithAttribute(table, "level", level);
      }

      const tableIds = u.createMapping(table, "id");
      const nodesTraversedIds = u.createMapping(nodesTraversed, "id");

      // gNodes: all ids from all levels

      // Construct the edges of the full graph, starting with level zero node
      const gNodes = [];

      Object.entries(id2level).forEach((entry) => {
        const id = entry[0];
        const level = entry[1];
        if (level < nbTiers) {
          gNodes.push(nodesTraversedIds[id]); // There are more fields for tooltips (2021-12-21)
        }
      });
      gNodes.forEach((r) => {
        r.orig = r.id.slice(10, 13);
        r.dest = r.id.slice(13, 16);
      });

      // Add color attributes
      ep.setupDelayColors(gNodes);

      // gNodes are the nodes traversed in rigidBody

      edgesTraversed.forEach((r) => {
        r.source = r.id_f;
        r.target = r.id_nf;
        r.id = r.id_f + r.id_nf; // perhaps temporary?
      });

      const gEdges = edgesTraversed;

      endpointRef.nodeTable = gNodes;
      // Do not display connetion (edge) table
      // endpointRef.edgeTable = gEdges;

      // There MUST be a way to update edges and nodes WITHOUT destroying and recreating the graph (inefficient)
      if (endpointsGraphCreated) {
        // removes all nodes and edges. Leaves configuration intact
        endpointsGraph.clear();
      } else {
        endpointsGraph = new G6.Graph(endpointConfiguration);
        endpointsGraphCreated = true;
      }
      endpointsGraph.setMinZoom(0.01);

      const data = { nodes: gNodes, edges: gEdges };
      // endpointsGraph.data(data);
      endpointsGraph.read(data); // combines data and render
      endpointsGraph.render();

      // This element must be mounted before creating the graph
      // const data = { nodes: nodesTraversed, edges: gEdges };
      // const { x, y } = gNodes[0];

      // Not clear why this approach is required given that gNodes[0] contains
      // x,y
      const node = endpointsGraph.getNodes()[0];
      const { x, y } = node.getModel();

      const minZoom = endpointsGraph.getMinZoom();

      u.print("node[0]: ", gNodes[0]);
      endpointsGraph.fitView();
      endpointsGraph.render();

      dp.colorByCity(endpointsGraph);
      dp.followTails(endpointsGraph);
      endpointsGraph.render(); // not sure required

      dp.assignNodeLabels(endpointsGraph); // Generates Maximum call stack size exceeded!!!!!
      endpointsGraph.render();
      return;
    }

    const sliderDisplay = () => {
      return selectedAllPairsRow.value ? "display:true;" : "display:none;";
    };

    const arrStatusStyle = (data) => {
      return data.arrStatus === "LATE" ? "color: red" : "color: green";
    };
    const inFlightStyle = (data) => {
      return data.inFlight === "AIR" ? "color: green" : "color: red";
    };
    const arrDelayStyle = (data) => {
      return `color:${data.arrDelayColor}; font-weight:bold`;
    };
    const arrDelayPStyle = (data) => {
      return `color:${data.arrDelayPColor}; font-weight:bold`;
    };
    const depDelayStyle = (data) => {
      return `color:${data.depDelayColor}; font-weight:bold`;
    };
    const depDelayPStyle = (data) => {
      return `color:${data.depDelayPColor}; font-weight:bold`;
    };

    const rotStyle = (rotData) => {
      const col = rotData < 45 ? "green" : "red";
      return `color:${col}`;
    };

    //----------------
    watchEffect(() => {
      if (getStatus.value > 0) {
        const data = getEndPointFilesComputed;

        flightsRef.table = data.value.flightTable;
        flightsRef.nbRows = data.value.flightTable.length;

        const flightIdMap = u.createMapping(data.value.flightTable, "id");

        const ptyPairs = data.value.ptyPairs;
        ptyPairs.forEach((r) => {
          if (r.flt_num_f === undefined) {
            r.fltnumPair = r.flt_num_f + " - " + r.flt_num_nf;
          }
        });

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

        flightsInAirRef.table = allPairs; // Change later
        flightsInAirRef.nbRows = allPairs.length; // Change later
      }
    });

    return {
      toggleOrientation,
      toggleChartOrientation,
      toggleG2ChartOrientation,
      ifhelp,
      flightsRef,
      allPairsRef,
      rigidBodyRef,
      endpointRef,
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
      depDelayStyle,
      arrDelayStyle,
      depDelayPStyle,
      arrDelayPStyle,
      sliderDisplay,
      getArrDelay,
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
.p-slider {
  width: 100px;
  margin-left: 10px;
  margin-right: 10px;
}
/* Directly controls size of chart */
#mountEndpointsChart {
  width: 1200px;
  height: 800px;
}
/* Directly controls size of chart */
#mountEndpointsG2Chart {
  width: 1200px;
  height: 800px;
}
</style>
