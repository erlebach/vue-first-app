<template>
  <div class="p-d-flex flex-start">
    <div>
      <FlightsInAirTable filePath="./data/bookings_oneday.json" /> -->
      <DelayPropagationTable />
    </div>
  </div>
</template>

<script>
import DelayPropagationTable from "./DelayPropagationTable.vue";
import FlightsInAirTable from "./FlightsInAirTable.vue";

export default {
  components: {
    DelayPropagationTable,
    FlightsInAirTable,
  },
};
</script>

<style></style>
