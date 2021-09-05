<template>
  <ModalView v-if="showHelp">
    <!-- should run over the page. Not change flow -->
    <div style="font-size:1.5em; font-weight:bold; padding=5px">
      <h2 style="margin:5px">Color Legend</h2>
      <h3 style="margin:5px; margin-top:15px">InFlight</h3>
      <div style="color:green;font-weight:bold">
        AIR: in the air
      </div>
      <div style="color:red;">
        GROUND: on the ground
      </div>

      <h3 style="margin:5px;margin-top:15px">Arrival Status</h3>
      <div style="color:green">
        EARLY: The plane arrived at the gate ahead of schedule
      </div>
      <div style="color:red">
        LATE: The plane arrived at the gate behind schedule
      </div>

      <h3 style="margin:5px; margin-top:15px">Departure/Arrival Delays</h3>
      <div style="color:green; ">
        &lt; 0 min
      </div>
      <div style="color:orange">
        0 - 15 min
      </div>
      <div style="color:red">
        15 - 30 min
      </div>
      <div style="color:darkred">
        30 - 45 min
      </div>
      <div style="color:brown">
        45 - 60 min
      </div>
      <div style="color:black">
        &gt; 60 min
      </div>

      <h3 style="margin:5px; margin-top:15px">Rotations</h3>
      <div style="color:green">
      0-45 min
      </div>
      <div style="color:red">
      &gt; 45 min
      </div>

    </div>
  </ModalView>
</template>

<script>
import { useKeydown } from "../Composition/useKeydown.js";
import ModalView from "./ModalView.vue";
import { ref } from "vue";
export default {
  components: { ModalView },
  setup() {
    const showHelp = ref(false);
    useKeydown([
      {
        key: "h",
        fn: (event) =>
          (showHelp.value = showHelp.value === false ? true : false),
      },
    ]);
    return { showHelp };
  },
};
</script>
