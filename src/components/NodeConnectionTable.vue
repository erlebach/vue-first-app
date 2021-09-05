<template>
  <div>
    <h3>Flight Connection Table, {{ nbRows }} entries</h3>
    <DataTable :value="nodesTable" :scrollable="true" scrollHeight="300px">
      <Column field="id" header="Flight ID" :sortable="true"> </Column>
      <Column field="hubConnections" header="Connections" :sortable="true">
      </Column>
      <Column field="depDelay" header="depDelayZ" :sortable="true"> </Column>
      <Column field="rot_avail" header="rotAvail" :sortable="true"> </Column>
      <Column field="tail" header="tail" :sortable="true"></Column>
    </DataTable>
  </div>
</template>

<script>
import { ref, computed, watch } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useStore } from "vuex";
//import { onMounted } from "vue";

export default {
  components: { DataTable, Column },
  setup(props) {
    const store = useStore();
    const nbRows = ref(0);

    const nodesTable = computed(() => {
      return store.getters.connectionNodes;
    });

    watch(nodesTable, (value) => {
      nbRows.value = value.length;
    });

    //onMounted(async () => {
      // console.log(">>>> nodeConnectionTable, onMounted *****");
    //});

    return {
      nodesTable,
      nbRows,
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
