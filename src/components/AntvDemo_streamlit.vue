<template>
  <div class="p-d-flex flex-start">
    <div>
      <FlightsInAirTable filePath="./data/bookings_oneday.json" />
      <FlightsInAirEndpointTable />
      <DelayPropagationTable tiers="2" />
      <DelayPropagationGraph width="1200" height="800" />
    </div>
  </div>
</template>

<script>
import DelayPropagationTable from "./DelayPropagationTable.vue";
import DelayPropagationGraph from "./DelayPropGraph.vue";
import FlightsInAirTable from "./FlightsInAirTable.vue";
import FlightsInAirEndpointTable from "./FlightsInAirEndpointTable.vue";

export default {
  components: {
    DelayPropagationTable,
    DelayPropagationGraph,
    FlightsInAirTable,
    FlightsInAirEndpointTable,
  },
};
</script>

<style></style>
