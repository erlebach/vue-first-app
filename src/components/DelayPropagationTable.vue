<template>
  <!-- <div>
    <DelayPropagationGraph
      class="delay"
      :width="600"
      :height="1000"
      v-show="false"
    />
  </div> -->

  <div v-show="showTable">
    <h3>
      Propagated Delay Table, {{ nbRowsDelayed }} entries
      <!-- <Button> Hide </Button> -->
    </h3>
    <DataTable
      :value="delayedArrivalsTable"
      :scrollable="true"
      scrollHeight="300px"
    >
      <Column field="id" header="Flight ID" :sortable="true"> </Column>
      <Column field="depDelay" header="depDelayZ" :sortable="true"> </Column>
      <Column field="arrDelay" header="arrDelayZ" :sortable="true"> </Column>
      <Column field="tail" header="tail" :sortable="true"></Column>
      <Column field="level" header="level" :sortable="true"></Column>
    </DataTable>
  </div>
</template>

<script>
import { computePropagationDelays } from "../Composition/propagationLibrary.js";
// import DelayPropagationGraph from "./DelayPropGraph.vue";
import * as io from "../Composition/IO_works";
import { ref, watchEffect, watch } from "vue";
import DataTable from "primevue/datatable";
// import Button from "primevue/button";
import Column from "primevue/column";
import * as tier from "../Composition/Tierref";
import { useStore } from "vuex";
import { saveAtIntervals } from "../Composition/text-processing.js";

const {
  data1: dFSU,
  data3: dTails,
  data2: dBookings,
  pend1,
  pend2,
  pend3,
} = io.get3files(
  "./data/node_attributes_daterange.json",
  "./data/bookings_daterange.json",
  "./data/tail_pairs_daterange.json" // Creates the problem (only when all three files used. WHY?)
);

export default {
  components: { DataTable, Column },
  props: {
    filePath: String, // not used
    tiers: String,
  },
  setup(props) {
    const nbRowsDelayed = ref(0);
    const showTable = ref(false);
    const delayedArrivalsTable = ref(null);

    const store = useStore();
    tier.setTier(props.tiers);
    const filesRead = ref(false);

    // computed functions must be accessed by value (they are references)

    watchEffect(() => {
      // If I do not check all three conditions, even if not required, the contents will
      // be executed possibly multiple times
      if (
        dTails.value &&
        dFSU.value &&
        dBookings.value &&
        !pend1.value &&
        !pend2.value &&
        !pend3.value
      ) {
        filesRead.value = true; // NEW

        saveAtIntervals(10); // save every 5 sec
        // console.log("set ref.value to true");
        store.commit("setFSU", dFSU);
        store.commit("setTails", dTails);
        store.commit("setBookings", dBookings);

        // id should be chosen via interface
        const initialID = "2019/10/01MIAPTY10:00173";

        const table = computePropagationDelays(
          dFSU,
          dTails,
          dBookings,
          initialID
        );

        nbRowsDelayed.value = table.length;
        delayedArrivalsTable.value = table;
        showTable.value = true;
      }
    });

    const rotStyle = (rotData) => {
      const col = rotData < 45 ? "green" : "red";
      return `color:${col}`;
    };

    return {
      delayedArrivalsTable,
      showTable,
      nbRowsDelayed,
      rotStyle,
    };
  },
};
</script>

<style scoped>
.bold {
  font-weight: bold;
}

.delay {
  background-color: white;
  border-color: green;
}

.p-datatable-table {
  text-align: left;
  color: red; /* not working */
}

p-datatable-wrapper {
  text-align: left;
  color: green; /* not working */
}
.p-column-title {
  color: blue; /* worked  on all DataTables */
}
</style>
