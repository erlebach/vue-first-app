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
import cloneDeep from "lodash/cloneDeep";
import { computeFeeders } from "../Composition/computeFeeders.js";
import { analyzeData3 } from "../Composition/AnalyzeData3.js";
import * as t from "../Composition/TailConnections.js";
import { propagation } from "../Composition/propagation.js";
import { propagation_new } from "../Composition/propagation_new.js";
import { rigidModel } from "../Composition/rigidModel.js";
import * as u from "../Composition/utils.js";

import { ref, watchEffect, watch } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useFetch } from "../Composition/IO_works.js";

function get3files(url1, url2, url3) {
  const { data: dFSU, error: e1, isPending: pend1 } = useFetch(() => url1);
  const { data: dBookings, error: e2, isPending: pend2 } = useFetch(() => url2);
  const { data: dTails, error: e3, isPending: pend3 } = useFetch(() => url3);

  watchEffect(() => {
    if (dFSU.value && dBookings.value && dTails.value) {
      // dTails is a ref and its value changes inside analyzeData3
      analyzeData3(dFSU, dBookings, dTails);
    }
  });
  return { dFSU, dBookings, dTails, e1, e2, e3, pend1, pend2, pend3 };
}

export default {
  components: { DataTable, Column },
  props: {
    filePath: String,
  },
  setup(props) {
    const nbRows = ref(0);

    const { dFSU, dTails, dBookings } = get3files(
      "./data/node_attributes_daterange.json",
      "./data/bookings_daterange.json",
      "./data/tail_pairs_daterange.json" // Creates the problem (only when all three files used. WHY?)
      // "./data/node_attributes.json",
      // "./data/bookings_oneday.json"
      // "./data/tail_pairs.json"
    );

    watchEffect(() => {
      // If I do not check all three conditions, even if not required, the contents will
      // be executed possibly multiple times
      if (dTails.value && dFSU.value && dBookings.value) {
        // FSU might not be required

        const { keptFlights } = t.tailConnections(dTails.value);
        tailsTable.value = keptFlights;
        nbRows.value = keptFlights.length;

        // console.log("WatchEffect in TailConnectionTable");

        // I will not change the data so reactivity not important
        // I will return reactive variables
        const id = "2019/10/01MIAPTY10:00173"; // id should be chosen via interface

        // const bookings = cloneDeep(dBookings.value);
        // const tails = cloneDeep(dTails.value);
        // const fsu = cloneDeep(dFSU.value);

        const tailsSta = u.createMapping(dTails.value, "id_f");
        u.print("dTails.value", dTails.value);
        u.print("tailsSta", tailsSta);
        u.print("dBookings", dBookings.value);

        // include tails in bookings
        dTails.value.forEach((tail) => {
          const id_f = tail.id_f;
          const id_nf = tail.id_nf;
          if (id_f.slice(13, 16) !== "PTY" && id_nf.slice(10, 13) !== "PTY") {
            // console.log("push dBookings.value");
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

        u.print("edges: ", edges);
        // const { edges } = propagation(
        //   // fsu
        //   // tails,
        //   // bookings, // to check whether propagation is still called multi times
        //   dFSU.value,
        //   dTails.value,
        //   tailsSta,
        //   dBookings.value,
        //   count,
        //   id,
        //   [] // edges
        // );

        // console.log(`Number of times propagation was called: ${count[0]}`);
        // u.print("edges", edges);

        // Value returned is not a ref (at this time)
        // These feeders should be checked against the Graph and table displays
        let { bookings_in, bookings_out, feeders } = computeFeeders(
          dFSU.value,
          dBookings.value
        );
        //u.print("bookingsWithFeeders", bookingsWithFeeders);
        // u.print("AFTER propagation, edges: ", edges);

        // u.print("dBookings.value:", dBookings.value); // tails are at the end

        //bookings_in = u.createMappingOneToMany(dBookings.value, "id_nf");
        //bookings_out = u.createMappingOneToMany(dBookings.value, "id_f");

        // u.print("bookings_in", bookings_in);
        // u.print("bookings_out", bookings_out);

        // Analyze the impact of an arrival delay (using historical data)
        rigidModel(
          dFSU.value,
          dTails.value,
          tailsSta,
          dBookings.value,
          bookings_in,
          bookings_out,
          feeders,
          edges,
          id
        );
        // console.log("EXITED rigidModel");
      }
    });

    const tailsTable = ref(null);

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
