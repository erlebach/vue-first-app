<template>
  <panel header="Layouts" :toggleable="true">
    <Button class="ui" @click="centerGraph" label="Center Graph" />
    <h3>Active Layout: {{ activeLayout.header }}</h3>
    <Accordion @tab-open="clickTab($event)">
      <AccordionTab header="Dagre" @click="toggle">
        <!-- <OverlayPanel
          ref="op"
          appendTo="body"
          :showCloseIcon="true"
          id="overlay_panel"
          style="width: 450px; height: 300px"
          :breakpoints="{ '960px': '75vw' }"
        > -->
        <h5>Hello</h5>
        <DagreLayout></DagreLayout>
        <!-- </OverlayPanel> -->
      </AccordionTab>
      <AccordionTab header="Concentric">
        <ConcentricLayout></ConcentricLayout>
      </AccordionTab>
      <AccordionTab header="Random Force">
        <RandomForceLayout></RandomForceLayout>
      </AccordionTab>
    </Accordion>
  </panel>
</template>

<script>
import * as u from "../Composition/utils.js";
import { useStore } from "vuex";
import { boundingBox } from "../Composition/graphImpl.js";
import { ref, reactive } from "vue";
import Panel from "primevue/panel";
import Button from "primevue/button";
import Accordion from "primevue/accordion";
import AccordionTab from "primevue/accordiontab";
import ConcentricLayout from "./ConcentricLayout.vue";
import DagreLayout from "./DagreLayout.vue";
import RandomForceLayout from "./RandomForceLayout.vue";
// import OverlayPanel from "primevue/overlaypanel";
import { onMounted } from "vue";

export default {
  components: {
    Accordion,
    AccordionTab,
    Panel,
    // OverlayPanel,
    Button,
    ConcentricLayout,
    DagreLayout,
    RandomForceLayout,
  },
  setup() {
    const store = useStore();
    const activeLayout = reactive({
      layout: "concentric",
      header: "Concentric",
    });
    const op = ref();
    const toggle = (event) => {
      op.value.toggle(event);
    };

    const centerGraph = () => {
      const graph = store.getters.graph;
      //const layout = graph.get("layout");
      boundingBox(graph);
      // Must render in order to x,y coordinates
      // "group" not defined
      const bbox = graph.get("group").getCanvasBBox();
      graph.fitView(); // Not clear this is required
      graph.render(); // Not clear this is required
    };

    const clickTab = (event) => {
      const graph = store.getters.graph;
      const nodes = graph.getNodes();
      const coords = u.getCoords(graph); // works
      const oldLayout = store.getters.dagreLayout;
      //coords.forEach((xy) => {
      //console.log([xy.x, xy.y]);
      //});
      // console.log("===============================");
      // console.log(`event.index: ${event.index}`);

      // SAVE THE COORDINATES to the store
      const layoutType = activeLayout.layout;
      //u.saveGraphCoords(graph, layoutType);
      //const c = u.loadGraphCoords(graph, "concentric");
      // console.log("======================================");
      // console.log(`activeLayout: ${layoutType}`);

      graph.set("layout", {}); // reset the layout.
      // Ideally, I want to save previous settings
      // and have a reset to default button for each layout.
      // Put layouts in overlay panels that are draggable.
      // I should also save the coordinates of all the nodes.

      // switch to a new layout, by clicking a tab
      switch (event.index) {
        case 0: {
          const newLayout = store.getters.dagreLayout;
          graph.updateLayout(newLayout);
          Object.assign(activeLayout, {
            layout: "dagre",
            header: "Dagre",
          });
          break;
        }
        case 1: {
          const newLayout = store.getters.concentricLayout;
          graph.updateLayout(newLayout);
          Object.assign(activeLayout, {
            layout: "concentric",
            header: "Concentric",
          });
          break;
        }
        case 2: {
          const newLayout = store.getters.randomForceLayout;
          graph.updateLayout(newLayout);
          Object.assign(activeLayout, {
            layout: "force",
            header: "Random Force",
          });
          // The click changes the layout, but then convergence continues
          // as if it were RandomForce. WHY?
          break;
        }
      }
      u.loadGraphCoords(graph, activeLayout);
      store.commit("setActiveLayout", activeLayout);
      store.commit("setGraph", graph);
      // console.log("*** graph render, layout: ");
      // console.log(graph);
      const layout = graph.get("layout");
      // console.log("graph.getLayout():");
      // console.log(layout);
      graph.render();
    };

    onMounted(() => {
      console.log(">>>>> Layouts, Inside onMounted (this) <<<<<");
    });
    return { centerGraph, clickTab, activeLayout, op, toggle };
  },
};
</script>
