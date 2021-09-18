<template>
  <div>
    <!-- <DelayPropagationGraph
      class="delay"
      :width="800"
      :height="1500"
      v-show="false"
    /> -->

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
  <!-- 
  <div>
    <h3>Propagated Delay Table, {{ nbRowsDelayed }} entries</h3>
    <DataTable
      :value="delayedArrivalsTable"
      :scrollable="true"
      scrollHeight="300px"
    >
      <Column field="id" header="Flight ID" :sortable="true"> </Column>
      <Column field="depDelay" header="depDelayZ" :sortable="true"> </Column>
      <Column field="arrDelay" header="arrDelayZ" :sortable="true"> </Column>
      <Column field="tail" header="tail" :sortable="true"></Column>
    </DataTable>
  </div> -->
</template>

<script>
import * as r from "../Composition/Tableref.js";
import { computeFeeders } from "../Composition/computeFeeders.js";
import { analyzeData3 } from "../Composition/AnalyzeData3.js";
import * as t from "../Composition/TailConnections.js";
import { propagation_new } from "../Composition/propagation_new.js";
import { rigidModel } from "../Composition/rigidModel.js";
import * as u from "../Composition/utils.js";

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

// export function get1file(url1) {
//   const { data, error: e1, isPending: pend1 } = useFetch(() => url1);
//   return { data, e1, pend1 };
// }

// export function get2files(url1, url2) {
//   const { data: dFSU, error: e1, isPending: pend1 } = useFetch(() => url1);
//   const { data: dBookings, error: e2, isPending: pend2 } = useFetch(() => url2);
//   return { dFSU, dBookings, e1, e2, pend1, pend2 };
// }

// export function get3files(url1, url2, url3) {
//   const { data: dFSU, error: e1, isPending: pend1 } = useFetch(() => url1);
//   const { data: dBookings, error: e2, isPending: pend2 } = useFetch(() => url2);
//   const { data: dTails, error: e3, isPending: pend3 } = useFetch(() => url3);

//   // watchEffect(() => {
//   //   if (dFSU.value && dBookings.value && dTails.value) {
//   //     // dTails is a ref and its value changes inside analyzeData3
//   //     console.log("Execute analyzeData3");
//   //     analyzeData3(dFSU, dBookings, dTails);
//   //   }
//   // });
//   return { dFSU, dBookings, dTails, e1, e2, e3, pend1, pend2, pend3 };
// }

export default {
  components: { DataTable, Column },
  // components: { DataTable, Column, DelayPropagationGraph },
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

    // const dFSU = ref(0);
    // const dTails = ref(0);
    // const dBookings = ref(0);
    console.log("xx after get3Files");

    watchEffect(() => {
      // If I do not check all three conditions, even if not required, the contents will
      // be executed possibly multiple times
      // if (dTails.value && dFSU.value && dBookings.value ) {
      if (dTails.value && !pend1.value) {
        // FSU might not be required

        console.log("tails: files3 read");

        const { keptFlights } = t.tailConnections(dTails.value);
        tailsTable.value = keptFlights;
        u.print("keptFlights", keptFlights);
        nbRows.value = keptFlights.length;
        u.print("nbRows keptFlights", nbRows);

        /*
        // id should be chosen via interface
        const id = "2019/10/01MIAPTY10:00173";

        // include tails in bookings
        dTails.value.forEach((tail) => {
          const id_f = tail.id_f;
          const id_nf = tail.id_nf;
          if (id_f.slice(13, 16) !== "PTY" && id_nf.slice(10, 13) !== "PTY") {
            dBookings.value.push({ id_f, id_nf, tail });
          }
        });

        // Propagation is recursive. An error might lead to infinite calls, so stack overflow
        const count = [0];
        const { edges } = propagation_new(
          dFSU.value,
          dTails.value,
          dBookings.value,
          id
        );

        // Value returned is not a ref (at this time)
        // These feeders should be checked against the Graph and table displays
        let { bookings_in, bookings_out, feeders } = computeFeeders(
          dFSU.value,
          dBookings.value
        );

        const initialArrDelay = 60; // in min
        console.log("about to  call rigidModel");

        // Analyze the impact of an arrival delay (using historical data)
        const delayObj = rigidModel(
          dFSU.value,
          dBookings.value,
          bookings_in,
          bookings_out,
          edges,
          initialArrDelay, // applied to id
          id
        );
        r.setTable(delayObj); // nodes, edges
        const delayNodes = delayObj.nodes;

        const table = [];
        delayNodes.forEach((d) => {
          table.push({
            id: d.id,
            depDelay: d.depDelayP,
            arrDelay: d.arrDelayP,
            tail: d.TAIL,
          });
        });
    */
        // nbRowsDelayed.value = table.length;
        // delayedArrivalsTable.value = table;
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
      // delayedArrivalsTable,
      // nbRowsDelayed,
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
