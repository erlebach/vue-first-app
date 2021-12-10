<template>
  <div>
    <h2>Hello World</h2>
    <div id="mountGraph"></div>
  </div>
</template>

<script>
import * as dp from "../Composition/delayPropagationGraphImpl.js";
import * as u from "../Composition/utils.js";
import G6 from "@antv/g6";
import { onMounted } from "vue";

function generateNodesEdges1() {
  const gNodes = [{ id: "1" }, { id: "2" }, { id: "3" }];
  const gEdges = [
    { source: "1", target: "2" },
    { source: "1", target: "3" },
  ];
  return { nodes: gNodes, edges: gEdges };
}
function generateNodesEdges2() {
  const gNodes = [{ id: "1" }, { id: "2" }];
  const gEdges = [{ source: "1", target: "2" }];
  return { nodes: gNodes, edges: gEdges };
}

export default {
  setup() {
    let graphCreated = false;
    let graph = false;

    const graphConfiguration = dp.setupConfiguration({
      container: "mountGraph",
      width: "800",
      height: "600",
      defaultNodeSize: 40,
    });

    function drawGraph1() {
      const data = generateNodesEdges1();

      if (graphCreated) {
        //graph.destroy();
        graph.clear();
      }
      graph = new G6.Graph(graphConfiguration); // ERROR
      graphCreated = true;
      graph.data(data); // combines data and render
      graph.render();
      u.print("graph", graph);

      return;
    }
    function drawGraph2() {
      const data = generateNodesEdges2();

      if (graphCreated) {
        //graph.destroy();
        graph.clear();
      }
      graph = new G6.Graph(graphConfiguration); // ERROR
      graphCreated = true;
      graph.data(data); // combines data and render
      graph.render();
      u.print("graph", graph);

      return;
    }

    onMounted(() => {
      drawGraph2();
      drawGraph1();
    });
  },
};
</script>
