<template>
  <div>
    <h3>PAX Connection Table, {{ nbRows }} entries</h3>
    <DataTable :value="edgesTable" scrollable="true" scrollHeight="300px">
      <!--    <DataTable :value="edgesTable" scrollHeight="300px"> -->
      <Column field="inOrg" header="In Org" :sortable="true"> </Column>
      <Column field="outDst" header="Out Dst" :sortable="true"> </Column>
      <Column field="schArrInTMZ" header="Sch Arr In" :sortable="true">
      </Column>
      <Column field="schDepOutTMZ" header="Sch Dep Out" :sortable="true">
      </Column>
      <Column field="actAvail" header="Avail ACT" :sortable="true"> </Column>
      <Column field="inTail" header="In Tail" :sortable="true"></Column>
      <Column field="outTail" header="Out Tail" :sortable="true"></Column>
      <Column
        field="inArrDelay"
        header="In Arr Delay"
        :sortable="true"
      ></Column>
      <Column
        field="outDepDelay"
        header="Out Dep Delay"
        :sortable="true"
      ></Column>
      <Column field="pax" header="PAX" :sortable="true"></Column>
    </DataTable>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useStore } from "vuex";

export default {
  components: { DataTable, Column },
  setup(props) {
    const store = useStore();
    const nbRows = ref(0);
    const table = reactive({});

    const edgesTable = computed(() => {
      return store.getters.connectionEdges;
    });

    watch(edgesTable, (value) => {
      nbRows.value = value.length;
    });

    //onBeforeMount(() => {
      //console.log(">>>>> EdgeConnectionTable, onBeforeMount(), root.value");
    //});
    //onMounted(() => {
      //console.log(">>>>> EdgeConnectionTable, Inside onMounted (this) <<<<<");
    //});
    //onBeforeUpdate(() => {
      //console.log(
        //">>>>> EdgeConnectionTable, Inside onBeforeUpdate (this) <<<<<"
      //);
    //});
    //onUpdated(() => {
      //console.log(">>>>> EdgeConnectionTable, Inside updated (this) <<<<<");
    //});

    return {
      edgesTable,
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

<style>
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

<style scoped>
.p-slider-horizontal,
.p-inputtext {
  width: 14rem;
}
.p-slider-vertical {
  height: 14rem;
}
</style>
