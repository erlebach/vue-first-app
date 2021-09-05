<template>
  <div class="p-d-flex p-flex-column">
    <h3>Link Distance: {{ layout.linkDistance }}</h3>
    <Slider v-model="layout.linkDistance" :step="5" :min="-60" :max="60" />
    <h3>Node Size: {{ layout.nodeSize }}</h3>
    <Slider v-model="layout.nodeSize" :step="5" :min="-160" :max="160" />
    <h3>Sweep: {{ layout.sweep }}</h3>
    <Slider v-model="layout.sweep" :step="5" :min="0" :max="360" />
    <h3>Max Level Diff: {{ layout.maxLevelDiff }}</h3>
    <Slider v-model="layout.maxLevelDiff" :step="5" :min="0" :max="20" />

    <div class="ui" style="text-align:left;">
      <CheckBox
        id="preventOverlap"
        v-model="layout.preventOverlap"
        :binary="true"
      />
      <label class="ui" for="layout.preventOverlap">Prevent Overlap</label>
    </div>
    <div class="ui" style="text-align:left;">
      <CheckBox
        id="doEquidistant"
        v-model="layout.equidistant"
        :binary="true"
      />
      <label class="ui" for="layout.doEquidistant">Equidistant</label>
    </div>
  </div>
</template>

<script>
import Slider from "primevue/slider";
import CheckBox from "primevue/checkbox";
import { ref, reactive, computed, watch } from "vue";
import { useStore } from "vuex";

export default {
  components: { CheckBox, Slider },
  setup() {
    const store = useStore();
    const layout = reactive({
      type: "concentric",
      linkDistance: 5,
      nodeSize: 10,
      sweep: 360.0,
      maxLevelDiff: 0.5,
      preventOverlap: true,
      equidistant: true,
    });

    store.commit("setConcentricLayout", layout);

    watch(layout, () => {
      store.commit("setConcentricLayout", layout);
      const graph = store.getters.graph;
      graph.get("layoutController");
      // console.log("call graph.layout");

      graph.updateLayout(layout);

      // This routine does nothing even when parameters change. BUG?
      // graph.layout(); // Always relayout

      graph.render(); // Do not know if required
    });

    return { layout };
  },
};
</script>
