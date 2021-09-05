<template>
  <div class="p-d-flex p-flex-column">
    <h4>node separation: {{ layout.nodeSep }}</h4>
    <!-- why do negative values have meaning? -->
    <Slider v-model="layout.nodeSep" :min="-100" :max="100" />
    <h4>Rank Separation: {{ layout.reankSep }}</h4>
    <Slider v-model="layout.rankSep" :step="5" :min="-60" :max="60" />

    <div class="ui" style="text-align:left;">
      <CheckBox
        id="controlPoints"
        v-model="layout.controlPoints"
        :binary="true"
      />
      <label class="ui" for="layout.controlPoints">Control Points</label>
    </div>

    <div>
      <h3>RankDir/Alignment</h3>
      <PanelMenu :model="menuItems" />
    </div>
  </div>
</template>

<script>
import Slider from "primevue/slider";
import CheckBox from "primevue/checkbox";
import RadioButton from "primevue/radiobutton";
import PanelMenu from "primevue/panelmenu";
import { reactive, ref, watch } from "vue";
import { useStore } from "vuex";

export default {
  components: { CheckBox, Slider, PanelMenu },
  setup() {
    const store = useStore();
    const city = ref();
    const layout = reactive({
      type: "dagre",
      nodeSep: 50,
      rankSep: 50,
      controlPoints: false,
      align: undefined,
    });

    store.commit("setDagreLayout", layout);

    watch(layout, () => {
      store.commit("setDagreLayout", layout);
      const graph = store.getters.graph;
      graph.updateLayout(layout);
      // graph.layout() does nothing.
      graph.render();
    });

    const alignMenu = [
      {
        label: "UR",
        command: () => {
          layout.align = "UR";
        },
      },
      {
        label: "UL",
        command: () => {
          layout.align = "UL";
        },
      },
      {
        label: "Center",
        command: () => {
          layout.align = undefined;
        },
      },
      {
        label: "DL",
        command: () => {
          layout.align = "DL";
        },
      },
      {
        label: "DR",
        command: () => {
          layout.align = "DR";
        },
      },
    ];

    const rankDirMenu = ref([
      {
        label: "TB",
        command: () => {
          layout.rankDir = "TB";
        },
      },
      {
        label: "BT",
        command: () => {
          layout.rankDir = "BT";
        },
      },
      {
        label: "LR",
        command: () => {
          layout.rankDir = "LR";
        },
      },
      {
        label: "RL",
        command: () => {
          layout.rankDir = "RL";
        },
      },
    ]);

    const menuItems = reactive([
      { label: "Rank Dir", items: rankDirMenu },
      { label: "Align", items: alignMenu },
    ]);

    return { layout, city, menuItems };
  },
};
</script>
