<!-- adding this to topVue stops graph from showing. How is that possible? -->
<!-- Add keyboard shortcuts to see color legend. -->
<template>
  <h2>Flights in Air</h2>
  <h3>Time of day (Zulu): {{ listedTime }}, {{ nbRows }} entries</h3>

  <FlightsInAirHelp show-help="false" />

  <DataTable :value="flightsTable" :scrollable="true" scrollHeight="500px">
    <template #header>
      <span>Time of day: </span>
      <!-- Only show when table is visible -->
      <!-- What is type=? -->
      <InputText
        type="text"
        v-model="inputTime"
        v-on:keyup.enter="confirmEntry"
      />
      <!-- Consider a set of checkboxes to turn columns on and off
-->
    </template>
    <Column style="display: none;" field="id" :sortable="true"> </Column>
    <Column :style="col" field="O" header="Org" :sortable="true"> </Column>
    <Column field="D" header="Dst" :sortable="true"> </Column>
    <Column field="flight" header="Flight" :sortable="true"> </Column>
    <Column field="schDepZ" header="SchDep" :sortable="true"> </Column>
    <Column field="schArrZ" header="SchArr" :sortable="true"> </Column>
    <Column field="arrDelay" header="arrDelay" :sortable="true">
      <template #body="slotProps">
        <div :style="arrDelayStyle(slotProps.data)" class="bold">
          {{ slotProps.data.arrDelay }}
        </div></template
      >
    </Column>
    <Column field="depDelay" header="depDelay" :sortable="true">
      <template #body="slotProps">
        <div :style="depDelayStyle(slotProps.data)" class="bold">
          {{ slotProps.data.depDelay }}
        </div></template
      >
    </Column>
    <Column field="tail" header="tail" :sortable="true"> </Column>
    <Column field="inFlight" header="InFlight" :sortable="true">
      <template #body="slotProps">
        <div :style="inFlightStyle(slotProps.data)" class="bold">
          {{ slotProps.data.inFlight }}
        </div></template
      >
    </Column>
    <Column field="arrStatus" header="Arr Status" :sortable="true">
      <template #body="slotProps">
        <div :style="arrStatusStyle(slotProps.data)" class="bold">
          {{ slotProps.data.arrStatus }}
        </div></template
      >
    </Column>
    <Column field="rotAvail" header="Avail Rot PTY" :sortable="true">
      <template #body="slotProps">
        <div class="bold">
          <div :style="rotStyle(slotProps.data.rotAvail)">
            {{ slotProps.data.rotAvail }}
          </div>
        </div></template
      >
    </Column>
    <Column field="rotReal" header="Real Rot PTY" :sortable="true">
      <template #body="slotProps">
        <div class="bold">
          <div :style="rotStyle(slotProps.data.rotReal)">
            {{ slotProps.data.rotReal }}
          </div>
        </div></template
      >
    </Column>
    <Column field="rotPlanned" header="Planned Rot PTY" :sortable="true">
      <template #body="slotProps">
        <div class="bold">
          <div :style="rotStyle(slotProps.data.rotPlanned)">
            {{ slotProps.data.rotPlanned }}
          </div>
        </div></template
      >
    </Column>
  </DataTable>
</template>

<script>
import FlightsInAirHelp from "./FlightsInAirHelp.vue";
import { convertCopaData } from "../Composition/graphSupport.js";
import * as l from "../Composition/loadTableClass.js";
import * as f from "../Composition/FlightsInAir.js";
import * as u from "../Composition/utils.js";
import { IO_works, ensureConditionIsMet } from "../Composition/IO_works.js";
import { ref, reactive, isReactive, computed, watch } from "vue";
import ModalView from "./ModalView.vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import { findCityInCityMap, filterData } from "../Composition/graphSupport";
import { colorByCity } from "../Composition/graphImpl";
import { useStore } from "vuex";
import { onMounted } from "vue";
import { useKeydown } from "../Composition/useKeydown.js";

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

    useKeydown([
      {
        key: "Escape",
        fn: (event) => {
          console.log(`Pressed ESC key!`);
        },
      },
      {
        key: "h",
        fn: (event) => (ifhelp.value = ifhelp.value === false ? true : false),
      },
    ]);

    const toggle = (event) => {
      // console.log("inside toggle()"); // reached
      // u.print("event", event);
    };

    const load = new l.LoadTable("./data/bookings_oneday.json");

    const arrStatusStyle = (data) => {
      return data.arrStatus === "LATE" ? "color: red" : "color: green";
    };
    const inFlightStyle = (data) => {
      return data.inFlight === "AIR" ? "color: green" : "color: red";
    };
    const arrDelayStyle = (data) => {
      return `color:${data.arrDelayColor}`;
    };
    const depDelayStyle = (data) => {
      return `color:${data.depDelayColor}`;
    };

    const rotStyle = (rotData) => {
      const col = rotData < 45 ? "green" : "red";
      return `color:${col}`;
    };

    watch(load.isDataLoaded(), (curVal, old) => {
      flightsInAir("2019-10-01", "14:00");
    });

    function flightsInAir(dtz, tmz) {
      const timeShift = 8;
      const nodes = load.data()[0].nodes;
      // ANALYZE and FIX. Then clean.
      const { keptFlights } = f.flightsInAir(nodes, dtz, tmz, timeShift); 
      flightsTable.value = keptFlights;
      nbRows.value = keptFlights.length;
    }

    //onMounted(() => {
      //console.log(">>>>> FlightInAir, Inside onMounted (this) <<<<<");
    //});

    const confirmEntry = () => {
      flightsInAir("2019-10-01", inputTime.value);
      listedTime.value = inputTime.value;
    };

    return {
      ifhelp,
      flightsTable,
      //nodes,
      inputTime,
      listedTime,
      nbRows,
      confirmEntry,
      arrStatusStyle,
      inFlightStyle,
      arrDelayStyle,
      depDelayStyle,
      rotStyle,
      //overlayref,
    };
  },
};
</script>

<style scoped>
::v-deep(.row-city) {
  background-color: red !important;
}
.origclass {
  color: blue;
}
.defaultodclass {
  color: steelblue;
}
.destclass {
  color: black;
}

.bold {
  font-weight: bold;
}
</style>

<style>
.node-tooltip {
  background-color: lightsteelblue;
}
.edge-tooltip {
  background-color: yellow;
}
.idbackgrounddefault {
  background-color: white; /* or nullify the class */
}
.idbackgroundhover {
  background-color: orange;
}
</style>

<style scoped>
.p-slider-horizontal,
.p-inputtext {
  width: 14rem;
}
.p-slider-vertical {
  height: 14rem;
}
</style>
