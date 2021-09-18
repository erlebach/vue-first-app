<template>
  <div>
    <h3>Tail Connectivity Table, {{ nbRows }} entries</h3>
    <DataTable :value="tailsTable" scrollable="true" scrollHeight="300px">
      <Column field="od_f" header="In OD" :sortable="true"> </Column>
      <Column field="od_nf" header="Out OD" :sortable="true"> </Column>
      <Column field="tail_f" header="In Tail" :sortable="true"> </Column>
      <Column field="tail_nf" header="Out Tail" :sortable="true"> </Column>
      <Column field="dep_f" header="Sch Dep In" :sortable="true"> </Column>
      <Column field="arr_f" header="Sch Arr In" :sortable="true"> </Column>
      <Column field="dep_nf" header="Sch Dep Out" :sortable="true"> </Column>
      <Column field="arr_nf" header="Sch Arr Out" :sortable="true"> </Column>
      <Column field="rot_avail" header="Avail Rot" :sortable="true">
        <!-- Missing column -->
        <template #body="slotProps">
          <div class="bold">
            <div :style="rotStyle(slotProps.data.rot_avail)">
              {{ slotProps.data.rot_avail }}
            </div>
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script>
import * as t from "../Composition/TailConnections.js";

import { ref, watchEffect, watch } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useFetch, get1file } from "../Composition/IO_works.js";

// Worked!!!!
// function delay(i) {
// setTimeout(() => {
// r.setTable(Math.random());
// });
// }

export default {
  components: { DataTable, Column },
  props: {
    filePath: String,
  },
  setup(props) {
    const nbRows = ref(0);
    // const nbRowsDelayed = ref(0);
    const tailsTable = ref(null);

    // I am reading files multiple times. Ideally, I should have a cache and only read if the file
    // is not yet read. Even that is not perfect because a file ref could still be zero while the process is the
    // process of being read. What happens if file is being read twice at the same time?
    // const { dFSU, dTails, dBookings, pend1, pend2, pend3 } = get3files(
    //   "./data/node_attributes_daterange.json",
    //   "./data/bookings_daterange.json",
    //   "./data/tail_pairs_daterange.json" // Creates the problem (only when all three files used. WHY?)
    // );

    const { data: dTails, pend1 } = get1file(
      "./data/tail_pairs_daterange.json"
    );

    watchEffect(() => {
      // If I do not check all three conditions, even if not required, the contents will
      // be executed possibly multiple times
      // if (dTails.value && dFSU.value && dBookings.value ) {
      if (dTails.value && !pend1.value) {
        // FSU might not be required
        const { keptFlights } = t.tailConnections(dTails.value);
        tailsTable.value = keptFlights;
        nbRows.value = keptFlights.length;
      }
    });

    // make tailsTable accessible from elsewhere.
    // const delayedArrivalsTable = ref(null);

    const rotStyle = (rotData) => {
      const col = rotData < 45 ? "green" : "red";
      return `color:${col}`;
    };

    return {
      tailsTable,
      nbRows,
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
