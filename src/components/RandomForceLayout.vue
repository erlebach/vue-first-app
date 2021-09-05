<template>
  <div class="p-d-flex p-flex-column">
    <h3>Link Distance: {{ layout.linkDistance }}</h3>
    <Slider v-model="layout.linkDistance" :step="5" :min="0" :max="100" />
    <h3>Node Size: {{ layout.nodeSize }}</h3>
    <Slider v-model="layout.nodeSize" :step="5" :min="0" :max="60" />
    <h3>Node Strength: {{ layout.nodeStrength }}</h3>
    <Slider v-model="layout.nodeStrength" :step="10" :min="-200" :max="200" />
    <h3>Edge Strength: {{ layout.edgeStrength }}</h3>
    <Slider v-model="layout.edgeStrength" :step="0.1" :min="0" :max="1" />
    <h3>Collide Strength: {{ layout.collideStrength }}</h3>
    <Slider v-model="layout.collideStrength" :step="0.1" :min="0" :max="1" />
    <h3>Alpha:: {{ layout.alpha }}</h3>
    <Slider v-model="layout.alpha" :min="0" :step="0.1" :max="1" />
    <h3>Alpha Decay: {{ layout.alphaDecay }}</h3>
    <Slider v-model="layout.alphaDecay" :min="0" :step="0.1" :max="1" />
    <h3>Alpha Min: {{ layout.alphaMin }}</h3>
    <Slider v-model="layout.alphaMin" :min="0" :step="0.1" :max="1" />
    <h3>Node Spacing: {{ layout.nodeSpacing }}</h3>
    <Slider v-model="layout.nodeSpacing" :min="0" :step="10" :max="100" />
    <h4>Cluster Node Strength: {{ layout.clusterNodeStrength }}</h4>
    <Slider
      v-model="layout.clusterNodeStrength"
      :min="-10"
      :step="0.1"
      :max="10"
    />
    <h4>Cluster Edge Strength: {{ layout.clusterEdgeStrength }}</h4>
    <Slider
      v-model="layout.clusterEdgeStrength"
      :min="0"
      :step="0.1"
      :max="1"
    />
    <h4>Cluster Edge Distance: {{ layout.clusterEdgeDistance }}</h4>
    <Slider
      v-model="layout.clusterEdgeDistance"
      :min="0"
      :step="10"
      :max="200"
    />
    <h4>Cluster Foci Strength: {{ clusterFociStrength }}</h4>
    <Slider
      v-model="layout.clusterFociStrength"
      :min="0"
      :step="0.2"
      :max="2"
    />

    <div class="ui" style="text-align:left;">
      <CheckBox
        id="doClustering"
        v-model="layout.doClustering"
        :binary="true"
      />
      <label class="ui" for="layout.doClustering">Clustering</label>
    </div>

    <div class="ui" style="text-align:left;">
      <CheckBox
        id="doControlPoints"
        v-model="layout.doPreventOverlap"
        :binary="true"
      />
      <label class="ui" for="layout.doPreventOverlap">Prevent Overlap</label>
    </div>
  </div>
</template>

<script>
import Slider from "primevue/slider";
import CheckBox from "primevue/checkbox";
import { reactive, watch } from "vue";
import { useStore } from "vuex";

export default {
  components: { Slider, CheckBox },
  setup() {
    const store = useStore();
    const layout = reactive({
      type: "force",
      linkDistance: 50,
      nodeSize: 20,
      nodeStrength: 0,
      edgeStrength: 0,
      collideStrength: 1,
      alpha: 0.3,
      alphaDecay: 0.028,
      alphaMin: 0.001,
      nodeSpacing: 10,
      clusterNodeStrength: -1,
      clusterEdgeStrength: 0.2,
      clusterEdgeDistance: 50,
      clusterFociStrength: 0.5,
      doclustering: false,
      doPreventOverlap: false,
    });

    store.commit("setRandomForceLayout", layout);

    watch(layout, () => {
      store.commit("setRandomForceLayout", layout);
      const graph = store.getters.graph;
      graph.updateLayout(layout);
      // graph.layout() does nothing. It should do something!
    });

    return { layout };
  },
};
</script>
