<template>
  <div>
    <h3>Station: {{ enteredCity }}, {{ nbRows }} entries</h3>
    <DataTable :value="nodesTable" :scrollable="true" scrollHeight="500px">
      <template #header>
        <span>City: </span>
        <!-- What is type=? -->
        <InputText
          type="text"
          v-model="inputCity"
          v-on:keyup.enter="confirmEntry"
        />
      </template>
      <Column
        style="display: none;"
        field="id"
        header="Flight ID"
        :sortable="true"
      >
        <template #body="slotProps">
          <div
            @mouseleave="idExit(slotProps.data.id)"
            @mouseenter="idEnter(slotProps.data.id)"
            class="idClass(slotProps.data.id)"
          >
            {{ slotProps.data.id }}
          </div>
          <!-- Above, if I replace class by :class, the table no longer prints. I 
          get some kind of "hover" error. -->
        </template>
      </Column>
      <Column field="O" header="Org" :sortable="true">
        <template #body="slotProps">
          <div class="cityClass(slotProps.data)">
            {{ slotProps.data.O }}
          </div>
        </template>
      </Column>
      <Column field="D" header="Dst" :sortable="true">
        <template #body="slotProps">
          <div :class="cityClass(slotProps.data)">
            {{ slotProps.data.D }}
          </div>
        </template>
      </Column>
      <Column
        style="display: none;"
        field="DepTZ"
        header="DepTZ"
        :sortable="true"
      >
      </Column>
      <Column field="schDep" header="SchDep" :sortable="true"> </Column>
      <Column field="schArr" header="SchArr" :sortable="true"> </Column>
      <Column field="arrDelay" header="arrDelay" :sortable="true"> </Column>
      <Column field="depDelay" header="depDelay" :sortable="true"> </Column>
      <Column field="tail" header="tail" :sortable="true"> </Column>
      <Column field="rotAvail" header="AvailRot" :sortable="true"> </Column>
      <Column field="nbConn" header="nbConn" :sortable="true"> </Column>
    </DataTable>
  </div>
</template>

<script>
import * as u from "../Composition/utils.js";
import { IO_works, ensureConditionIsMet } from "../Composition/IO_works.js";
import { ref, reactive, isReactive, computed, watch } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import { findCityInCityMap } from "../Composition/graphSupport.js";
import { colorByCity } from "../Composition/graphImpl.js";
import { useStore } from "vuex";
import { onMounted } from "vue";

