<template>
  <div v-if="isPending">loading...</div>
  <div v-else-if="data">{{ data }}</div>
  <div v-else-if="error">Something is wrong</div>
</template>

<script>
import { analyzeData } from "../Composition/AnalyzeData.js";
import { analyzeData3 } from "../Composition/AnalyzeData3.js";
import * as u from "../Composition/utils.js";
import io from "../Composition/IO_works";
import { createApp, ref, watchEffect } from "vue";
import { useFetch } from "../Composition/IO_works.js";

function get3files(url1, url2, url3) {
  // file1, ..., file3, are refs
  const { data: dFSU, error: e1, isPending: pend1 } = useFetch(() => url1);
  const { data: dBookings, error: e2, isPending: pend2 } = useFetch(() => url2);
  const { data: dTails, error: e3, isPending: pend3 } = useFetch(() => url3);
  watchEffect(() => {
    if (dBookings.value && dTails.value && dFSU.value) {
      analyzeData3(dFSU.value, dBookings.value, dTails.value);
    }
  });
  return { dBookings, dTails, e1, e2, pend1, pend2 };
}

function get2files(url1, url2) {
  const { data: dBookings, error: e1, isPending: pend1 } = useFetch(() => url1);
  const { data: dTails, error: e2, isPending: pend2 } = useFetch(() => url2);

  watchEffect(() => {
    if (dBookings.value && dTails.value) {
      analyzeData(dBookings.value, dTails.value);
    }
  });
  return { dBookings, dTails, e1, e2, pend1, pend2 };
}

//analyzeData3(bookings, tails, fsu) {

export default {
  props: { id: Number },
  setup(props) {
    // const { d1, d2, e1, e2, pend1, pend2 } = get2files(
    // "./data/bookings_oneday.json",
    // "./data/tail_pairs.json"
    // );
    const { d1, d2, d3, e1, e2, e3, pend1, pend2, pend3 } = get3files(
      "./data/node_attributes.json",
      "./data/bookings_oneday.json",
      "./data/tail_pairs.json"
    );
    const data = d1; // ref
    const error = e1; // ref
    const isPending = pend1; // ref

    return {
      data,
      error,
      isPending,
    };
  },
};
</script>
