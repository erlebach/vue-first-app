<template>
  <div><h3>Are you there?</h3></div>
  <!-- <div v-if="load.isDataLoaded_"> -->
  <!-- worked -->
  <div v-if="iisDataLoaded">
    <h1>Hello Gordon!</h1>
  </div>
</template>

<script>
import { ref, watch, computed } from "vue";
import { LoadTable } from "../Composition/loadTable.js";

export default {
  setup() {
    const filePath = "./data/bookings_oneday.json";
    const load = new LoadTable(filePath);
    const iisDataLoaded = ref(false);

    const obj = { product: "car", id: "a345" };
    const objref = ref(obj);
    console.log("objref");
    console.log(objref);
    console.log(objref.value);
    console.log(objref.value.product);
    // const prodName = computed(() => objref.product);
    // console.log("prodName= ");
    // console.log(prodName); // a ComputeRef
    // console.log(prodName.value); // undefined
    // console.log("=======================");

    // const iisDataLoaded = compute(() => {
    //   return load.isDataLoaded();
    //   //return load.isDataLoaded_;
    // });

    watch(load.isDataLoaded_, (c, o) => {
      if (c === true) {
        iisDataLoaded.value = true;
      }
    });

    load.loadData(); // async (greeting should appear when data loaded)

    //isDataLoaded.value = true;
    console.log("==== Test isDataLoaded");
    console.log(iisDataLoaded);

    return { iisDataLoaded, load };
  },
};
</script>