export default {
  components: { DataTable, Column, InputText },
  props: {
    filePath: String,
  },
  setup(props) {
    const store = useStore();
    const inputCity = ref(null); // variable in component
    const newCity = ref(null); // variable in component
    const idClass = ref();
    const idEnter = ref();
    const idExit = ref();
    const enteredCity = ref("");
    const nbRows = ref(0);
    const fullGraph = ref(null);
    const nodesTable = ref(null);
    const isFullDataLoaded = ref(false);

    // Asynchronous so do this as early as possible, before onMounted()
    //console.log("*** TOP of CityTable.vue, before store.dispatch");
    store.dispatch("getTableDataFromFileNew", props.filePath);

    // CityTable should not require the graph immediately.
    // Another component can generate the graph in the proper
    // time in the life cycle.

    // Get the graph in CityGraph component before onBeforeMount
    // In CityTable component, attach the data to the graph
    // in onBeforeMount. Do this in the multiple graph components if
    // there is more than one.

    // watch(store.getters.fullGraph, (curVal) => {
    // Why isn't this watch activated when fullGraph goes from
    // null to a non-null value?
    watch(fullGraph, (curVal) => {
      const f = store.getters.fullGraph;
      //console.log("**** watcher, fullGraph, top of CityTable");
      //console.log(curVal);
      //console.log(`nbNodes: ${curVal.nbNodes}`);
      //console.log(curVal.nbEdges);
    });

    // function filterAndUpdateTable(city, data) {
    //   const filteredData = filterData(data, city);
    //   nbRows.value = filteredData.nodes.length;
    //   store.commit("setGraphData", filteredData);
    //   // There is watcher for nodesTable
    //   store.commit("setTableData", filteredData.nodes);
    //   // Update city table
    //   const tableNodes = u.dataForCityTable(filteredData.nodes);
    //   nodesTable.value = tableNodes;
    // }

    const nodes = computed(() => {
      return store.getters.nodes;
    });
    const edges = computed(() => {
      return store.getters.edges;
    });
    const graphData = computed(() => {
      return store.getters.graphData;
    });
    const allGraphData = computed(() => store.getters.allGraphData);
    const city = computed(() => {
      //console.log("Inside DataTable, computed city, getters.city");
      return store.getters.city;
    });
    const graph = computed(() => {
      //console.log("DataTable Style:: compute Graph");
      return store.getters.graph;
    });

    watch(city, (cityValue, oldValue) => {
      //console.log("DataTable: inside watch city");
      //u.print("watch, cityTable, allGraphData", allGraphData);
      const graph = store.getters.graph;
      //const data = store.getters.allGraphData;
      // both graph data and graph must be available
      // graph is created before the data is retrieved.
      if (graph && allGraphData.value && cityValue) {
        u.print("allGraphData", allGraphData);
        u.print("cityValue", cityValue);
        // Compute values are refs
        u.filterAndUpdateTable(cityValue, allGraphData.value);
        //console.log("colorByCity");

        // Color edges and nodes according to delays. Why should this 
        // function be in CityTable? It should be in CityGraph ***
        colorByCity(graph, cityValue);
      }
    });

    const isDataLoaded = computed(() => {
      return store.getters.isDataLoaded;
    });

    watch(isDataLoaded, () => {
      //console.log("Watch isDataLoaded");
      const data = store.getters.allGraphData;
      const city = store.getters.city;
      const obj = u.filterAndUpdateTable(city, data);
      enteredCity.value = city;
      nbRows.value = obj.nbRows;
      nodesTable.value = obj.tableNodes;
    });

    onMounted(() => {
      //console.log(">>>>> CityTable, Inside onMounted (this) <<<<<");

      const timeout = 20000; // ms
      try {
        // Asynch function.
        ensureConditionIsMet(timeout, () => {
          return isDataLoaded.value === true;
        }).then(() => {
          //console.log(
            //"==> inside then of ensureCondition, Exp, Mounted, Data read succesfully!!"
          //);
        });
      } catch (error) {
        console.log("ERROR in ensureConditionIsMet in CityTable");
        console.log("Data not read correctly");
      }

      idEnter.value = (nodeId) => {
        const graph = store.getters.graph; // ERROR!! HOW IS THIS possible?
        const node = graph.findById(nodeId); // node structure
        graph.setItemState(node, "table", true); // nodeId or node should work
      };
      idExit.value = (nodeId) => {
        const graph = store.getters.graph;
        const node = graph.findById(nodeId); //.value[nodeId]; // node structure
        graph.setItemState(node, "table", false); // Set the state 'hover' of the item to be true
      };
      idClass.value = (id) => {
        const graph = store.getters.graph;
        return [
          {
            idbackgroundhover: id === graph.value.hoverItemId,
            idbackgrounddefault: id !== graph.value.hoverItemId,
          },
        ];
      };
    });

    // Event handler: must be a method, not a computed value
    // Can only be called AFTER the graph and table are rendered
    // since an InputText element is used to enter data.
    const confirmEntry = () => {
      // Allow city entry in any case, and with less characters than
      // the full name.
      newCity.value = inputCity.value.toUpperCase();
      //console.log("inside confirmEntry");
      const cityMap = store.getters.cityMap; // proxy to an array
      // Allow for abbreviated and lowercase entries
      newCity.value = findCityInCityMap(newCity.value, cityMap);
      enteredCity.value = newCity.value;
      store.commit("setCity", newCity.value);

      const data = store.getters.allGraphData;
      // should not need Graph. Just the node list.
      inputCity.value = ""; // reset text box to empty string
      const obj = u.filterAndUpdateTable(newCity.value, data);
      //console.log("obj");
      //console.log(obj);
      nbRows.value = obj.nbRows;
      nodesTable.value = obj.tableNodes;
      const graph = store.getters.graph;
      if (graph) colorByCity(graph, newCity.value); // ERROR
    };

    // Color cities that match table title
    const cityClass = (data) => {
      return [
        {
          origclass: newCity.value === data.O,
          destclass: newCity.value === data.D,
          defaultodclass: newCity.value !== data.O && newCity.value !== data.D,
        },
      ];
    };

    return {
      nodesTable,
      nodes,
      inputCity,
      newCity,
      enteredCity,
      nbRows,
      confirmEntry,
      cityClass,
      idClass,
      idEnter,
      idExit,
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
